// Corrige automaticamente texto corrompido por mojibake (UTF-8 lido/escrito
// como cp1252 em algum ponto do fluxo de edicao — comum em ferramentas
// Windows que usam PowerShell `Set-Content`/`Out-File`/`>` sem `-Encoding
// utf8`, ou qualquer editor/agente que salve arquivo com charset errado).
//
// Roda automaticamente antes de `npm run dev` e `npm run build` (ver
// package.json: "predev"/"prebuild"), entao mesmo que outra ferramenta
// reintroduza o problema, o proximo start/build do projeto conserta sozinho.
// Ver guia_claudinha.md secao "Gotchas conhecidos" para o contexto completo.
//
// IMPORTANTE — duas licoes que ja custaram uma rodada de dano real neste
// projeto e moldam o design abaixo:
//
// 1. A correcao roda por TRECHO (runs contiguos de caracteres nao-ASCII),
//    nao no arquivo inteiro de uma vez. Edicoes diferentes podem ter
//    corrompido o texto em profundidades diferentes (1 camada aqui, 3
//    camadas ali) — reverter o arquivo inteiro com o mesmo numero de passes
//    conserta uma parte e sobrecorrige outra, trocando caracter correto por
//    "�". Cada trecho e revertido ate o SEU proprio ponto de estabilidade.
//
// 2. A decisao de aplicar (ou nao) um passo NUNCA depende de "esse trecho
//    parece ter um Ã ou Â" — mojibake tambem aparece sem essas letras (ex.:
//    "•" corrompido vira "â€¢", sem nenhum Ã/Â). O criterio usado e
//    estrutural: um passo so e aceito se (a) NAO introduzir "�" novo
//    (= bytes que nao formam UTF-8 valido — sinal de estar revertendo texto
//    que ja estava correto) e (b) o resultado ocupar MENOS bytes em UTF-8
//    que o trecho original (mojibake sempre expande — varios caracteres
//    corrompidos colapsam em menos caracteres corretos ao reverter; texto
//    ja correto nunca encolhe desse jeito). As duas condicoes juntas nao
//    tem falso positivo em texto pt-BR real (ver comentario no fixChunk).

import iconv from 'iconv-lite'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOTS = ['src', 'supabase']
const EXTENSIONS = new Set(['.js', '.jsx', '.css', '.sql', '.md'])
const MAX_PASSES_PER_CHUNK = 5
const NON_ASCII_RUN = /[^\x00-\x7F]+/g

function listFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      out.push(...listFiles(full))
    } else if (EXTENSIONS.has(extname(entry))) {
      out.push(full)
    }
  }
  return out
}

function utf8Length(str) {
  return Buffer.byteLength(str, 'utf8')
}

// Tenta um unico passo de reversao "UTF-8 lido como win1252, salvo como
// UTF-8" ao contrario. So aceita se reduzir o tamanho em bytes (mojibake
// sempre expande) e o resultado nao tiver nenhum "�" (decode invalido =
// sinal de estar mexendo em texto que ja estava certo, OU de estar tentando
// "adivinhar" em cima de um byte que ja foi perdido — nos dois casos, nao
// aceitar e melhor que aceitar um palpite).
function tryReverseStep(chunk) {
  const attempt = iconv.decode(iconv.encode(chunk, 'win1252'), 'utf8')
  const gotSmaller = utf8Length(attempt) < utf8Length(chunk)

  if (!attempt.includes('�') && gotSmaller) return attempt
  return null
}

function fixChunk(chunk) {
  // Se o trecho já chega com "�", o dado original já foi perdido antes
  // deste script rodar (ex.: byte indefinido no cp1252 ao corromper "Á"/
  // "Í" maiúsculos pela primeira vez). Continuar tentando reverter a partir
  // daqui e só adivinhar — já aconteceu de virar silenciosamente uma letra
  // errada ("Í" -> "Ý") em vez de deixar visível que faltou informação.
  // Melhor deixar como está e reportar pra digitação manual.
  if (chunk.includes('�')) return { text: chunk, changed: false, passes: 0, unresolved: true }

  let text = chunk
  let passes = 0

  while (passes < MAX_PASSES_PER_CHUNK) {
    const next = tryReverseStep(text)
    if (next === null) break
    text = next
    passes += 1
  }

  return { text, changed: text !== chunk, passes, unresolved: text.includes('�') }
}

function fixFile(path) {
  const original = readFileSync(path, 'utf8')
  let totalChunksFixed = 0
  let hasUnresolved = false

  const fixed = original.replace(NON_ASCII_RUN, (chunk) => {
    const result = fixChunk(chunk)
    if (result.changed) totalChunksFixed += 1
    if (result.unresolved) hasUnresolved = true
    return result.text
  })

  if (fixed !== original) writeFileSync(path, fixed, 'utf8')

  return { changed: fixed !== original, chunksFixed: totalChunksFixed, hasUnresolved }
}

let fixedFiles = 0
let filesNeedingReview = []
for (const root of ROOTS) {
  let files
  try {
    files = listFiles(root)
  } catch {
    continue
  }
  for (const file of files) {
    const result = fixFile(file)
    if (result.changed) {
      fixedFiles += 1
      console.log(`[fix-encoding] corrigido (${result.chunksFixed} trecho${result.chunksFixed > 1 ? 's' : ''}): ${file}`)
    }
    if (result.hasUnresolved) filesNeedingReview.push(file)
  }
}

if (fixedFiles === 0 && filesNeedingReview.length === 0) {
  console.log('[fix-encoding] nenhum mojibake encontrado — tudo em UTF-8 valido.')
}

if (filesNeedingReview.length > 0) {
  console.warn(
    `[fix-encoding] AVISO: ${filesNeedingReview.length} arquivo(s) com caractere "�" que nao da pra recuperar automaticamente ` +
      '(dado original ja foi perdido antes deste script rodar — precisa digitar de novo manualmente): ' +
      filesNeedingReview.join(', '),
  )
}
