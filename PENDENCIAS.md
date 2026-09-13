# Pendências — Meu Serviço Online

Registro controlado de pendências do projeto, separado do `guia_claudinha.md` (que documenta arquitetura/decisões/gotchas). Objetivo: permitir que múltiplas sessões/agentes trabalhem no projeto sabendo o que já foi feito, o que está em aberto, sem redescobrir os mesmos achados nem duplicar trabalho.

## Como usar (dinâmica completa)

**IDs**: formato `PEND-XXX`, sequencial, atribuído uma vez e nunca reaproveitado — mesmo se o item for apagado depois, o número dele fica reservado (não existe "buraco pra preencher"). Pra criar um item novo, o próximo ID é sempre `maior número já usado no arquivo (incluindo os já apagados, ver seção final) + 1`. Hoje o maior ID já usado é `PEND-037` — o próximo item novo é `PEND-038`, mesmo o arquivo não tendo mais `PEND-004`/`PEND-017` na lista visível.

**Status — significado exato de cada um** (usar sempre um destes, nunca inventar sinônimo tipo "pendente"/"feito"/"ok"):
- `aberto` — ninguém está trabalhando nele agora. Qualquer sessão/agente pode pegar.
- `em andamento` — alguém está trabalhando **agora**. Antes de mudar um item pra esse status, confirme que ele não está já `em andamento` por outra sessão (esse projeto já teve conflito real de duas sessões mexendo no mesmo arquivo ao mesmo tempo, ver `guia_claudinha.md` §3). Ao marcar, inclua quem/quando entre parênteses, ex: `em andamento (sessão 2026-09-12, revisão de RLS)`.
- `parcial` — parte do trabalho foi feita, mas sobrou algo explícito. A nota do item **tem que dizer exatamente o que falta** (não basta "quase pronto").
- `concluído` — feito e verificado (rodou/leu o código pra confirmar, não só "acho que sim"). A nota do item cita a evidência: arquivo:linha, comando rodado, ou captura de tela. Se o trabalho foi feito mas falta só uma verificação (ex: visual), o status leva um `*` (ex: `concluído*`) e a nota explica o que falta verificar — **isso não é a mesma coisa que `parcial`** (parcial = falta trabalho; `concluído*` = trabalho pronto, falta só confirmar).
- `bloqueado` — não avança por decisão externa/de negócio, não por dificuldade técnica. A nota tem que dizer quem/o que está bloqueando.
- `mesclado` — o item é redundante com outro (mesma causa raiz) e foi absorvido por ele. A nota **tem que dizer em qual ID** o trabalho continua — quem for agir, age no outro ID, não neste. Existe pra nunca ter dois itens abertos cobrindo a mesma coisa (ver regra de não-redundância abaixo).

**Não-redundância (regra adicionada em 2026-09-12)**: antes de criar um item novo, checar se a causa raiz já está coberta por outro — se estiver, **expandir o item existente** em vez de abrir um novo, ou marcar o novo como `mesclado` apontando pro existente. Jefferson foi explícito sobre isso: pendência fragmentada/redundante vai contra o princípio de "amigável/simples" que vale pro projeto inteiro, inclusive pra forma como isso aqui é organizado.

**Ciclo de vida de um item — passo a passo, sem ambiguidade**:
1. Antes de começar qualquer item, ler o status atual dele. Se já `em andamento`, não mexer sem confirmar com o Jefferson.
2. Ao começar: mudar pra `em andamento` (na tabela-resumo E na seção detalhada — as duas têm que sempre bater, nunca uma sem a outra).
3. Ao terminar: mudar pra `concluído`/`concluído*`/`parcial`/`bloqueado` (o que se aplicar) com uma frase de evidência.
4. **Nunca apagar um item por iniciativa própria** — mesmo resolvido, ele vira registro histórico (é o que permite qualquer sessão saber "isso já foi tentado/feito" sem redescobrir). O default é sempre marcar status, nunca remover a linha.
5. **Apagar de vez (remover a linha inteira, tabela + seção detalhada) só acontece quando o Jefferson pedir isso explicitamente pra aquele(s) item(ns) especificamente** (ex.: "apaga o PEND-004", "pode apagar as pagas") — nunca por decisão própria do agente, mesmo que o item pareça irrelevante ou resolvido. Isso já aconteceu em 2026-09-12 (PEND-004 e PEND-017 removidos a pedido, por envolverem custo) — por isso o próximo ID novo é 028, não reaproveita 004/017 (ver regra de IDs acima).

