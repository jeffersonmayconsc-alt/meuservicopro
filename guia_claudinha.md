# guia_claudinha — manual operacional do Agenda Flex

Otimizado pra Claude entrar em conversas novas já com contexto. Lê §0–4 pra entender o projeto; consulta o resto sob demanda durante o trabalho.

---

## 0. Sobre o projeto

**Agenda Flex** (pasta `agendamento`) — SPA de agendamento multi-serviço, em fase de **homologação de fluxo** entre três papéis: cliente, prestador e admin.

**Propósito**: prestador de serviço (barbeiro, eletricista, clínica, personal trainer etc.) recebe um link próprio, o cliente agenda direto por ele sem ver outros prestadores, e o admin aprova/governa a plataforma.

**Não é**: produto em produção com dados reais de cliente, não tem autenticação real (login é só um seletor de papel), não tem multi-tenant por empresa — é uma plataforma única com N prestadores.

**Onde roda**: local, `npm run dev` (Vite), banco no Supabase Free (Postgres) compartilhado entre quem acessa o app.

---

## 1. Sobre o usuário e como Claude deve operar

- **pt-BR sempre.** Respostas curtas, sem narrativa longa.
- Mudança pequena/óbvia: codar direto. Mudança grande ou que altera schema: confirmar abordagem antes (o Jefferson já pediu planejamento bem detalhado em outros projetos — vale o mesmo padrão aqui).
- **Antes de dar uma mudança de frontend como pronta, rodar `npm run build`** (não só abrir no browser) — é o Vite/oxlint que pega erro de build de verdade.
- Specs de features maiores ficam em arquivos `*_SPEC.md` na raiz do projeto (ver [PORTFOLIO_SPEC.md](PORTFOLIO_SPEC.md) — catálogo de serviços + portfólio de fotos por prestador, implementado em migração compatível).

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 (`@vitejs/plugin-react`) |
| Estilização | CSS puro (`App.css`, `index.css`) — sem framework, sem CSS-in-JS |
| Ícones | lucide-react |
| Banco | Supabase (Postgres), client via `@supabase/supabase-js` |
| Lint | oxlint (`.oxlintrc.json` — plugins `react`+`oxc`, regra `react/rules-of-hooks` como erro) |
| Linguagem | JavaScript puro (`.jsx`), **sem TypeScript** |

Scripts (`package.json`): `npm run dev`, `npm run build` (Vite build — é o teste real de que nada quebrou), `npm run lint` (oxlint), `npm run preview`.

---

## 3. Arquitetura / arquivos

Projeto pequeno e **ainda não modularizado**: praticamente toda a aplicação vive em um único arquivo.

```
agendamento/
├── guia_claudinha.md         ← este arquivo
├── CLAUDE.md                 ← aponta pra este arquivo (carregado automaticamente)
├── PORTFOLIO_SPEC.md         ← spec de catálogo de serviços + portfólio
├── README.md                 ← visão de produto: o que está pronto, decisões de custo zero, roteiro de homologação
├── iniciar-projeto.bat       ← duplo clique: instala deps se faltar + roda `npm run dev -- --host 127.0.0.1`
├── vite.config.js            ← config mínima, só plugin react
├── .oxlintrc.json
├── .env.example / .env.local ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── src/
│   ├── main.jsx               entry point
│   ├── App.jsx                ⭐ TUDO: estado, mapeamento de linhas do banco, todas as telas (1750+ linhas)
│   ├── App.css                estilos de toda a UI (classes tipo `panel`, `tabs`, `shareBox`, `slotCard`...)
│   ├── index.css
│   ├── assets/
│   └── lib/
│       └── supabaseClient.js  createClient com as env vars; lança erro se faltar alguma
└── supabase/
    ├── schema.sql              ⭐ fonte da verdade do schema — todas as tabelas + RLS
    └── seed.sql                dados de demo (3 prestadores, réplica do antigo initialState do localStorage)
```

Se `App.jsx` continuar crescendo, o próximo passo natural é quebrar em `components/`, `hooks/` e `lib/mappers.js` — mas isso **não foi pedido ainda**, não fazer de propósito próprio.

