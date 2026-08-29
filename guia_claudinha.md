# guia_claudinha — manual operacional do Meu Serviço Online

Otimizado pra Claude entrar em conversas novas já com contexto. Lê §0–4 pra entender o projeto; consulta o resto sob demanda durante o trabalho.

---

## 0. Sobre o projeto

**Meu Serviço Online** (pasta `agendamento`) — SPA de agendamento multi-serviço, em fase de **homologação de fluxo** entre três papéis: cliente, prestador e admin.

**Propósito**: é um **Hub de serviços voltado pro prestador autônomo/pequeno** — a ideia central não é só "ter uma agenda online", é ajudar esse prestador a **divulgar o serviço dele de forma mais fácil** (vitrine pública, link próprio, convite personalizado) e dar uma mão na **gestão** (agenda, clientes, catálogo de serviços). Público-alvo típico: barbeiro, eletricista independente, pedreiro, cabeleireiro, personal trainer, clínica pequena — profissionais autônomos ou pequenos negócios que não teriam recurso/tempo pra montar isso sozinhos. O prestador recebe um link próprio, o cliente agenda direto por ele sem ver outros prestadores, e o admin aprova/governa a plataforma.

**Não é**: produto em produção com dados reais de cliente, não tem multi-tenant por empresa — é uma plataforma única com N prestadores. **Atenção**: isso mudou em 2026-08-29 — o login passou a usar Supabase Auth de verdade (ver §5.1) e a RLS deixou de ser totalmente aberta pro papel `authenticated` (ver §4.1). O cliente público (`anon`) continua sem login, sem mudança nenhuma pra ele.

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
| `blocked_slots` | horário bloqueado manualmente pelo prestador. Tem `resource_id` opcional (2026-08-29) — null bloqueia a loja inteira, preenchido bloqueia só aquele recurso |
| `privacy_requests` | solicitação de acesso/exclusão de dados pelo cliente |
| `provider_resources` | (2026-08-29) profissional/sala/cadeira dentro de uma loja — **opcional**: loja sem nenhuma linha aqui continua com 1 agenda só, como sempre foi |

**4.2 Recursos múltiplos por loja (2026-08-29)**: pedido do Jefferson pra lojas com mais de 1 profissional (ex.: clínica com vários psicólogos) poderem ter agenda independente por pessoa, sem impactar quem é autônomo (a maioria do público-alvo, ver §0). Regra central: **`provider_resources` vazio pra um prestador = comportamento idêntico a antes** (`resource_id` fica `null` em todo `booking`/`blocked_slots` dele, disponibilidade calculada por loja inteira, igual sempre foi). No momento em que o prestador cadastra pelo menos 1 recurso (aba "Recursos" dentro de "Minha loja" → `providerProfileTab === 'recursos'`, funções `createProviderResource`/`updateProviderResource`/`removeProviderResource`), o fluxo público passa a **exigir** escolher um recurso antes de mostrar horários disponíveis (`requiresResourceChoice` em `availableTimes`, bloco "Com quem" no formulário de agendamento, reaproveita a classe `.timePicker`) e a disponibilidade (`availableTimes`, e o check de conflito dentro de `createBooking`) passa a considerar `resource_id` no lugar de só `provider_id`. Isso é client-side apenas — **não confundir com RLS** (owns_provider já cobre `provider_resources` pelo dono da loja, não por recurso individual; não existe login por recurso). Prestador enxerga um filtro "Todos os recursos"/por nome na Agenda (`agendaResource`) quando tem pelo menos 1 recurso cadastrado. Seed de exemplo: `p1` (Clínica Vida Plena) tem 2 recursos (`pr-p1-1`/`pr-p1-2`); `p2`/`p3` seguem sem nenhum, de propósito, pra sempre ter os dois modos representados nos dados de teste. **Fora de escopo por enquanto** (não pedido ainda): foto por recurso (coluna `photo_url` já existe no schema mas sem UI de upload), "anúncios"/destaques por recurso, portfólio de fotos por recurso — se pedirem, a coluna/estrutura já está pronta pra receber.
**4.1 RLS e hierarquia (evoluiu bastante em 2026-08-29, checar antes de assumir)**: o papel `anon` continua com policy `anon_full_access` totalmente aberta em todas as tabelas — necessário porque o fluxo público do cliente nunca se autentica, isso **não muda**. O papel `authenticated` passou por duas camadas na mesma data:
1. Primeiro (`20260829150000_provider_ownership_rls.sql`, minha): `providers.owner_user_id` + `is_master_admin()`/`owns_provider()` — admin vê tudo, prestador só o que é dono.
2. Depois (`20260829170000`/`180000`/`190000_*.sql`, outra sessão): virou uma **hierarquia de 3 níveis** — Admin master → Representante (`platform_representatives`, convidado via `create_representative_invite`, aceita via `accept_representative_invite`) → Prestador. Cada `providers` linha tem `representative_user_id` (opcional — quem gerencia essa loja) além do `owner_user_id` (o próprio dono logado). Função central agora é `public.can_manage_provider(provider_id)` = admin master OU o representante dono daquela loja (`representative_manages_provider`) OU a própria conta do prestador (`provider_account_owns`, via tabela `provider_accounts`). As políticas foram renomeadas de `authenticated_scoped_access` pra **`authenticated_hierarchy_access`** — se for mexer em RLS de novo, usar esse nome/padrão, não o antigo. Também existe `client_accounts` (cliente com conta própria) mas ainda não usado no fluxo de login do app — só a tabela/policy existem.