**Contexto de produto** (avaliação de 2026-08-29): a proposta tem 3 pilares — (1) prestador divulgar o serviço nas redes sociais/anúncio, (2) alcançar clientes, (3) gestão de agendamento. Hoje (3) é o mais maduro, (1) é o mais fraco.

**Última verificação completa**: 2026-09-12 — todos os itens `concluído` e uma amostra representativa dos `aberto` reconfirmados direto no código atual (não só assumidos pelo histórico). Nada mudou de status.

## Resumo

| ID | Categoria | Prioridade | Status | Título |
|----|-----------|-----------|--------|--------|
| PEND-001 | Produto | Alta | concluído | Mostrar origem/canal no Desempenho da loja |
| PEND-002 | Produto | Média | concluído | Botões de compartilhamento social no desktop |
| PEND-003 | Produto | Média | concluído | Diretório navegável por categoria |
| PEND-005 | Produto | Baixa | parcial | Avaliação/nota de cliente (review) |
| PEND-006 | Arquitetura | Baixa | parcial | SEO (SSR/prerendering) |
| PEND-007 | Produto | Baixa | concluído | Foto/portfólio por recurso individual |
| PEND-008 | Produto | Baixa | bloqueado | Cliente com conta própria |
| PEND-009 | Dados | Baixa | concluído | Remover colunas legadas de `providers` |
| PEND-010 | Dados | Baixa | parcial | Mover uploads base64 pra Supabase Storage |
| PEND-011 | Arquitetura | Baixa | concluído | URLs públicas por prestador (sem hash) |
| PEND-012 | Documentação | Baixa | concluído | Consolidar documentação duplicada + migration órfã |
| PEND-013 | Segurança | Média | concluído | `provider_resources` fora da hierarquia (representante) |
| PEND-014 | Ferramental/QA | Média | parcial | Melhorar capacidade de verificação/QA do projeto |
| PEND-015 | Segurança | **Crítica** | concluído | RLS ausente em `schema.sql` para 4 tabelas |
| PEND-016 | UI/UX | Baixa | concluído | Cores de tema hardcoded/espalhadas em `App.css` |
| PEND-018 | UI/UX | Média | concluído* | Reorganização de "Minha loja" (falta verificação visual completa) |
| PEND-019 | Arquitetura | Média | bloqueado | Bundle único sem code-splitting |
| PEND-028 | UI/UX | Baixa | mesclado em PEND-030 | Texto sem acentuação em `shareProviderLinkOn` |
| PEND-029 | UI/UX | Média | parcial | Navegação do prestador burocrática/técnica demais |
| PEND-030 | UI/UX | Baixa | aberto | Texto sem acentuação espalhado em várias strings novas (16 ocorrências) |
| PEND-031 | Produto | — | concluído | Painel de contabilidade (admin master) — ledger manual receita/despesa/CAC |
| PEND-032 | UI/UX | Média | parcial | Polimento de acessibilidade e feedback de UI (nível "produto maduro") |
| PEND-033 | Arquitetura | — | bloqueado | Levar o projeto ao "nível Outlook" |
| PEND-034 | UI/UX | Média | parcial | Sistema visual (profundidade/tipografia) em todo o projeto |
| PEND-035 | UI/UX | Alta | parcial | Alinhamento e espaçamento global para sensação de segurança |
| PEND-036 | Produto | Média | concluído | Aviso proativo de "clientes sem retorno" na Agenda |
| PEND-037 | Produto | Alta | concluído | Descoberta da loja a custo zero (og:image, QR Code, sitemap, JSON-LD) |

## Em aberto

### PEND-001 — Produto — Alta — **concluído**
**Mostrar origem/canal no "Desempenho da loja"**
O dado já existia (`analytics_events.source`), faltava agregar/exibir. Implementado no diff pendente de 2026-09-12: `App.jsx:1365-1372` agrega por `source`, prop `sourceBreakdown` passada pra `StorePerformance.jsx:54-65` com `sourceLabel()` traduzindo canais pra PT. **Falta só commitar.**

### PEND-002 — Produto — Média — **concluído**
**Botões de compartilhamento por rede social no desktop**
Concluído em 2026-09-12: adicionados botões Facebook/Telegram para link da loja e convite, com URLs web oficiais de compartilhamento. Verificado com `npm run build` e `npm run lint`.

### PEND-003 — Produto — Média — **concluído**
**Diretório navegável por categoria**
Concluído em 2026-09-12: adicionado filtro `<select>` por categoria usando `providers.category`, combinado com busca textual existente. Verificado com `npm run build` e `npm run lint`.