---

## 4. Modelo de dados (Supabase)

Fonte da verdade: [supabase/schema.sql](supabase/schema.sql). Resumo:

| Tabela | O quê |
|---|---|
| `platform_settings` | linha única (`id=1`): marca da plataforma, regras de aprovação/antecedência/retorno/cancelamento, taxa da plataforma |
| `providers` | prestador: identidade (nome/categoria/cidade/logo/tema), destaques, convite (`invite_title/message/first_offer`), `approval_status`, `slug`. Colunas legadas `service`/`duration`/`price` ainda existem no schema compatível, mas o app usa `provider_services`. |
| `provider_services` | catálogo N:1 do prestador: nome, descrição, preço/modo de preço, duração opcional, ativo e posição |
| `portfolio_photos` | fotos base64 do prestador, gerais ou vinculadas a um serviço. Não entra no load inicial; é buscada sob demanda por prestador. |
| `bookings` | agendamento: prestador, `service_id` opcional, cliente (nome+contato direto na linha, sem FK), data/hora, status |
| `clients` | cliente único da plataforma, por contato |
| `provider_clients` | vínculo cliente↔prestador, com consentimento LGPD próprio por vínculo |
| `blocked_slots` | horário bloqueado manualmente pelo prestador |
| `privacy_requests` | solicitação de acesso/exclusão de dados pelo cliente |

Todas as tabelas têm **RLS habilitado com policy `anon_full_access` totalmente aberta** — decisão intencional documentada no topo do `schema.sql` e no README, porque não existe autenticação real nesta fase. **Não "corrigir" isso sem pedido explícito** — é risco conhecido e aceito, não bug.

IDs são gerados no client via `crypto.randomUUID()` (ver `App.jsx`), não no banco.

---

## 5. Papéis e navegação

Três papéis, sem senha real — login é um seletor (`session.role`: `cliente` | `prestador` | `admin`).

- **Cliente**: entra por link (`#agendar=ID_OU_SLUG` ou `#loja=ID_OU_SLUG`) ou pela busca geral. `#loja=` mostra a página de convite/vitrine; `#agendar=` vai direto pro formulário.
- **Prestador**: painel com abas Agenda / Serviços / Clientes / Insights + editor de identidade/convite/vitrine acima.
- **Admin**: gestão de prestadores (aprovar/pausar), marca da plataforma, parâmetros, governança LGPD.

**Página pública isolada (2026-08-25)**: quando `session.role === 'cliente' && publicProviderId` (visitante chegou por um link `#loja=`/`#agendar=` de um prestador específico), a app renderiza um `<main className="publicStorefront">` totalmente à parte — **sem** a sidebar/topbar internos, sem stats da plataforma, sem nada que sugira que existem outros prestadores. Motivo: a versão anterior reaproveitava o mesmo shell do painel interno pra essa página, e chegou a vazar contagem de "Prestadores"/"Clientes" da plataforma inteira numa página que devia ser 100% do prestador — feedback direto do Jefferson ("como pode ser um portfólio se aparece sinais de outra loja"). Esse branch isolado fica logo antes do `return` principal em `App.jsx` (`if (session.role === 'cliente' && publicProviderId && bookingService) { ... }`) e reaproveita as mesmas variáveis já computadas (`bookingService`, `filteredServices`, `createBooking` etc.) — só muda o wrapper visual. **Se adicionar conteúdo novo na página pública, adicionar nos dois lugares só se fizer sentido pro preview interno também** — o branch isolado é a versão real que o cliente vê.

**Campo `providers.about`** (texto "Sobre o negócio", multi-parágrafo, quebra por `\n`): editável no painel do prestador (seção "Vitrine"), exibido logo abaixo do hero na página pública. Adicionado junto com o isolamento acima pra dar ao prestador um espaço de vitrine de verdade, não só a mensagem curta de convite.

Link público: `providerPublicSlug()` gera `nome-slugificado-primeiros8charsdoID` (`App.jsx:62`).

---