**Papel no app (`session.role`/flags)**: `get_my_platform_role()` RPC devolve `'admin'` (master) / `'representante'` / `null`. No client, tanto admin master quanto representante caem em `session.role === 'admin'` — a diferença é `session.isMasterAdmin` vs `session.isRepresentative`. Seções só do master (não representante) são gated com `session.isMasterAdmin &&` extra na condição (ver "Representantes" e "Visão do projeto" em `adminTab`).

Vincular prestador↔conta de login: RPC `link_provider_owner(target_provider_id, owner_email)` (substituiu meu `admin_link_provider_owner` antigo) — agora pode ser chamada por admin master OU pelo representante daquela loja, não só admin. Atribuir/trocar qual representante gerencia uma loja: RPC `transfer_provider_representative(target_provider_id, target_representative_user_id)`, já com função `transferProvider()` pronta no `App.jsx` (usada em `adminTab === 'visao-projeto'`, ver §5.4) — só admin master pode transferir. **Login de prestador sem vínculo é rejeitado** (`submitLogin` consulta `providers.owner_user_id = auth.uid()`; sem match, desloga e mostra erro).

Todas essas migrations precisam ser rodadas manualmente no SQL Editor do Supabase, na ordem dos timestamps (não há CLI linkado, ver `supabase/config.toml` inexistente).

**4.3 Logo da plataforma e comunicados (2026-08-29)**: **duas imagens separadas**, de propósito — `platform_settings.brand_logo_url` ("Logo", ícone compacto: badge do sidebar/login via `.brandMark`, e o favicon da aba do navegador, sincronizado num `useEffect` que troca `link[rel="icon"]` — cai pro `/favicon.svg` estático quando não há logo customizado) e `brand_logotype_url` ("Logotipo", marca completa: substitui o bloco ícone+nome no painel esquerdo da tela de login, `.loginLogotype`, quando setado). Ambas base64 (mesmo padrão de `providers.logo_url` — Supabase Storage é item de roadmap, não urgente), upload em Configurações → Marca da plataforma (`uploadBrandLogo`/`uploadBrandLogotype`, `BRAND_COLUMN_MAP.logoUrl`/`.logotypeUrl`). **Não confundir as duas** — um logotipo largo (retangular, com texto) fica ruim espremido no badge quadrado de 38px ou no favicon; um ícone quadrado sozinho costuma perder marca se usado como logotipo grande. Tabela nova `platform_announcements` (title/message/active) — comunicado interno do admin master pro painel de prestador/representante, banner logo abaixo do `.topbar` (`view === 'prestador' || view === 'representante'`, reaproveita `.unsavedBanner`) mostrando só os `active`. Gerenciado em Configurações → Comunicados (`createAnnouncement`/`toggleAnnouncement`/`removeAnnouncement`), visível/editável só pelo admin master. **Não é visível pro cliente público** — decisão explícita do Jefferson, é aviso interno, não divulgação externa.

**4.4 Carrinho de interesse + preço opcional (2026-08-29)**: pedido do Jefferson pra o cliente sinalizar interesse em mais de um serviço sem virar um sistema de agendamento múltiplo de verdade — **não mexe em horário/duração**, é só informativo. `bookingForm.cartServiceIds` (array) guarda os serviços marcados via checkbox nos cards de "Escolha um serviço" (`toggleCartService`, classe `.cartCheck` — checkbox dentro de um `<button>` clicável, por isso o `onClick` do `<label>` tem `stopPropagation` pra não disparar a seleção do card ao marcar). No `createBooking`, vira texto simples (`extraServicesText`, nomes separados por vírgula) salvo em `bookings.extra_services` — **denormalizado que nem `client`/`contact`**, não é uma tabela de junção, de propósito, pra não precisar de join só pra mostrar isso pro prestador. Aparece: no formulário do cliente como um segundo `.selectedService` ("Também tem interesse em"), e na lista de agendamentos do prestador como uma linha extra dentro do card do `.appointment`.

`providers.show_prices` (boolean, default true) — desativado, `formatServicePrice(service, showPrices)` devolve "Sob consulta" pra **todo** serviço daquela loja, não importa o `priceMode` real salvo (preço continua no banco, só não é exibido). Editável em "Minha loja" → Identidade. **Todo call site de `formatServicePrice` precisa passar o segundo argumento** (`item.provider.showPrices`/`bookingService.provider.showPrices`) — se adicionar um novo, não esquecer, senão preço aparece mesmo com a config desligada.

IDs são gerados no client via `crypto.randomUUID()` (ver `App.jsx`), não no banco.

---

## 5. Papéis e navegação

Três papéis (`session.role`: `cliente` | `prestador` | `admin`). Admin e prestador entram por login real (Supabase Auth, ver §5.1); cliente nunca se autentica.

**5.1 Login real (2026-08-29)**: `submitLogin` chama `supabase.auth.signInWithPassword`. O papel é decidido pelo padrão do e-mail (`jeffersonmaycon.sc@gmail.com` ou `admin@...` → admin, `cliente@...` → cliente, qualquer outro → prestador) — isso ainda é uma heurística de e-mail, não um campo de papel no banco. O admin master usa "Criar primeiro acesso" (`createMasterAccess`, `supabase.auth.signUp`) na primeira vez. Um prestador só consegue entrar depois que o admin vincular a conta dele a um `providers.id` (ver §4.1) — sem isso, o login é rejeitado mesmo com senha certa.