### PEND-005 — Produto — Baixa — **parcial**
**Avaliação/nota de cliente (review)**
Parcial em 2026-09-12: criada tabela `booking_reviews`, RLS básica e formulário de avaliação após agendamento; reviews entram como `pendente`. Falta UI de moderação/aprovação e exibição pública de reviews aprovados.

### PEND-006 — Arquitetura — Baixa — **parcial**
**SEO**
Parcial em 2026-09-12: links públicos passaram a ser gerados como `/loja/<slug>`, `/agendar/<slug>`, `/cliente/<token>`, `/prestador/<token>` e `/representante/<token>`, mantendo fallback por hash. Smoke e2e valida `/loja/clinica-vida-plena-p1` e `/agendar/clinica-vida-plena-p1`. SEO real por SSR/prerendering continua bloqueado por mudança de arquitetura.

### PEND-007 — Produto — Baixa — **concluído**
**Foto/portfólio por recurso individual**
Concluído em 2026-09-12: UI de upload/remoção de foto adicionada no editor de recursos, persistindo em `provider_resources.photo_url`. Verificado com `npm run build` e `npm run lint`.

### PEND-008 — Produto — Baixa — **bloqueado**
**Cliente com conta própria**
Bloqueado por decisão de fluxo: mudaria o agendamento público sem login. `client_accounts` segue preparado no schema/RLS, mas falta decidir quando exigir conta e como migrar clientes existentes.

### PEND-009 — Dados — Baixa — **concluído**
**Remover colunas legadas**
Concluído em 2026-09-12: removidas de `schema.sql`, `seed.sql` e criada migration `20260912120000_drop_legacy_provider_service_fields.sql`. Verificado com `npm run build`, `npm run lint` e `npm run test`.

### PEND-010 — Dados — Baixa — **parcial**
**Mover uploads de logo/imagens pra Supabase Storage**
Parcial em 2026-09-12: criada migration `20260912130000_public_assets_storage.sql` com bucket público `public-assets`; uploads novos de logo, marca, recurso e portfólio tentam Storage e caem para base64 se Storage falhar. Falta migrar base64 antigo já salvo no banco e aplicar a migration no Supabase.

**Ferramenta de migração retroativa pronta (2026-09-13)**: `scripts/migrate-images-to-storage.mjs` (`npm run migrate-images`) varre as 6 colunas de imagem (`providers.logo_url`/`hero_banner_url`, `provider_resources.photo_url`, `portfolio_photos.image_base64`, `platform_settings.brand_logo_url`/`brand_logotype_url`), sobe cada data URI pro bucket e troca o valor pela URL pública. É **dry-run por padrão** (só lista o que faria) — precisa de `--apply` pra escrever — e idempotente (ignora o que já é URL).

**Por que isso importa além de tamanho de banco**: enquanto o logo estiver em base64, o `og:image` do PEND-037 cai no ícone genérico, porque crawler de WhatsApp/Facebook não lê data URI. Checagem no banco de teste em 2026-09-13: **3 prestadores com logo em base64, 1 sem logo, nenhum com URL pública** — ou seja, hoje nenhum card de compartilhamento mostra a foto da loja.

**Ainda não executado**: o script precisa da `SUPABASE_SERVICE_ROLE_KEY` (policy do bucket exige `authenticated` pra escrever, e a anon key do `.env.local` não serve). Essa chave fica no painel do Supabase (Settings > API) e não deve ser salva em arquivo — passar como variável de ambiente só na hora de rodar. Quem for executar: rodar primeiro sem `--apply` pra conferir a lista, depois com `--apply`.

### PEND-011 — Arquitetura — Baixa — **concluído**
**URLs públicas por prestador** (`/clinica-vida-plena` em vez de `#loja=`)
Concluído em 2026-09-12 com rotas limpas explícitas (`/loja/<slug>` e `/agendar/<slug>`) usando rewrite SPA já existente no `vercel.json`; hashes antigos continuam aceitos. Verificado com build/lint/test.

### PEND-012 — Documentação — Baixa — **concluído**
**Consolidar documentação duplicada + resolver migration órfã**
Concluído em 2026-09-12: seção "Critérios mínimos para uso em produção real" resgatada para `guia_claudinha.md`; removidos `Guia_claudin.md` e `supabase/portfolio_migration.sql`.

### PEND-013 — Segurança — Média — **concluído**
**`provider_resources` fora da migração de hierarquia**
Concluído em 2026-09-12: `schema.sql` e migration `20260912110000_provider_resources_hierarchy_policy.sql` passaram `provider_resources` para `can_manage_provider(provider_id)`. Verificado com `npm run build` e `npm run lint`.