## 6. Funcionalidades implementadas (estado atual)

Lista completa e atualizada fica no [README.md](README.md) (seção "O que está pronto") — **não duplicar aqui**, só linkar. Resumo de uma linha: cadastro/aprovação de prestador, agenda operacional com bloqueio de horário, gestão de clientes com alerta de recontato, painel admin com parâmetros e LGPD, personalização visual por prestador, persistência real via Supabase.

---

## 7. Como rodar

```powershell
cd "C:\Users\jeffe\OneDrive\Área de Trabalho\PROJETOS\agendamento"
npm install
npm run dev
```

Ou duplo clique em `iniciar-projeto.bat` (mesma coisa, com host fixo em `127.0.0.1:5173`).

Precisa de `.env.local` preenchido com `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (ver `.env.example`) e o projeto Supabase já rodado com `schema.sql` + `seed.sql` — passo a passo completo no README.

---

## 8. Convenções de código observadas

- **Mapeamento banco↔app**: cada tabela tem uma função `mapXRow(row)` no topo do `App.jsx` que converte `snake_case` do Postgres pra `camelCase` do app (ex.: `mapProviderRow`, `mapBookingRow`). Toda leitura do Supabase passa por essas funções — não ler `row.snake_case` direto em componente.
- **Colunas numéricas voltam como string do supabase-js** — os mappers já fazem `Number(...)` explícito (`price`, `platformFeePercent`). Lembrar disso ao adicionar coluna numérica nova.
- **Escrita otimista**: `updateData(producer)` atualiza o estado local na hora; a chamada Supabase roda em seguida e só dá `alert(...)` em caso de erro (não há rollback do estado otimista hoje).
- **Todo o app é 1 componente `App()` com dezenas de `useState`** — não há Context/Redux/Zustand. Estado derivado (listas filtradas, métricas) é recalculado inline a cada render, não memoizado.
- Sem CSS Modules/Tailwind: classes CSS descritivas direto (`panel`, `providerPanel`, `shareBox`, `slotCard`, `inviteEditor`...) definidas em `App.css`.

---

## 9. Cookbook — como faço pra…

### 9.1 Adicionar coluna nova numa tabela existente
1. `alter table` em `supabase/schema.sql` (é o arquivo que se roda manualmente no SQL Editor do Supabase — não há sistema de migration).
2. Atualizar `seed.sql` se fizer sentido ter dado de demo.
3. Atualizar o `mapXRow` correspondente em `App.jsx`.
4. Se for escrita: atualizar a função que faz o `supabase.from(...).update()/insert()` daquela tabela.
5. UI: adicionar o campo onde fizer sentido (painel do prestador, admin, etc.).

### 9.2 Adicionar tabela nova
1. `create table` em `schema.sql`, com índice em qualquer FK usada em filtro (padrão do arquivo: `create index x_provider_id_idx on public.x (provider_id)`).
2. RLS: `enable row level security` + `create policy "anon_full_access" on public.x for all to anon, authenticated using (true) with check (true)` — mesmo padrão de todas as outras tabelas (ver aviso de segurança no topo do `schema.sql`).
3. `grant select, insert, update, delete` já é coberto pelo `grant ... on all tables in schema public` no fim do arquivo — não precisa repetir por tabela.
4. `mapXRow` novo + incluir (ou não — ver §11 sobre `fetchInitialData`) no `fetchInitialData()`.

### 9.3 Adicionar tela/aba nova no painel do prestador
Seguir o padrão das abas existentes: estado `providerTab`, botão em `.tabs`, bloco condicional `{providerTab === 'x' && (...)}` (ver `App.jsx:1440` em diante).

---

## 10. Gotchas conhecidos

- **A grade de horários é fixa e global** — `const times = ['08:00', ..., '17:00']` (`App.jsx:25`), igual pra todo prestador, todo dia. A `duration` do serviço **nunca influenciou** a geração de slots — é campo só informativo/exibido. Importante saber antes de "consertar" algo achando que duração deveria gerar slots diferentes.
- O antigo agrupamento por `serviceKey()` foi removido. A busca pública lista serviços ativos de prestadores ativos/aprovados, e cada agendamento salva `bookings.service_id`.
- **`fetchInitialData()` (`App.jsx:171`) carrega TODAS as tabelas, de TODOS os prestadores, de uma vez só**, sempre que o app abre — não há paginação nem escopo por prestador. Qualquer dado pesado (ex.: fotos de portfólio) **não deve** entrar nesse load — buscar sob demanda (ver PORTFOLIO_SPEC.md §4).
- **RLS totalmente aberto pro `anon`** em todas as tabelas — intencional nesta fase de homologação sem dados reais (ver §4). Não é falha a ser corrigida por iniciativa própria.
- **Sem autenticação real** — login troca só um seletor de papel em memória, sem senha nem sessão persistida no banco.
- **NUNCA reescrever `App.jsx` (ou qualquer arquivo com texto em pt-BR) via terminal Windows sem forçar UTF-8 explícito.** `Set-Content`/`Add-Content`/`Out-File`/redirecionamento `>` no PowerShell caem no codepage ANSI (cp1252) por padrão, não UTF-8 — qualquer acento salvo assim vira mojibake (`ç`→`Ã§`, `ã`→`Ã£`, `—`→`â€"`). Isso já aconteceu neste projeto (2026-08-25) e chegou a corromper o mesmo texto em camadas (duplo/triplo mojibake) porque o processo que editava seguiu salvando por cima. Usar sempre as ferramentas de edição nativas (Edit/Write) que já escrevem UTF-8 corretamente; se for inevitável passar por PowerShell, usar `[System.IO.File]::WriteAllText($path, $conteudo, [System.Text.UTF8Encoding]::new($false))` ou `Set-Content -Encoding utf8NoBOM`. **Rede de segurança automática**: `npm run predev`/`npm run prebuild` já rodam `scripts/fix-encoding.mjs` sozinhos antes de `dev`/`build` — ele varre `src/` e `supabase/` e desfaz mojibake por trecho (cada run de caracteres não-ASCII é revertido até seu próprio ponto de estabilidade, não o arquivo inteiro de uma vez — texto com profundidades de corrupção diferentes misturado no mesmo arquivo precisa disso, senão conserta uma parte e estraga outra). Mesmo se outra ferramenta/agente cometer esse erro de novo, o próximo `npm run dev` ou `npm run build` já corrige sem passo manual. Rodar manualmente com `npm run fix-encoding` a qualquer momento pra checar. Se aparecer o aviso "caractere `�` que não dá pra recuperar automaticamente": é dado genuinamente perdido (byte indefinido no cp1252, comum com `Á`/`Í` maiúsculos) — o script se recusa a adivinhar a letra certa e avisa em vez de arriscar trocar por outra letra errada; nesse caso é preciso digitar a palavra de novo manualmente no trecho apontado.

---

## 11. Pendências / Roadmap

- Limpeza futura: remover definitivamente as colunas legadas `providers.service`, `providers.duration` e `providers.price` depois que não houver necessidade de compatibilidade com bases antigas.
- **README.md § "Quando evoluir"** — autenticação real (Supabase Auth) com RLS por papel, notificação por WhatsApp/e-mail, URLs públicas por prestador tipo `/clinica-vida-plena`, auditoria LGPD completa, mover logo de base64 pra Supabase Storage.

---

## 12. Checklist antes de fechar mudança

1. `npm run build` — pega erro de build real (não só abrir no `npm run dev`). Já roda `fix-encoding` sozinho antes (ver §10).
2. `npm run lint` se mexeu em lógica de hooks/JSX.
3. Rodar o roteiro de homologação relevante do README (seção "Homologação sugerida") pro fluxo que foi alterado.
4. Se mudou schema: `schema.sql` e `seed.sql` atualizados juntos, e os `mapXRow` batendo com as colunas novas.
5. Se a mudança for grande o suficiente pra render este guia desatualizado (nova feature, nova convenção, gotcha novo descoberto): **atualizar este arquivo** nas seções afetadas.