- **Cliente**: entra por link (`#agendar=ID_OU_SLUG` ou `#loja=ID_OU_SLUG`) ou pela busca geral. `#loja=` mostra a página de convite/vitrine; `#agendar=` vai direto pro formulário.
- **Prestador**: 5 módulos — Agenda / Serviços / Clientes / Insights / Minha loja (ver §5.2).
- **Admin**: gestão de prestadores (aprovar/pausar), marca da plataforma, parâmetros, governança LGPD.

**5.2 Navegação por sidebar (2026-08-29)**: a navegação principal do app inteiro migrou pra dentro do `<aside className="sidebar">`, não mais só abas dentro do conteúdo — pedido do Jefferson pra reduzir clique de quem usa o painel toda hora. Estado novo: `expandedNavGroup` (`'admin' | 'prestador' | null`) controla um **acordeão** — só um grupo aberto por vez, clique de novo no mesmo item fecha (toggle), `<ChevronRight>` gira 90° quando aberto (`.navChevron.open`). A lista de sub-itens (`.navSubList` → `.navSubListInner`) é sempre renderizada no DOM (nunca desmontada) e a abertura/fechamento é só troca de classe CSS (`grid-template-rows: 0fr → 1fr`, transição 0.22s) — **importante**: se for mexer nisso, não voltar pro padrão antigo de `{condição && <div>...}` (desmonta o elemento e mata a animação).
No sidebar do **admin** (`session.role === 'admin'`): botão "Admin" expande 5 itens — Visão geral / Prestadores / Configurações / Rede de representantes (só `session.isMasterAdmin`) / Privacidade, cada um seta `view` + `adminTab` junto (ver §5.5 pra saber o que cada um contém por dentro, já que 3 deles têm sub-abas internas). Label "Visualizar como"; botão "Prestador" expande Agenda/Serviços/Clientes/Insights/Minha loja (seta `view` + `providerTab`); botão "Cliente" sem sub-lista.
Um **prestador logado de verdade** (`session.role === 'prestador'`) vê essa mesma lista de 5 itens direto no sidebar (sem acordeão, já que só tem um grupo) — substituiu o antigo `.currentArea` estático que só mostrava "Área atual: Nome". A barra `.tabs` horizontal que existia dentro do painel do prestador **foi removida** — toda a navegação de prestador é só pelo sidebar agora.

**5.5 Reorganização do módulo admin (2026-08-29)**: o sidebar do admin tinha crescido pra **7 itens flat** (Visão geral/Gestão de prestadores/Convites/Configurações/Privacidade/Representantes/Visão do projeto) sem agrupamento — Jefferson reportou como "muito confuso". Reduzido pra **5 itens**, empurrando a granularidade pra dentro via sub-abas internas (mesmo padrão `.profileTabs` de "Minha loja", §5.3):
- **Prestadores** — sub-abas "Cadastrados" (`adminTab === 'prestadores'`) / "Convites" (`adminTab === 'convites'`), reaproveitando os MESMOS valores de `adminTab` que já existiam antes (não precisou state novo) — os dois já dividiam o mesmo `<div className="panel adminSectionPanel">`, só faltava a aba visual conectando.
- **Configurações** — sub-abas "Marca" / "Regras" / "Comunicados" (state novo `configSubTab`), antes eram 3 painéis lado a lado num grid (`.adminSettingsGrid`) sempre visíveis juntos. A classe `.adminSettingsGrid.singleColumn` (`App.css`) reseta o grid de 2 colunas pra 1 quando tabbed — se adicionar um 4º painel aqui, entra como 4ª sub-aba, não como 3ª coluna.
- **Rede de representantes** — sub-abas "Contas" (`adminTab === 'representantes'`, convidar/suspender representante) / "Atribuições" (`adminTab === 'visao-projeto'`, visão agrupada de quem gerencia quais lojas). Ambos `session.isMasterAdmin` only, igual antes.
- **Achado no processo**: o campo "Responsável" dentro de `ProviderManagementRow` (`src/modules/admin/ProviderManagementRow.jsx`, adicionado pela outra sessão) já deixa reatribuir o representante de uma loja **direto na lista de Prestadores** — isso tornou o `<select>` de reatribuição que existia em "Visão do projeto"/Atribuições **redundante** (dois lugares editando o mesmo campo). Removido de lá; "Atribuições" agora é só leitura (visão agrupada), a edição de verdade fica em Prestadores. Se voltar a achar necessidade de editar por ali, reconsiderar — mas cuidado pra não reintroduzir a duplicação.