### PEND-014 — Ferramental/QA — Média — **parcial**
**Melhorar capacidade de verificação/QA do projeto**
Parcial em 2026-09-12: instalados Playwright, Vitest, Testing Library e jsdom; adicionados scripts `test`/`test:e2e`, config Playwright, testes iniciais e workflow `.github/workflows/ci.yml` com lint/test/build. Verificados: `npm run test`, `npm run test:e2e`, `npm run build`, `npm run lint`. Ainda falta pgTAP/Supabase diff e cobertura maior. **Escopo ampliado (2026-09-12)**: inclui também visibilidade de erro em produção pro admin — hoje `ErrorBoundary` só loga em `console.error` do navegador de quem sofreu o erro, e os 33 `alert()` do app só aparecem pra quem clicou, nunca chegam até o Jefferson. Resolver isso é (a) instalar Sentry (ou similar) e (b) dar um lugar dentro do painel admin pra ele ver isso — as duas partes são a mesma necessidade (ver erro sem depender do prestador avisar), não itens separados.

### PEND-015 — Segurança — **Crítica** — **concluído**
**RLS ausente em `schema.sql` para 4 tabelas**
Concluído em 2026-09-12: `schema.sql` agora habilita RLS em `platform_representatives`, `representative_invites`, `provider_accounts` e `client_accounts`, inclui funções de hierarquia e policies restritivas. Verificado por revisão do SQL e `npm run build`/`npm run lint`.

### PEND-016 — UI/UX — Baixa — **concluído**
**Cores de tema por estilo de loja hardcoded e espalhadas**
Concluído em 2026-09-12: fallbacks principais centralizados em `--store-professional`, `--store-warm` e `--store-premium`. Verificado com build/lint.

### PEND-018 — UI/UX — Média — **concluído** (falta verificação visual)
**Reorganização de "Minha loja"**
Campos reagrupados por assunto (Identidade/Vitrine/Marketing), blocos secundários viraram acordeões (`<details className="collapsibleBlock">`), layout 2 colunas com prévia `sticky` a partir de `1180px`, duplicidade de `termsText` removida. Feito em `App.jsx`/`App.css` (bloco a partir de `App.jsx:3938`). `npm run build`/`npm run lint` passam sem erro novo. **Falta**: nenhuma verificação visual real foi feita ainda (sem credencial de teste na sessão original, sem ferramenta de browser nas sessões seguintes) — depende de PEND-014 (Playwright) ou de login manual do Jefferson conferindo cada sub-aba.

### PEND-019 — Arquitetura — Média — **bloqueado**
**Bundle único sem code-splitting**
Bloqueado por refactor estrutural: `App.jsx` ainda concentra cliente/prestador/admin/representante. Build segue avisando chunk grande. Resolver exige separar telas por papel antes de aplicar `React.lazy` com segurança.

### PEND-028 — UI/UX — Baixa — **mesclado em PEND-030**
**Texto sem acentuação em `shareProviderLinkOn`**
`App.jsx:2723` — mesma causa raiz do PEND-030 (texto sem acento em código novo). Consolidado lá em 2026-09-12 pra não ter dois itens cobrindo o mesmo tipo de bug — resolver junto com a lista do PEND-030, não separado.

### PEND-029 — UI/UX — Média — parcial
**Navegação do prestador burocrática/técnica demais**
Jefferson reportou (2026-09-12) que a área do prestador está "muito burocrática e precisando de informação técnica" — não é essa a proposta do produto (público-alvo é autônomo não-técnico: barbeiro, eletricista etc.). Confirmou que pesam dois fatores juntos:
1. **Jargão técnico exposto direto**: campos "Meta Pixel ID" e "Google Tag ID" (`App.jsx:4576-4587`, aba Marketing) com placeholder tipo `G-XXXXXXXXXX ou AW-XXXXXXXXX` — vocabulário de analista de tráfego pago, não de dono de barbearia. Fica dentro de um `<details>` recolhido por padrão, mas o rótulo visível do próprio acordeão ("Avançado — Meta Pixel e Google Tag") já expõe o jargão.
2. **Profundidade de navegação**: 5 abas no topo (Agenda/Serviços/Clientes/Desempenho/Minha loja) + dentro de "Minha loja" mais 5 sub-abas (Identidade/Vitrine/Recursos/Marketing/Convite), cada uma com blocos colapsáveis internos — vários cliques pra configurar algo simples, sensação de formulário grande em vez de setup rápido.
Não tem CNPJ/CPF/documento fiscal obrigatório em lugar nenhum — não é burocracia no sentido de papelada, é jargão + profundidade de UI.

