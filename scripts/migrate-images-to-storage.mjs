// Migra imagens que ainda estao em base64 dentro do Postgres para o bucket
// publico `public-assets`, trocando o valor da coluna pela URL publica.
//
// POR QUE: crawler de rede social (WhatsApp/Facebook/Instagram) nao le imagem
// em data URI — enquanto o logo estiver em base64, o card de compartilhamento
// cai no icone generico da marca em vez da foto do prestador. Alem disso,
// base64 no banco infla toda consulta que traz providers/portfolio_photos.
//
// COMO RODAR (a service_role key nunca fica em arquivo; passe na hora):
//   # 1. Simulacao (nao escreve nada) — sempre rode isso primeiro:
//   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/migrate-images-to-storage.mjs
//   # 2. Execucao real:
//   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/migrate-images-to-storage.mjs --apply
//
// No PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY="xxx"; node scripts/...
//
// Idempotente: o que ja e URL (http...) e ignorado, entao rodar duas vezes
// nao duplica nem reprocessa nada.

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APPLY = process.argv.includes('--apply')
const BUCKET = 'public-assets'

// Cada alvo: tabela, coluna da imagem, chave primaria e a "pasta" no bucket.
const TARGETS = [
  { table: 'providers', column: 'logo_url', key: 'id', folder: 'providers/logos' },
  { table: 'providers', column: 'hero_banner_url', key: 'id', folder: 'providers/banners' },
  { table: 'provider_resources', column: 'photo_url', key: 'id', folder: 'resources/photos' },
  { table: 'portfolio_photos', column: 'image_base64', key: 'id', folder: 'portfolio' },
  { table: 'platform_settings', column: 'brand_logo_url', key: 'id', folder: 'brand' },
  { table: 'platform_settings', column: 'brand_logotype_url', key: 'id', folder: 'brand' },
]

function readEnv() {
  const env = { ...process.env }
  for (const file of ['.env.local', '.env']) {
    const path = resolve(projectRoot, file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (match && !env[match[1]]) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = readEnv()
const baseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!baseUrl || !serviceKey) {
  console.error('Faltou VITE_SUPABASE_URL (.env.local) ou SUPABASE_SERVICE_ROLE_KEY (variavel de ambiente).')
  console.error('A service_role key fica no painel do Supabase em Settings > API. Nao salve ela em arquivo.')
  process.exit(1)
}

const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

function parseDataUri(value) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(value)
  if (!match) return null
  const contentType = match[1] || 'image/jpeg'
  const isBase64 = Boolean(match[2])
  const buffer = isBase64 ? Buffer.from(match[3], 'base64') : Buffer.from(decodeURIComponent(match[3]), 'utf8')
  const extension = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[contentType] || 'jpg'
  return { buffer, contentType, extension }
}

async function uploadToStorage(folder, parsed) {
  const path = `${folder}/${crypto.randomUUID()}.${parsed.extension}`
  const response = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': parsed.contentType, 'Cache-Control': '31536000' },
    body: parsed.buffer,
  })
  if (!response.ok) throw new Error(`upload falhou (${response.status}): ${await response.text()}`)
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`
}

async function updateRow(table, key, keyValue, column, publicUrl) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}?${key}=eq.${encodeURIComponent(keyValue)}`, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ [column]: publicUrl }),
  })
  if (!response.ok) throw new Error(`update falhou (${response.status}): ${await response.text()}`)
}

let totalPending = 0
let totalMigrated = 0
let totalBytes = 0
const failures = []

for (const target of TARGETS) {
  const url = `${baseUrl}/rest/v1/${target.table}?select=${target.key},${target.column}`
  const response = await fetch(url, { headers: authHeaders })
  if (!response.ok) {
    console.warn(`[skip] ${target.table}.${target.column}: ${response.status} ${await response.text()}`)
    continue
  }

  const rows = await response.json()
  const pending = rows.filter((row) => {
    const value = row[target.column]
    return typeof value === 'string' && value.startsWith('data:')
  })

  if (pending.length === 0) {
    console.log(`[ok]   ${target.table}.${target.column}: nada em base64.`)
    continue
  }

  totalPending += pending.length
  for (const row of pending) {
    const parsed = parseDataUri(row[target.column])
    if (!parsed) {
      failures.push(`${target.table}.${target.column} #${row[target.key]}: data URI ilegivel`)
      continue
    }
    const sizeKb = Math.round(parsed.buffer.length / 1024)
    totalBytes += parsed.buffer.length

    if (!APPLY) {
      console.log(`[dry]  ${target.table}.${target.column} #${row[target.key]} — ${sizeKb} KB ${parsed.contentType}`)
      continue
    }

    try {
      const publicUrl = await uploadToStorage(target.folder, parsed)
      await updateRow(target.table, target.key, row[target.key], target.column, publicUrl)
      totalMigrated += 1
      console.log(`[move] ${target.table}.${target.column} #${row[target.key]} — ${sizeKb} KB -> ${publicUrl}`)
    } catch (error) {
      failures.push(`${target.table}.${target.column} #${row[target.key]}: ${error.message}`)
    }
  }
}

console.log('')
if (APPLY) {
  console.log(`Concluido: ${totalMigrated}/${totalPending} imagens migradas (${Math.round(totalBytes / 1024)} KB tirados do banco).`)
} else {
  console.log(`Simulacao: ${totalPending} imagens em base64 (${Math.round(totalBytes / 1024)} KB). Rode de novo com --apply para migrar.`)
}
if (failures.length > 0) {
  console.log(`\n${failures.length} falha(s):`)
  failures.forEach((failure) => console.log(`  - ${failure}`))
  process.exitCode = 1
}