**5.6 Modelos de convite unificados (2026-08-29)**: existem **3 sistemas de convite distintos**, com sofisticação bem diferente — Jefferson reportou como "confuso e burocrático":
- **Convite de prestador** (`create_scoped_provider_invite` RPC, tabela `provider_invites`) — admin master OU representante ativo pode gerar; só devolve um link (`getProviderInviteLink`), **não envia e-mail**.
- **Convite de cliente** (`client_invites`) — o mais simples, 100% client-side (token gerado no navegador, insert direto), gerado pelo prestador em "Minha loja", também só link, sem e-mail. É conceitualmente diferente dos outros dois (não é sobre acesso ao sistema, é só o link de agendamento de um cliente específico) — fica de propósito fora da aba "Convites" do admin.
- **Convite de representante** (`create_representative_invite` RPC + Supabase Edge Function `supabase/functions/send-representative-invite/index.ts`) — o mais sofisticado: gera link E manda e-mail de verdade (se `platform_settings.invite_email_enabled` estiver ligado), com checagem de conexão (`checkInviteEmailConnection`). **Só esse aqui realmente envia e-mail** — os outros dois, mesmo com o painel "Configurações → Regras → Envio de convite de representante" configurado, continuam manuais (copiar/colar).
- **O que foi corrigido**: (1) o painel de e-mail transacional dizia "Entrega de convites" de forma genérica, dando a entender que valia pra qualquer convite — renomeado pra "Envio de convite de representante" com aviso explícito de que só vale pra esse; (2) convite de prestador não tinha lista de pendentes — depois de gerar, se perdesse o link não tinha como recuperar. Adicionada lista `.requestList` (mesmo padrão do convite de representante) mostrando convites `status === 'ativo'` com botão "Copiar link".
- **Se um dia quiser deixar tudo simétrico** (todos os 3 mandando e-mail de verdade): o único que já tem a infraestrutura (edge function) é o de representante — estender pros outros dois significa escrever/adaptar functions novas, não é só mexer no front. Não foi feito agora por ser mudança de infraestrutura, não de organização de tela.

**5.7 Senha definida pelo admin + troca obrigatória no primeiro acesso (2026-08-29)**: motivado por um caso real de produção — um representante recebeu o link de convite manualmente (envio automático de e-mail estava desligado, ver §5.6) e não conseguiu nem logar nem recuperar senha, porque isso depende do e-mail nativo do Supabase Auth (confirmação de cadastro/recuperação), que também não está configurado. Solução: o admin master consegue provisionar acesso **sem depender de e-mail nenhum**.
- **Edge Function `supabase/functions/admin-set-password/index.ts`** (novo, mesmo padrão de `send-representative-invite`: valida `is_master_admin()` via RPC com o client autenticado, usa `SUPABASE_SERVICE_ROLE_KEY` só dentro da function pra chamadas admin). Recebe `{ email, inviteToken? }`: procura o usuário por e-mail (`auth.admin.listUsers`, paginado — base de usuários pequena, não precisa de índice), cria (`auth.admin.createUser`) ou reseta (`auth.admin.updateUserById`) com uma senha temporária aleatória de 12 caracteres, **já com `email_confirm: true`** (contorna o problema de confirmação de e-mail de uma vez) e `user_metadata.must_change_password = true`. Se vier `inviteToken` (fluxo de representante), a function replica manualmente o que `accept_representative_invite` faria (RLS bypassed pelo service role) — busca o convite por token, faz upsert em `platform_representatives` e marca o convite como `usado` — necessário porque essa RPC original depende de `auth.uid()` do próprio convidado logado, e aqui quem está agindo é o admin.
- **Gatilho no app**: `provisionAccountAccess(email, { inviteToken })` (`App.jsx`) chama a function e guarda o resultado em `passwordProvisionNotice` (mostrado com botão "Copiar senha" — mesmo padrão visual de `.requestRow`/`.shareActions` já usado pros links de convite, nenhuma classe CSS nova). Três pontos de entrada: (1) botão "Definir senha" em cada representante ativo (`resetRepresentativePassword` — cobre o caso de conta já existente mas travada); (2) botão "Criar acesso direto" em cada convite de representante pendente (`provisionRepresentativeInvite` — cria a conta E finaliza o convite numa tacada só, sem precisar que o convidado clique em nada); (3) botão "Criar acesso" em `ProviderManagementRow.jsx` (`onProvisionOwner` → `provisionProviderOwner`), alternativa ao "Vincular conta" pra quando o prestador ainda nem tem login — cria a conta E já vincula (`link_provider_owner`) em sequência.
- **Troca obrigatória**: `user_metadata.must_change_password` vem no JWT/objeto do usuário, então o app confere isso em dois lugares — na restauração de sessão (`getSession().then(...)`) e no listener `onAuthStateChange` (evento `SIGNED_IN`) — e força `view = 'conta'` com um novo state `forcedPasswordChange`. `AccountSecurity.jsx` ganhou esse prop: quando true, pula o campo "Senha atual" (igual já fazia `passwordRecovery`, é o mesmo caso de uso — usuário não tem/não deveria usar a senha antiga) e mostra uma mensagem própria. `changeOwnPassword` limpa a flag (`supabase.auth.updateUser({ data: { must_change_password: false } })`, que faz merge no `user_metadata`, não substitui) quando salva com sucesso. **Não é um bloqueio duro de navegação** — o usuário é redirecionado pra "Minha conta" ao entrar, mas pode clicar em outro item do sidebar se quiser; decisão consciente de não construir um lock de navegação porque a senha temporária já concede exatamente as mesmas permissões da senha final (não é fronteira de segurança, é só higiene de onboarding), então o custo de um lock rígido não se justificava.
- **V1 é só admin master** (mesma checagem `is_master_admin()` de `send-representative-invite`) — representante ainda não consegue provisionar acesso direto pros prestadores da própria carteira. Se isso virar necessidade, dá pra estender a function pra aceitar chamada de representante desde que o e-mail alvo seja de um prestador que ele gerencia (checar via `can_manage_provider`/tabela de vínculo antes de tocar em `auth.admin`).