Parcial em 2026-09-13: rótulo técnico "Avançado — Meta Pixel e Google Tag" virou "Rastreamento de anúncios (avançado)", com explicação simples; seção de fotos foi reorganizada com 1 ação principal ("Foto principal da sua loja"), galeria secundária em acordeão e foto por link externo como opção avançada. Verificado com `npm run build` e `npm run lint`. Falta reduzir a profundidade geral das abas/sub-abas da área "Minha loja".

**Exemplo concreto do mesmo problema + design aprovado (2026-09-13)**: bloco "Fotos e banners" (`App.jsx`, dentro de `providerProfileTab === 'vitrine'`, por volta da linha 4360 — **em edição ativa por outra sessão agora**, linha pode ter mudado) tinha 3 conceitos com o mesmo peso visual (Banner / Fotos da vitrine / Foto por link da internet), rótulo "Banner" é jargão de web, e nenhuma hierarquia de "o que fazer primeiro". Jefferson aprovou o redesenho abaixo — usar como referência quando for mexer nessa seção (ou em qualquer outra com o mesmo padrão de "N opções iguais sem hierarquia"):
- **1 ação principal em destaque**: "Foto principal da sua loja" (renomeado de "Banner"), botão grande/central, com uma frase dizendo onde ela aparece.
- **Galeria como secundária**, dentro de um `<details>`/acordeão: "Mais fotos (galeria)".
- **Link de foto externa como a opção menos comum**, também dentro de acordeão, rotulado "Usar foto que já está na internet (avançado)" — é a opção que mais confunde iniciante (por que colar link em vez de enviar arquivo?), por isso fica por último e oculta.
- Manter a ideia de prévia visual (o outro agente já começou um painel mostrando "onde cada imagem aparece" — é o caminho certo, só faltava a hierarquia acima).

### PEND-030 — UI/UX — Baixa — aberto
**Texto sem acentuação espalhado em várias strings novas** (inclui o PEND-028, mesclado aqui)
Achado ao validar o princípio "amigável, sem jargão técnico" (2026-09-12), reconferido no mesmo dia e a lista cresceu de 8 pra 16 ocorrências — texto sem acento em strings visíveis pro prestador/cliente, todas em código adicionado recentemente:
- `App.jsx:1060` — `'Nao foi possivel carregar o portfolio desse prestador.'`
- `App.jsx:1959` — `'Novo servico'` (nome padrão de serviço novo)
- `App.jsx:1982` — `alert('Nao foi possivel salvar o novo servico no banco de dados.')`
- `App.jsx:2003` — `alert('Nao foi possivel salvar esse servico no banco de dados.')`
- `App.jsx:2088` — `alert('Nao foi possivel remover esse servico no banco de dados.')`
- `App.jsx:2145` — `'Nao foi possivel salvar essa foto no banco de dados.'`
- `App.jsx:2180` — `'Nao foi possivel salvar a legenda da foto.'`
- `App.jsx:2189` — `'Nao foi possivel remover essa foto.'`
- `App.jsx:2439` — `'Nao foi possivel definir a senha de acesso.'`
- `App.jsx:2461` — mesma mensagem (`'Nao foi possivel definir a senha de acesso.'`)
- `App.jsx:2474` — `'...mas nao foi possivel concluir o vinculo do convite.'`
- `App.jsx:2483` — `'Nao foi possivel criar o acesso direto.'`
- `App.jsx:~2720` — `shareProviderLinkOn`: `'Ola! Voce pode agendar seu atendimento comigo por este link...'` (função irmã `shareProviderLink`, linha 2707, usa corretamente `"Olá! Você..."`)
- `App.jsx:3384` — `placeholder="Buscar servico ou cidade"`
- `App.jsx:5016` — `Catalogo de servicos`
- `App.jsx:5020` — `Adicionar servico`
- `App.jsx:5064` — `Foto do servico`
Não é mojibake (`fix-encoding.mjs` não pega, texto é ASCII válido só sem os acentos certos) — é o mesmo padrão de digitação sem acentuação repetido em muitos lugares. Não é "técnico", mas pesa contra o critério de "amigável": mensagem de erro/alerta com português quebrado passa impressão de app mal cuidado pro público leigo que é o foco do produto. Correção: adicionar acentuação correta (Não/possível/serviço/vínculo/catálogo/Olá/Você) nas 16 linhas acima, tudo de uma vez — mesma causa, mesmo tipo de correção pontual, sem risco. **Ainda não corrigido** (reconfirmado em 2026-09-12, ver conversa).

