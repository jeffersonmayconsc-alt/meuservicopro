// Gera public/sitemap.xml listando a home e a loja publica de cada prestador
// ativo/aprovado. Sem isso, o buscador nao tem como descobrir que existem N
// lojas — a SPA so expoe esses caminhos depois que o JS roda, e o crawler
// precisa de uma lista pra saber o que visitar.
//
// Roda no prebuild (ver package.json). Falha de rede/credencial NAO quebra o
// build: nesse caso gera um sitemap minimo so com a home, porque deploy
// bloqueado por sitemap seria pior que sitemap incompleto.

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(projectRoot, 'public/sitemap.xml')

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

function xmlEscape(value) {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char])
}

function buildSitemap(siteUrl, providers) {
  const today = new Date().toISOString().slice(0, 10)
  const entries = [
    { loc: siteUrl, priority: '1.0', changefreq: 'weekly' },
    ...providers.map((provider) => ({
      loc: `${siteUrl}/loja/${provider.slug || provider.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ]
  const body = entries
    .map((entry) => `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

async function fetchActiveProviders(env) {
  const baseUrl = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (!baseUrl || !anonKey || baseUrl.includes('your-project')) return null

  const url = `${baseUrl.replace(/\/$/, '')}/rest/v1/providers?select=id,slug,active,approval_status&active=eq.true`
  const response = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`Supabase respondeu ${response.status}`)
  const rows = await response.json()
  return rows.filter((row) => !row.approval_status || row.approval_status === 'aprovado')
}

const env = readEnv()
const siteUrl = (env.VITE_PUBLIC_SITE_URL || 'https://meuservicopro.vercel.app').replace(/\/$/, '')

let providers = []
try {
  const fetched = await fetchActiveProviders(env)
  if (fetched === null) {
    console.warn('[sitemap] credenciais do Supabase ausentes — gerando sitemap só com a home.')
  } else {
    providers = fetched
  }
} catch (error) {
  console.warn(`[sitemap] não foi possível listar prestadores (${error.message}) — gerando sitemap só com a home.`)
}

writeFileSync(outputPath, buildSitemap(siteUrl, providers), 'utf8')
console.log(`[sitemap] ${providers.length + 1} URLs gravadas em public/sitemap.xml (base: ${siteUrl})`)