**5.8 Política de senha visível pro admin + status de segurança por conta (2026-08-30)**: depois do caso do representante travado (§5.7), o Jefferson pediu pra "gestão de segurança ficar clara pro admin", citando como exemplo o tamanho mínimo de senha. Duas coisas novas:
- **`platform_settings.min_password_length`** (padrão 8, entre 8 e 64) — campo novo em Configurações → Regras, mesmo padrão dos outros números (`updateSetting`/`SETTINGS_COLUMN_MAP`). Usado em 3 pontos: `changeOwnPassword` (troca de senha própria), `createMasterAccess` (primeiro acesso), e como piso pras senhas temporárias que o admin gera (`provisionAccountAccess` manda `passwordLength = max(12, minPasswordLength)` pra `admin-set-password` — nunca gera abaixo de 12 mesmo que o mínimo configurado seja menor, pra senha temporária sempre ser razoavelmente forte).
- **RPC `get_account_security_status(target_user_ids uuid[])`** (nova, `security definer`, só `is_master_admin()`) — o app não conseguia mostrar pro admin se um representante já tinha trocado a senha temporária ou nunca tinha acessado, porque isso vive em `auth.users`, que o client não enxerga. Um `useEffect` novo busca esse status pra todos os representantes sempre que a lista muda (inclusive depois de um provisionamento) e guarda em `representativeSecurity` (mapa por `user_id`). Aparece como texto direto no lugar do status ("Representante • ativo • aguardando troca de senha" / "• nunca acessou") — sem badge/CSS novo, só reaproveitando o `<span>` que já existia.
- **Não estendido pra prestadores nesta rodada** — `providers.ownerUserId` no estado local vira a string literal `'vinculado'` depois de um vínculo bem-sucedido (não o UUID de verdade), então a mesma lógica não dava pra copiar direto pra `ProviderManagementRow` sem antes ajustar isso. Fica como próximo passo se for necessário.
- **Restrito ao Admin master (2026-08-30)**: até aqui, "Configurações → Regras" (incluindo o campo de tamanho mínimo de senha) e a seção "Conta de acesso"/"Vincular conta"/"Criar acesso" de `ProviderManagementRow` apareciam também pra representante — o RLS já bloqueava a escrita de verdade (`is_master_admin()` nas duas pontas, RPC e tabela), mas a UI mostrava controles que só dariam erro pra quem não é admin master. Jefferson pediu pra deixar essa política clara e só com o Admin — os dois pontos agora são condicionais a `session.isMasterAdmin`: o campo de senha some da tela do representante, e a linha de prestador mostra só "Vinculada"/"Não vinculada" (texto, sem botão) pra quem não é master.

**5.3 Painel do prestador separado em módulos (2026-08-29)**: antes, o `.providerPanel` sempre mostrava junto — métricas (Hoje/Pendentes/Clientes), os 3 `.shareBox` (link de convite, gerar convite de cliente, link da loja) e o editor de identidade/vitrine/convite (`.inviteEditor`) — não importava qual aba (Agenda/Serviços/etc.) estivesse selecionada. Isso virou o módulo **"Minha loja"** (`providerTab === 'loja'`): só aparece quando esse item é selecionado, exatamente como Agenda/Serviços/Clientes/Insights só mostram o conteúdo deles. Dentro de "Minha loja", o `.inviteEditor` continua tendo suas próprias sub-abas internas (`providerProfileTab`: `identidade` | `vitrine` | `convite` | `recursos`, a última adicionada junto com §4.2) — **é um segundo nível de abas dentro do módulo**, não confundir com a navegação do sidebar. `hasUnsavedChanges`/`.unsavedBanner` do editor só aparece quando "Minha loja" está ativo (antes era visível de qualquer aba).

**5.4 Visão do projeto — hierarquia (2026-08-29)**: submódulo novo no sidebar do admin (`adminTab === 'visao-projeto'`, gated `session.isMasterAdmin`, ao lado de "Representantes"). Mostra, pra cada representante ativo, a lista de lojas (`providers`) que ele gerencia (`representativeUserId` casando com `representative.user_id`), mais uma seção "Sem representante" com as lojas que ficam direto com o admin. Cada loja tem um `<select>` que chama `transferProvider(providerId, representativeUserId)` — função que já existia no `App.jsx` (RPC `transfer_provider_representative`) mas estava sem nenhuma UI chamando ela até então. **Isso é só a estrutura de "quem gerencia quem"** — a aparência/portfólio/vitrine pública de cada loja continua sendo responsabilidade exclusiva do próprio prestador em "Minha loja" (§5.3), o admin/representante não edita isso por aqui.

**Página pública isolada (2026-08-25)**: quando `session.role === 'cliente' && publicProviderId` (visitante chegou por um link `#loja=`/`#agendar=` de um prestador específico), a app renderiza um `<main className="publicStorefront">` totalmente à parte — **sem** a sidebar/topbar internos, sem stats da plataforma, sem nada que sugira que existem outros prestadores. Motivo: a versão anterior reaproveitava o mesmo shell do painel interno pra essa página, e chegou a vazar contagem de "Prestadores"/"Clientes" da plataforma inteira numa página que devia ser 100% do prestador — feedback direto do Jefferson ("como pode ser um portfólio se aparece sinais de outra loja"). Esse branch isolado fica logo antes do `return` principal em `App.jsx` (`if (session.role === 'cliente' && publicProviderId && bookingService) { ... }`) e reaproveita as mesmas variáveis já computadas (`bookingService`, `filteredServices`, `createBooking` etc.) — só muda o wrapper visual. **Se adicionar conteúdo novo na página pública, adicionar nos dois lugares só se fizer sentido pro preview interno também** — o branch isolado é a versão real que o cliente vê.