### PEND-031 — Produto — concluído
**Painel de contabilidade (admin master)**
Feature nova pedida por Jefferson (2026-09-12): ledger manual de receita/despesa, visível **só pro admin master** (`session.isMasterAdmin`), pra acompanhar margem e calcular CAC de tráfego pago — não é billing real, não tem Stripe/Mercado Pago integrado, é controle interno manual.

Implementado:
- Tabela `finance_entries` (`schema.sql` + `supabase/migrations/20260912150000_finance_entries.sql`) — RLS restrita a `is_master_admin()`, sem policy pra `anon` nem authenticated comum (nenhum prestador/representante/cliente acessa).
- Nova aba "Contabilidade" no admin (guard duplo `session.isMasterAdmin`), com 2 sub-abas: **Resumo** (cards de receita/despesa/margem/margem% do período + calculadora de CAC) e **Lançamentos** (CRUD do ledger, categoria em lista fixa pra não quebrar o cálculo de CAC por typo).
- `App.jsx`: `mapFinanceEntryRow`, `FINANCE_CATEGORY_OPTIONS`, fetch em `fetchCriticalData`/`fetchBackgroundData`, `createFinanceEntry`/`updateFinanceEntry`/`removeFinanceEntry` (mesmo padrão otimista+alert de erro do resto do app, com acentuação correta).

Verificado: `npm run build`, `npm run lint` (0 erro/warning novo) e `npm run test` (3/3 passando). **Não commitado ainda.** Plano completo em `C:\Users\jeffe\.claude\plans\humming-booping-giraffe.md`.

### PEND-032 — UI/UX — Média — parcial
**Polimento de acessibilidade e feedback de UI (nível "produto maduro")**
Achado ao comparar a maturidade visual do projeto contra um produto de referência de alto polimento (Outlook, 2026-09-12) — não é sobre jargão/navegação (isso é PEND-029) nem texto sem acento (PEND-030), é sobre o nível de acabamento da interação em si:
1. **Navegação por teclado quase inexistente** — `tabIndex`/`onKeyDown` aparecem só 1 vez em todo `App.jsx`. Um produto maduro é 100% operável por teclado (foco visível, tab order lógico); hoje depende quase só do mouse/touch.
2. **Cobertura de `aria-*`/`alt` inconsistente entre módulos** — boa no `App.jsx` (84 ocorrências), mas cai muito nos componentes extraídos (`AccountSecurity.jsx`, `ClientServiceHistory.jsx` só 2 cada).
3. **`alert()` nativo do navegador como padrão de erro** — 33 ocorrências. Produtos maduros nunca usam alerta de navegador (feio, bloqueia a tela, sem estilo da marca); o padrão esperado é toast ou mensagem inline no próprio formulário.
Parcial em 2026-09-12: criado toast próprio com `role="status"`/`aria-live="polite"` e removidas as ocorrências de `alert()` nativo do app (`rg "alert\\(" src` sem resultado). Falta revisar navegação por teclado e cobertura `aria-*` módulo a módulo.

### PEND-033 — Arquitetura — **bloqueado**
**Levar o projeto ao "nível Outlook"**
Pedido explícito de Jefferson (2026-09-12), depois de eu comparar a maturidade de UI do projeto contra o Outlook como régua. **Bloqueado por descompasso de escala, não por decisão de negócio nem dificuldade técnica pontual**: Outlook é produto de bilhões de dólares, décadas de refinamento, times dedicados de acessibilidade/QA/performance — não é uma lacuna que se fecha com uma lista de correções, é uma diferença de ordem de investimento e tempo. Não existe um "próximo passo técnico" que resolva isso como os outros itens desta lista resolvem os deles.
O que **é** realista e já está mapeado: PEND-029 (jargão/navegação), PEND-030 (acentuação), PEND-032 (acessibilidade/feedback de UI) representam o teto de polimento alcançável nesse projeto/orçamento — resolver os três leva o produto a "profissional pro tamanho dele" (nível de concorrente early-stage tipo Trinks/Fresha no início), não a "nível Outlook". Este item fica registrado como o teto declarado pelo Jefferson, mas sem plano de ação — só desbloqueia se a régua de comparação for revista (ex.: mudar o orçamento/escopo do projeto de vez).

### PEND-034 — UI/UX — Média — parcial
**Sistema visual (profundidade/tipografia) em todo o projeto**
Jefferson avaliou o painel como "não sofisticado, não moderno, não amigável" (2026-09-13) — achado real, distinto do PEND-032 (que é sobre acessibilidade/`alert()`, não sobre acabamento visual). Diagnóstico: `App.css` (4000+ linhas) usa cor centralizada (resolvido no PEND-016), mas é praticamente todo chapado — só 50 ocorrências de `box-shadow`/`gradient`/`transition` no arquivo inteiro, nenhum par de fontes definido (usa só a fonte do sistema), radius uniforme sem variar por papel do elemento.