**Fallbacks do isolamento (2026-08-29)**: dois branches extras logo depois do isolado acima, ainda antes do `return` do shell interno. (1) `if (session.role === 'cliente' && publicProviderId && !bookingService)` — prestador do link é válido mas não tem nenhum serviço ativo; mostra uma página pública mínima ("sem serviços disponíveis") em vez de cair no shell interno (o que reabriria o mesmo vazamento que o isolamento de 2026-08-25 corrigiu). (2) dentro do `if (!session)` (tela de login), quando `getLinkedProviderId()` acha um id/slug no hash mas nenhum prestador ativo corresponde, mostra um aviso "link não disponível" reaproveitando `.loginError` — antes disso, um link inválido caía em silêncio na tela de login genérica.

**Cliente recorrente / persistência local (2026-08-29)**: `localStorage['agenda-client-' + providerId]` guarda `{ name, contact, lastServiceId }` por prestador (funções `getSavedClient`/`saveClient`/`clearSavedClient`, topo do `App.jsx`) — escrito em `createBooking` a cada agendamento, lido em `resolvePublicRoute` pra pré-preencher nome/contato e sugerir o último serviço usado quando o mesmo navegador volta pelo link do mesmo prestador. **Escopado por prestador, não global** — cada link é tratado como loja isolada, mesmo critério de `provider_clients` ser por vínculo. Nunca guarda o consentimento (isso seria uma segunda fonte de verdade divergente de `provider_clients.consent`); em vez disso, `hasExistingConsent(providerId, contact)` (perto de `createBooking`) confere no `data.clients`/`data.providerClients` já carregados e pré-marca o checkbox de consentimento (nunca desmarca sozinho) quando já há um vínculo consentido. O formulário mostra um "Bem-vindo(a) de volta" com link pra limpar os dados salvos (dispositivo compartilhado).

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
2. RLS: `enable row level security` + duas políticas, não uma só (ver §4.1, mudou em 2026-08-29): `create policy "anon_full_access" on public.x for all to anon using (true) with check (true)` (mantém o fluxo público aberto) e `create policy "authenticated_scoped_access" on public.x for all to authenticated using (public.is_master_admin() or public.owns_provider(provider_id)) with check (...)` (se a tabela não tiver `provider_id` direto, ver como `clients`/`platform_settings` resolvem isso em `20260829150000_provider_ownership_rls.sql`).
3. `grant select, insert, update, delete` já é coberto pelo `grant ... on all tables in schema public` no fim do arquivo — não precisa repetir por tabela.
4. `mapXRow` novo + incluir (ou não — ver §11 sobre `fetchInitialData`) no `fetchInitialData()`.

### 9.3 Adicionar módulo novo no painel do prestador
Não tem mais `.tabs` (removida, ver §5.2/§5.3). Seguir o padrão atual: valor novo em `providerTab`, botão novo nas DUAS listas do sidebar (`.navSubList` dentro de "Prestador" no nav do admin, E o `<nav>` do `session.role === 'prestador'`), bloco condicional `{providerTab === 'x' && (...)}` dentro do `.providerPanel`. Esquecer uma das duas listas do sidebar é o erro mais fácil de cometer aqui.

---

## 10. Gotchas conhecidos