Protótipo aprovado com a proposta de direção: [artefato "Antes e Depois — Minha Loja"](https://claude.ai/code/artifact/cf21e302-1b67-451c-af6c-a696a1724edf) (recriação da aba Marketing) — usa Manrope (títulos/UI) + Source Sans 3 (corpo), sombra em camadas nos cards/botão principal, radius variando por papel (card vs. controle), gradiente sutil só no acento dourado da marca (não em tudo).

**Escopo real: projeto inteiro, não só essa tela** — aplicar isso só em "Minha loja" deixaria o resto do app com contraste pior, não melhor. Isso é um trabalho grande (equivalente a criar um mini design system em cima do `App.css` existente): 1) importar as 2 fontes e definir os tokens de tipografia; 2) adicionar tokens de sombra/radius por papel (`--shadow-card`, `--shadow-button` etc.) sem quebrar as ~4000 linhas de CSS existentes; 3) aplicar nos componentes mais visíveis primeiro (cards, botão primário, abas ativas, prévia de landing) antes de varrer o resto.

Parcial em 2026-09-13: adicionados Manrope + Source Sans 3, tokens globais de tipografia/sombra/radius e aplicação inicial em painéis, cards, métricas, botões primários, abas e editores. Segunda passada em "Minha loja": checklist visual de preparo da página, abas renomeadas para linguagem mais simples (Loja/Fotos e textos/Equipe/Confiança/Compartilhar) e prévia com acabamento de painel. Verificado com `npm run build` e `npm run lint`. Falta varrer telas secundárias e fazer revisão visual completa.

### PEND-035 — UI/UX — Alta — parcial
**Alinhamento e espaçamento global para sensação de segurança**
Jefferson apontou (2026-09-13) que o alinhamento/espaçamento precisa ser muito bem feito em todo o projeto para passar visão de produto seguro/confiável. Causa raiz: muitos `gap`, `padding` e `margin` definidos manualmente em `App.css`, gerando telas ora grudadas, ora abertas demais.

Parcial em 2026-09-13: adicionados tokens globais `--space-xs/sm/md/lg/xl/page` e normalizado o ritmo de `workspace`, `topbar`, grids, painéis, headers, listas, formulários, abas, gestão, email, cards públicos, settings, uploaders e editor "Minha loja". Corrigido também o caso visual reportado em anexo: `ProviderManagementRow` agora usa colunas estáveis, status com largura completa e ação final alinhada à direita. A auditoria foi ampliada para clientes, agendamentos, privacidade/governança, solicitações, recursos públicos e depoimentos; no mobile, linhas complexas passam a empilhar controles sem colisão. A inspeção visual real encontrou e corrigiu ainda o desalinhamento entre marca e mensagem nos estados de carregamento/erro em telas pequenas. Login, loja pública e agendamento foram inspecionados visualmente com dados reais em desktop e celular, sem novas colisões. `tests/e2e/layout.spec.js` cobre rotas públicas e fixtures dos principais workspaces em 390/760/768/900/970/1440px. Verificado com `npm run build`, `npm run lint`, `npm test` e `npm run test:e2e` (35 testes). Falta somente a varredura visual autenticada das telas internas; o projeto não documenta uma conta de demonstração.

### PEND-036 — Produto — Média — concluído
**Aviso proativo de "clientes sem retorno" na Agenda**
Contexto (2026-09-13): discussão sobre retenção via WhatsApp — o sistema de status de cliente (`relationshipStatus`, `App.jsx:1362-1377`) e o botão "Recontatar" (WhatsApp pré-preenchido, grátis, `buildWhatsAppLink`) já existiam, mas ficavam escondidos dentro de um filtro na aba Clientes — o prestador só via se lembrasse de entrar lá. Automação real (disparo sem clique humano) exigiria WhatsApp Business API paga; essa versão gratuita só precisava ficar mais visível.

Implementado: banner clicável no topo da aba **Agenda** (a aba padrão de entrada do prestador) — aparece só quando `clientsWithoutReturn > 0`, mostra a contagem, e ao clicar leva direto pra aba Clientes já filtrada em "Sem retorno" (`App.jsx:5127-5136`, classe nova `.followUpBanner` em `App.css`, reaproveitando `.unsavedBanner` como base). Verificado com `npm run build` e `npm run lint` (sem erro/warning novo).