- **A grade de horários é fixa e global** — `const times = ['08:00', ..., '17:00']` (`App.jsx:25`), igual pra todo prestador, todo dia. A `duration` do serviço **nunca influenciou** a geração de slots — é campo só informativo/exibido. Importante saber antes de "consertar" algo achando que duração deveria gerar slots diferentes.
- O antigo agrupamento por `serviceKey()` foi removido. A busca pública lista serviços ativos de prestadores ativos/aprovados, e cada agendamento salva `bookings.service_id`.
- **`fetchInitialData()` (`App.jsx:171`) carrega TODAS as tabelas, de TODOS os prestadores, de uma vez só**, sempre que o app abre — não há paginação nem escopo por prestador. Qualquer dado pesado (ex.: fotos de portfólio) **não deve** entrar nesse load — buscar sob demanda (ver PORTFOLIO_SPEC.md §4).
- **RLS totalmente aberto pro `anon`** em todas as tabelas — intencional, é o que sustenta o fluxo público do cliente (nunca se autentica). Não é falha a ser corrigida por iniciativa própria. Já **não é mais** verdade pro papel `authenticated` — ver §4.1.
- **Papel do usuário ainda é heurística de e-mail** (`admin@...`/`cliente@...`/resto=prestador), não um campo real no banco — login real (senha) já existe, mas "quem é admin" e "de qual prestador é dono" continuam fora de uma tabela de papéis formal (ver §4.1/§5.1).
- **NUNCA reescrever `App.jsx` (ou qualquer arquivo com texto em pt-BR) via terminal Windows sem forçar UTF-8 explícito.** `Set-Content`/`Add-Content`/`Out-File`/redirecionamento `>` no PowerShell caem no codepage ANSI (cp1252) por padrão, não UTF-8 — qualquer acento salvo assim vira mojibake (`ç`→`Ã§`, `ã`→`Ã£`, `—`→`â€"`). Isso já aconteceu neste projeto (2026-08-25) e chegou a corromper o mesmo texto em camadas (duplo/triplo mojibake) porque o processo que editava seguiu salvando por cima. Usar sempre as ferramentas de edição nativas (Edit/Write) que já escrevem UTF-8 corretamente; se for inevitável passar por PowerShell, usar `[System.IO.File]::WriteAllText($path, $conteudo, [System.Text.UTF8Encoding]::new($false))` ou `Set-Content -Encoding utf8NoBOM`. **Rede de segurança automática**: `npm run predev`/`npm run prebuild` já rodam `scripts/fix-encoding.mjs` sozinhos antes de `dev`/`build` — ele varre `src/` e `supabase/` e desfaz mojibake por trecho (cada run de caracteres não-ASCII é revertido até seu próprio ponto de estabilidade, não o arquivo inteiro de uma vez — texto com profundidades de corrupção diferentes misturado no mesmo arquivo precisa disso, senão conserta uma parte e estraga outra). Mesmo se outra ferramenta/agente cometer esse erro de novo, o próximo `npm run dev` ou `npm run build` já corrige sem passo manual. Rodar manualmente com `npm run fix-encoding` a qualquer momento pra checar. Se aparecer o aviso "caractere `�` que não dá pra recuperar automaticamente": é dado genuinamente perdido (byte indefinido no cp1252, comum com `Á`/`Í` maiúsculos) — o script se recusa a adivinhar a letra certa e avisa em vez de arriscar trocar por outra letra errada; nesse caso é preciso digitar a palavra de novo manualmente no trecho apontado.

---

## 11. Pendências / Roadmap

**11.1 Avaliação contra a proposta (2026-08-29)** — a proposta do Jefferson pro projeto tem 3 pilares: (1) prestador conseguir falar do trabalho dele nas redes sociais/anúncio, (2) alcançar clientes, (3) ter gestão de agendamento. Avaliação do que existe hoje em cada um:

**(1) Divulgação em redes sociais / anúncio — o mais fraco dos três:**
- ✅ Existe: vitrine pública personalizável (tema/cores/estilo, "sobre", destaques/chips, portfólio de fotos), links compartilháveis (loja, convite de cliente, por recurso), `shareProviderLink()` usa a Web Share API nativa do celular (`navigator.share` — no Android/iOS isso já abre o seletor do sistema com Instagram/WhatsApp/etc.; no desktop cai pro `wa.me` só), rastreamento de origem já capturado (`getTrafficSource()` lê `utm_source` da URL ou o referrer, salvo em `analytics_events.source`).
- ❌ **Falta**: o dado de origem (`source`) é capturado mas **não aparece em nenhuma tela** — `StorePerformance`/"Desempenho da loja" mostra funil e desempenho por serviço, mas não quebra por canal/origem, então hoje o prestador não descobre pelo próprio app se o cliente veio do Instagram, de um anúncio ou de busca direta. Não existe gerador de post/imagem pronta pra divulgação, nem botões dedicados por rede social no desktop (só o share nativo + WhatsApp). Não existe (nem faz sentido nesta fase) integração com Meta/Google Ads de verdade — isso seria outro projeto.

**(2) Alcançar clientes:**
- ✅ Existe: busca geral por nome/categoria/cidade (multi-prestador), convite de cliente individual (link único via `client_invites`), recontato por WhatsApp pra cliente sem retorno, reconhecimento de cliente recorrente (localStorage por prestador, pré-preenche e pula consentimento repetido), consentimento LGPD por vínculo.
- ❌ **Falta**: sem diretório/marketplace navegável por categoria (só busca textual simples), sem SEO (SPA com rotas por `#hash`, motor de busca não indexa bem `#agendar=slug`), sem avaliação/nota de cliente (review) que ajudaria conversão de visitante novo que nunca ouviu falar do prestador.

**(3) Gestão de agendamento — o mais maduro dos três:**
- ✅ Bem coberto: agenda operacional com bloqueio de horário, múltiplos recursos/profissionais por loja (opcional), catálogo de serviços, carrinho de interesse, gestão de clientes com alerta de retorno, hierarquia admin/representante/prestador com RLS real, governança LGPD, papel e autenticação reais.
- ❌ Falta (itens menores, já conhecidos): notificação automática por WhatsApp/e-mail quando o status muda (hoje é manual, o prestador clica "Recontatar"), foto/portfólio por recurso individual, cliente ainda sem conta própria (só nome+contato, sem login — impede RLS do lado do cliente).

**11.2 Lista priorizada de pendências** (ordem sugerida dentro de cada nível — não é regra fixa, é ponto de partida pra próxima sessão não ter que redescobrir isso):