### PEND-037 — Produto — Alta — concluído
**Descoberta da loja a custo zero (og:image, QR Code, sitemap, JSON-LD)**
Contexto (2026-09-13): Jefferson pediu formas de melhorar "o cliente achar o prestador" sem nenhum custo. Auditoria achou 4 lacunas gratuitas de resolver — todas implementadas nesta sessão:

1. **`og:image` + `og:url` + `twitter:card`** (`App.jsx`, efeito de SEO da landing pública): o link já tinha título/descrição dinâmicos, mas **sem imagem** — compartilhar no WhatsApp/Instagram gerava card cinza sem foto, matando clique. Agora usa o logo do prestador quando ele é URL pública (bucket `public-assets`, migration `20260912130000`); logo em base64 legado cai no ícone da marca, porque crawler não lê data URI.
2. **QR Code do link da loja** (aba Minha loja → Vitrine, ao lado de Copiar/Facebook/Telegram): gera PNG 512px baixável, pra imprimir em cartão, vitrine ou espelho — abre descoberta offline, que pro público-alvo (prestador de bairro) provavelmente rende mais que SEO. Lib `qrcode` entra por **import dinâmico**, então fica em chunk separado (23 KB) e não pesa o bundle que o cliente da loja pública baixa.
3. **`sitemap.xml` gerado no build** (`scripts/generate-sitemap.mjs`, roda no `prebuild`): lista home + loja de cada prestador ativo/aprovado, consultando o Supabase via REST. Falha de rede/credencial **não quebra o build** — gera sitemap só com a home e segue. Domínio configurável por `VITE_PUBLIC_SITE_URL` (padrão: `meuservicopro.vercel.app`).
4. **`robots.txt`** (`public/robots.txt`): libera `/loja/` e `/agendar/`, **bloqueia** `/cliente/`, `/prestador/` e `/representante/` — são links com token pessoal, não podem ser indexados.
5. **JSON-LD `LocalBusiness`**: nome, descrição, categoria, telefone e endereço (bairro/rua) estruturados pro Google entender que é negócio local.

Verificado: `npm run build` (sitemap gerou 5 URLs reais do banco de teste), `npm run lint` e `npm run test` (3/3) — sem erro ou warning novo. **Não commitado.**
Nota: a parte de SEO aqui é complementar ao PEND-006 (SSR/prerendering), não substitui — sem SSR o conteúdo ainda depende do Googlebot executar JS; o que foi feito garante que ele ao menos **descubra** as URLs e veja metadados corretos.

## Concluídas (registro histórico)

**PEND-020** — UI/UX — concluído — Contraste do `.eyebrow` abaixo do mínimo WCAG AA. Corrigido: passou a usar `var(--text-soft)` em vez de `var(--accent)`.

**PEND-021** — UI/UX — concluído — Seção "Atendimento" renderizava quase vazia. Corrigido: `hasLocationInfo` passou a exigir `neighborhood`/`address`, não dispara mais só com `serviceMode`.

**PEND-022** — UI/UX — concluído — Placeholder de foto de serviço parecia imagem quebrada. Corrigido: `.cardImagePlaceholder` ganhou texto "Sem foto" e estilo neutro.

**PEND-023** — UI/UX — concluído — Badge "Carrinho" sobrepunha o card do hero no mobile. Corrigido: `.floatingCartWrap` movido pra `bottom:14px` em `max-width:600px`.

**PEND-024** — UI/UX — concluído — Sublinhado do destaque do hero parecia link clicável sem ser. Corrigido: virou badge (fundo+borda) em vez de `border-bottom`.

**PEND-025** — Dados — concluído — `supabase/seed.sql` sem acentuação. Corrigido: seed reescrito com acentuação correta.

**PEND-026** — UI/UX — parcial — Amarelo saturado repetido demais na mesma tela. `--accent` global trocado de amarelo saturado pra dourado mais escuro (`#d4aa00`), pesos de fonte reduzidos (800/900→700) e raios de borda menos redondos em vários componentes. A cor ainda viva na loja de demonstração (`clinica-vida-plena-p1`) é dado salvo daquele prestador (`theme.accent`), não mais valor padrão do código.

**PEND-027** — Arquitetura — concluído — Error Boundary ausente (falha de render derrubava a SPA inteira pra tela branca). Corrigido: `src/components/ErrorBoundary.jsx` criado (class component, `getDerivedStateFromError`+`componentDidCatch`), envolve `<App />` em `main.jsx`. Revisado em auditoria de 2026-09-12: implementação correta. Ainda não commitado.