**Prioridade Alta (baixo esforço, resolve lacuna visível do pilar mais fraco):**
1. **Mostrar origem/canal no "Desempenho da loja"** — o dado já existe (`analytics_events.source`, gravado por `getTrafficSource()` em `App.jsx:383`), só falta agregar e exibir. O quê fazer: em `App.jsx`, onde as métricas de `StorePerformance` já são calculadas (perto de `providerServiceAnalytics`/`serviceViews`/`bookingStarts`), agrupar `data.analyticsEvents` por `source` (contar `visualizou_servico` por grupo, achar o mais frequente) e passar como prop nova (`sourceBreakdown` ou parecido) pro componente `src/modules/provider/StorePerformance.jsx`; lá, adicionar um bloco tipo "De onde vêm seus visitantes" com uma lista simples `nome do canal → contagem`. Não precisa de schema novo.

**Prioridade Média:**
2. **Botões de compartilhamento por rede social no desktop** — hoje só existe `shareProviderLink()` (`App.jsx:1985`, Web Share API + fallback `wa.me`), que no desktop não abre nada além do WhatsApp. Adicionar link direto pro Facebook (`https://www.facebook.com/sharer/sharer.php?u=<link>`) e Telegram (`https://t.me/share/url?url=<link>&text=<texto>`) — funcionam sem SDK, é só abrir a URL. Instagram não tem esse tipo de link de compartilhamento web (só apps nativos), então fica de fora por limitação da própria plataforma, não do projeto. Onde: perto do "Link da loja"/"Link de convite" em "Minha loja" (`App.jsx`, dentro do `providerTab === 'loja'`).
3. **Diretório navegável por categoria** — hoje a busca geral (`filteredServices`, tela "Escolha um serviço" sem `publicProviderId`) só filtra por texto livre. Adicionar um filtro por categoria (chips ou `<select>` com as categorias distintas de `activeProviders`) ao lado do campo de busca já existente. Não precisa de schema novo, `providers.category` já existe.
4. **Notificação automática por WhatsApp/e-mail quando o status do agendamento muda** — hoje é manual (prestador clica "Recontatar"). Isso depende de decidir/contratar um provedor (WhatsApp Business API tem custo e homologação; e-mail transacional tipo Resend/SendGrid é mais simples de começar) — **decisão de negócio antes de codar**, não é só um ajuste de tela.

**Prioridade Baixa (escopo maior, ou depende de decisão externa):**
5. **Avaliação/nota de cliente (review)** — ajudaria conversão de visitante novo que não conhece o prestador. Schema novo (tabela de reviews vinculada a `bookings` concluídos), moderação (quem aprova?), exibição pública na vitrine — feature nova, não é extensão pequena.
6. **SEO** — SPA com rotas por `#hash` não indexa bem em motor de busca. Resolver de verdade exige SSR/prerendering, ou seja, trocar Vite puro por algo como Next/Remix ou adicionar prerendering — **mudança de arquitetura**, não é ajuste pontual. Só faz sentido priorizar se aquisição orgânica via busca virar canal relevante.
7. **Foto/portfólio por recurso individual** — `provider_resources.photo_url` já existe na coluna (schema pronto), só falta UI de upload — mesmo padrão de `uploadProviderLogo`/`uploadBrandLogo`, aplicar em `updateProviderResource`.
8. **Cliente com conta própria** — `client_accounts` já existe no schema (criada pela outra sessão, migração de hierarquia), mas não tem fluxo de login/signup de cliente nem UI — mudaria o fluxo de agendamento público inteiro (hoje é só nome+contato direto no formulário), escopo grande.
9. Limpeza futura: remover definitivamente as colunas legadas `providers.service`, `providers.duration` e `providers.price` depois que não houver necessidade de compatibilidade com bases antigas.
10. Mover uploads de logo/imagens (base64 direto no banco: `providers.logo_url`, `platform_settings.brand_logo_url`/`brand_logotype_url`, `portfolio_photos`) pra Supabase Storage — aceitável em volume baixo de homologação, cresce mal em produção real.
11. URLs públicas por prestador tipo `/clinica-vida-plena` (hoje é hash `#loja=`) — exigiria rewrite de servidor dinâmico por prestador, mais complexo que o rewrite estático de SPA que já existe (`vercel.json`).
12. **`provider_resources` ficou de fora da migração de hierarquia** (`20260829180000_relationship_hierarchy.sql` reescreve `authenticated_scoped_access` → `authenticated_hierarchy_access` em quase toda tabela de negócio, mas não em `provider_resources`, criada depois em `20260829160000`). Hoje um representante consegue gerenciar tudo do prestador que ele responde, exceto os recursos/profissionais daquela loja (a policy ainda usa só `owns_provider`, não `can_manage_provider`). Achado ao revisar as migrações pendentes antes de aplicar em produção (2026-08-29) — não corrigido agora por ser fora do escopo da mudança que motivou a revisão (senha de acesso); só trocar `owns_provider(provider_id)` por `can_manage_provider(provider_id)` na policy de `provider_resources` quando for mexer nessa área.

---

## 12. Checklist antes de fechar mudança

1. `npm run build` — pega erro de build real (não só abrir no `npm run dev`). Já roda `fix-encoding` sozinho antes (ver §10).
2. `npm run lint` se mexeu em lógica de hooks/JSX.
3. Rodar o roteiro de homologação relevante do README (seção "Homologação sugerida") pro fluxo que foi alterado.
4. Se mudou schema: `schema.sql` e `seed.sql` atualizados juntos, e os `mapXRow` batendo com as colunas novas.
5. Se a mudança for grande o suficiente pra render este guia desatualizado (nova feature, nova convenção, gotcha novo descoberto): **atualizar este arquivo** nas seções afetadas.
