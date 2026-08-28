# Spec — Portfólio e catálogo de serviços do prestador

Spec de uma funcionalidade nova para o Agenda Flex: cada prestador passa a ter um **catálogo de serviços** (em vez de 1 serviço fixo) e um **portfólio de fotos**, tudo configurado livremente por ele — sem campos travados por profissão — para atender igualmente bem um barbeiro, um eletricista, ou qualquer outro tipo de prestador que venha a se cadastrar depois.

## 1. Decisões de escopo (confirmadas com o Jefferson)

| Decisão | Escolha |
|---|---|
| Agendamento por horário fixo (slots) | **Mantido como está.** Esta spec não cria fluxo de orçamento/visita sem horário. |
| Modelo de dados por tipo de prestador | **Genérico e configurável.** Sem enum fixo tipo "Barbearia"/"Elétrica" — o prestador monta o catálogo com texto livre. |
| Catálogo de serviços | **N serviços por prestador**, cada um com nome, preço e duração próprios. Substitui os campos únicos `service`/`duration`/`price` que hoje ficam direto em `providers`. |
| Armazenamento das fotos | **Base64 no banco**, no mesmo padrão do `logo_url` atual. Sem Supabase Storage nesta fase. |

Essas quatro decisões moldam tudo que vem a seguir. A justificativa de cada uma está registrada aqui para não precisar ser re-perguntada numa próxima sessão.

## 2. Conceito central

Hoje `providers` tem `service`, `duration` e `price` como colunas únicas — ou seja, 1 prestador = 1 serviço. Isso não cabe num barbeiro (corte, barba, sobrancelha, coloração) nem num eletricista (instalação, manutenção, emergência, orçamento de projeto), que naturalmente oferecem vários serviços com preços e durações diferentes entre si.

A mudança central é: **o serviço deixa de ser um atributo do prestador e vira uma entidade própria**, muitos-para-um com o prestador. O portfólio de fotos é uma segunda entidade, também muitos-para-um, que pode ser amarrada a um serviço específico (ex: fotos de cortes) ou ficar solta como gostou geral do prestador (ex: fachada da barbearia, o caminhão do eletricista).

Para caber em qualquer profissão sem eu precisar prever cada uma, dois recursos ficam **totalmente livres, digitados pelo próprio prestador**:
- **Serviços**: nome, descrição, preço (ou "sob consulta") e duração (ou "variável") — sem categorias pré-definidas.
- **Destaques** (chips curtos, tipo "Atende a domicílio", "Certificado NR10", "Agendamento no mesmo dia"): lista livre de textos curtos que o prestador escreve, sem estrutura fixa por trás.

## 3. Modelo de dados

### 3.1 Tabela nova: `provider_services`

```sql
create table public.provider_services (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  price_mode text not null default 'fixo' check (price_mode in ('fixo', 'a_partir_de', 'sob_consulta')),
  duration integer,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index provider_services_provider_id_idx on public.provider_services (provider_id);
create index provider_services_provider_active_idx on public.provider_services (provider_id, active);
```

- `price_mode`: resolve o caso do eletricista sem tocar no fluxo de agendamento. `sob_consulta` mostra "Sob consulta" no lugar do valor (o `price` fica 0 e é ignorado na exibição e no cálculo de receita); `a_partir_de` mostra "A partir de R$ X"; `fixo` mostra o valor direto. O cliente ainda marca um horário normalmente nos três casos — o preço final de um "sob consulta" é combinado depois, fora do app, como já seria hoje via WhatsApp/observações.
- `duration` é **anulável e apenas informativo**. Conferido no código atual: a grade de horários (`times`, `App.jsx:25`) é uma lista fixa de 8 horários por dia, igual para todo prestador — `duration` nunca influenciou a geração de slots. Então tornar a duração opcional por serviço ("variável", útil pro eletricista) não tem risco nenhum sobre o motor de agendamento.
- `position`: ordem de exibição, controlada pelo prestador (botões ▲▼ na UI, sem drag-and-drop — mantém o padrão simples que o app já usa em todo o resto).
- `active`: permite pausar um serviço (some da vitrine) sem apagar histórico de agendamentos que já o referenciam.

### 3.2 Tabela nova: `portfolio_photos`

```sql
create table public.portfolio_photos (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  service_id text references public.provider_services (id) on delete set null,
  image_base64 text not null,
  caption text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_photos_provider_id_idx on public.portfolio_photos (provider_id);
create index portfolio_photos_service_id_idx on public.portfolio_photos (service_id);
```

- `service_id` nulo = foto geral do prestador (vitrine/ambiente). Preenchido = foto amarrada a um serviço específico (ex: um corte, uma instalação concluída).
- `on delete set null`: apagar um serviço não apaga as fotos vinculadas a ele, só solta elas como fotos gerais — evita perda de conteúdo por engano.

### 3.3 Alterações em `providers`

```sql
alter table public.providers add column highlights text[] not null default '{}';

-- depois de migrar os dados (ver 3.5):
alter table public.providers drop column service;
alter table public.providers drop column duration;
alter table public.providers drop column price;
```

`category`, `city`, `name`, `logo_url`, `theme`, `invite_title/message`, `first_offer` continuam exatamente como estão — são identidade do prestador, não do serviço, e já são livres o suficiente (`category` já aceita qualquer texto: "Barbearia", "Serviços elétricos", o que vier).

### 3.4 Alteração em `bookings`

```sql
alter table public.bookings add column service_id text references public.provider_services (id) on delete set null;
```

Necessário porque hoje uma reserva não sabe qual serviço foi escolhido (só sabia o prestador, que só tinha 1 serviço). Sem essa coluna, a agenda do prestador e o cálculo de receita não conseguem saber qual dos N serviços foi agendado. `on delete set null` preserva o histórico da reserva mesmo se o serviço for excluído depois.

### 3.5 Migração dos dados atuais

Antes de derrubar as colunas antigas de `providers`, migrar o serviço único de cada prestador para uma primeira linha em `provider_services`:

```sql
insert into public.provider_services (id, provider_id, name, price, price_mode, duration, active, position)
select gen_random_uuid()::text, id, service, price, 'fixo', duration, true, 0
from public.providers;
```

Como o app está em fase de homologação sem dados reais de cliente (README já registra isso), não existe uma base de produção sensível — mas os agendamentos de teste (`bookings`) existentes ficam sem `service_id` (fica `null`, tratado na UI como "serviço não especificado"). Não é necessário — nem vale o esforço — tentar inferir retroativamente qual serviço cada reserva antiga usava.

### 3.6 RLS

Mesmo padrão das tabelas existentes (acesso aberto pro papel `anon`, com o aviso de segurança já documentado no `schema.sql` valendo igual aqui):

```sql
alter table public.provider_services enable row level security;
alter table public.portfolio_photos enable row level security;

create policy "anon_full_access" on public.provider_services for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.portfolio_photos  for all to anon, authenticated using (true) with check (true);
```

## 4. Regras e limites

Como as fotos ficam em base64 dentro do Postgres (decisão confirmada), o app precisa se proteger de payloads gigantes, porque `fetchInitialData()` (`App.jsx:171`) hoje carrega **todos os dados de todos os prestadores de uma vez só**, sempre que o app abre:

- **Compressão antes do upload**: redimensionar no browser via `<canvas>` (API nativa, sem nova dependência) para no máximo 1024px no lado maior e reexportar como JPEG ~70% de qualidade antes de gerar o base64. Alvo: até ~250–300KB por foto.
- **Limite por prestador**: até 6 fotos por serviço, até 10 fotos gerais (vitrine) por prestador. É um limite de UI (bloqueia o botão de upload ao atingir), não uma constraint de banco.
- **`portfolio_photos` NÃO entra no `fetchInitialData()` eager-load.** Diferente de `providers`/`bookings`/etc., que são poucos KB e cabem no carregamento inicial, fotos em base64 multiplicadas por N prestadores podem chegar a megabytes carregados por qualquer visitante, mesmo quem não vai ver portfólio nenhum. Buscar sob demanda, com uma query escopada por prestador, só quando: (a) o cliente abre a vitrine/loja de um prestador específico, ou (b) o prestador abre a própria aba "Portfólio" no painel. Ver seção 6 e 7 para onde essa busca entra no fluxo.
- **Sem limite artificial na quantidade de serviços por prestador** — não é o gargalo aqui (texto é leve); a UI só precisa paginar/rolar se a lista crescer muito.

## 5. Fluxo do prestador (painel)

O painel do prestador (`App.jsx:1256`) hoje tem 3 abas: Agenda, Clientes, Insights, mais um bloco fixo de edição de identidade acima delas. Muda assim:

**Bloco "Dados do negócio" (topo, fora das abas) — simplifica:**
- Continua: nome do negócio, categoria, cidade, logo, tema visual (cor/estilo), título/mensagem/proposta do convite.
- Sai: os campos "Serviço principal", "Duração" e "Preço" — migram pra dentro da nova aba Serviços.
- Entra: editor de **Destaques** — lista de chips de texto livre (adicionar/remover), ex.: prestador digita "Atende emergência 24h" e clica em adicionar.

**Nova aba "Serviços" (entre Agenda e Clientes):**
- Lista dos serviços do prestador, cada card com: nome, descrição, preço (com seletor "Fixo" / "A partir de" / "Sob consulta"), duração (numérico, com opção "Variável" = deixa em branco), botões ▲▼ pra reordenar, toggle ativo/pausado, e um mini-editor de fotos daquele serviço (upload, legenda, remover).
- Botão "Adicionar serviço" cria uma linha nova em branco.
- Seção separada abaixo (ou sub-aba) "Fotos gerais": upload de fotos soltas (sem vincular a um serviço), pro caso de vitrine/ambiente/fachada.
- Ao abrir a aba, busca `portfolio_photos` sob demanda (`eq('provider_id', provider.id)`) — não vem no load inicial (regra da seção 4).

**Aba Agenda — pequeno ajuste:**
- Cada card de agendamento passa a mostrar o nome do serviço agendado (via `booking.service_id` → nome em `provider_services`), não só o nome do cliente. Reservas antigas sem `service_id` mostram "Serviço não especificado".

**Aba Insights — pequeno ajuste:**
- `providerRevenue` (`App.jsx:402`) hoje soma `provider.price` (que vai deixar de existir). Passa a somar `booking → service_id → provider_services.price`, ignorando bookings cujo serviço está em `sob_consulta` (não têm valor definido pra somar) — mostrar essas reservas separadas como "N atendimentos sob consulta" ao lado do valor de receita, em vez de fingir que valem R$ 0.

## 6. Fluxo do cliente (vitrine pública)

Hoje a lista pública de "serviços" (`publicServices`, `App.jsx:333`) na verdade agrupa **prestadores** — cada card na tela de busca é 1 prestador com seu único serviço, e existe até uma lógica de pool (`serviceKey`, `App.jsx:49`) que junta prestadores diferentes com serviço/preço/duração idênticos num único card, deixando o sistema escolher qualquer um deles disponível no horário.

Com catálogo por prestador, isso muda de unidade: **a lista pública passa a listar serviços, não prestadores**, e cada serviço pertence a exatamente 1 prestador (ver seção 8 sobre por que o agrupamento por pool não faz mais sentido aqui).

- **Página da loja** (`#loja=slug`): mostra identidade do prestador (logo, nome, categoria, cidade, tema), os **Destaques** como chips, a galeria de **fotos gerais**, e a lista de **serviços** em cards (nome, descrição, preço/"Sob consulta", duração/"Variável", foto do serviço se tiver). Clicar num serviço leva pro fluxo de agendamento já com aquele serviço pré-selecionado.
- **Busca geral** (tela inicial sem link de prestador): lista todos os serviços ativos de todos os prestadores ativos/aprovados, cada card mostrando também o nome do prestador (já que agora são serviços de gente diferente misturados na busca).
- **Fluxo de agendar** (`App.jsx:1127` em diante): a seleção deixa de ser por `serviceKey` composto e passa a ser por `service_id` direto. O resumo "Serviço selecionado" mostra nome do serviço + nome do prestador + preço/duração (com "Sob consulta"/"Variável" quando for o caso) + foto do serviço, se houver.
- Busca sob demanda das `portfolio_photos` do prestador só quando a vitrine dele é aberta (`#loja=` ou `#agendar=` de um prestador específico) — mesma regra da seção 4.

## 7. Exemplos aplicados

Prova de que o modelo genérico cobre os dois casos citados (e um terceiro, pra mostrar que escala) sem nenhum campo extra hardcoded:

**Barbeiro — "Corte & Cia"**
- Categoria: "Barbearia". Destaques: "Sem hora marcada não", "Ambiente climatizado".
- Serviços: "Corte masculino" (R$ 40, fixo, 40min, 4 fotos de cortes recentes), "Barba" (R$ 25, fixo, 20min), "Corte + Barba" (R$ 60, fixo, 55min), "Coloração" (R$ 90, a partir de, 90min).
- Fotos gerais: 2 fotos do salão.

**Eletricista — "Silva Elétrica"**
- Categoria: "Serviços elétricos". Destaques: "Atende emergência 24h", "Orçamento sem compromisso", "NR10 ativo".
- Serviços: "Instalação de tomada/ponto" (R$ 80, a partir de, 60min), "Manutenção residencial" (sob consulta, duração variável), "Projeto elétrico completo" (sob consulta, duração variável, 3 fotos de instalações concluídas), "Visita de emergência" (R$ 150, a partir de, 30min).
- Fotos gerais: foto do caminhão/van de serviço.

**Um terceiro, pra validar que não é só "2 tipos previstos" — Personal trainer**
- Categoria: "Personal trainer". Destaques: "Atendo em domicílio", "Primeira avaliação grátis".
- Serviços: "Avaliação física" (grátis → `price 0`, `fixo`, 30min), "Sessão avulsa" (R$ 70, fixo, 50min), "Pacote mensal 8x" (R$ 480, fixo, duração variável — combinado por sessão).

Nenhum desses três exigiu um campo, tabela ou `enum` que não sirva pros outros dois — é exatamente o efeito de ter ido pelo modelo genérico e não por "tipos de negócio" fixos.

## 8. Impacto no comportamento atual (mudanças de comportamento, não só de schema)

- **O agrupamento de prestadores por serviço idêntico (pool) deixa de existir.** Hoje, dois prestadores com serviço/preço/duração iguais aparecem como 1 card só pro cliente, e o sistema escolhe qual dos dois atende. Com catálogo + portfólio por prestador, isso contradiz o próprio objetivo da feature: o cliente está escolhendo com base no trabalho *daquele* prestador (fotos, destaques), então faz sentido que ele sempre veja e escolha um prestador específico, não um pool anônimo. Sinalizando aqui explicitamente porque é uma mudança de comportamento visível, não só uma migração de schema — se esse pool for importante de preservar por outro motivo de negócio, avisar antes de eu tirar.
- `providers.service` / `duration` / `price` deixam de existir como colunas — qualquer lugar do código ou de fora do app (ex.: link salvo, planilha) que dependa diretamente desses campos deixa de funcionar.
- Reservas (`bookings`) feitas antes da migração ficam com `service_id = null` — tratadas como "serviço não especificado" na agenda e excluídas do cálculo de receita por serviço (mas continuam contando pros indicadores gerais que não dependem de serviço, como "Hoje" e "Pendentes").

## 9. Fora de escopo (fica pra depois, não faz parte desta spec)

- Qualquer mudança na dinâmica de agendamento em si (orçamento sem horário fixo, visita técnica agendada por período em vez de slot) — decisão confirmada na seção 1.
- Migração de imagens para Supabase Storage — decisão confirmada na seção 1; reavaliar se o volume de fotos crescer a ponto de pesar no Free tier do Postgres.
- Avaliações/reviews de clientes sobre serviços — nada nesta spec cobre isso.
- Categorias de serviço estruturadas ou busca por filtro de categoria de serviço (a busca pública continua sendo por texto livre, igual hoje).

## 10. Ordem sugerida de implementação

1. Migração de banco: criar `provider_services` e `portfolio_photos`, adicionar `providers.highlights` e `bookings.service_id`, migrar dados (3.5), só então derrubar `providers.service/duration/price`.
2. Ajustar `mapProviderRow`/`mapBookingRow` e criar `mapProviderServiceRow`/`mapPortfolioPhotoRow`; ajustar `fetchInitialData` pra incluir `provider_services` (leve, entra no load inicial) e **não** incluir `portfolio_photos` (sob demanda).
3. Painel do prestador: aba Serviços (CRUD de catálogo) antes da parte de fotos — dá pra homologar preço/duração por serviço mesmo sem portfólio visual ainda.
4. Painel do prestador: upload/galeria de fotos (geral + por serviço), com a compressão via canvas.
5. Vitrine pública: trocar a unidade de listagem de prestador pra serviço, ajustar fluxo de agendar pra usar `service_id`.
6. Editor de Destaques (chips) — o mais simples, pode entrar em paralelo com qualquer etapa acima.
7. Insights: receita por serviço com tratamento de "sob consulta".

## 11. Critérios de aceite

- [ ] Um prestador cadastra 3+ serviços com preços/durações diferentes, incluindo pelo menos 1 "sob consulta" e 1 "variável", e todos aparecem certos na vitrine pública.
- [ ] Um prestador sobe fotos gerais e fotos por serviço; ambas aparecem na vitrine, nos lugares certos (geral vs. atrelada ao serviço).
- [ ] Destaques (chips) cadastrados pelo prestador aparecem na vitrine.
- [ ] Cliente agenda um serviço específico; o agendamento salvo tem o `service_id` certo e aparece com o nome do serviço na agenda do prestador.
- [ ] Receita em Insights soma certo por serviço e separa/rotula os "sob consulta" em vez de somar como R$ 0.
- [ ] Abrir a tela inicial (sem link de prestador) **não** dispara nenhuma query em `portfolio_photos` — só ao entrar na loja de um prestador específico.
- [ ] Reserva antiga (pré-migração, `service_id null`) continua aparecendo na agenda como "Serviço não especificado", sem quebrar a tela.
- [ ] Os 3 exemplos da seção 7 (barbeiro, eletricista, personal trainer) foram cadastrados manualmente uma vez como teste e todos renderizam corretamente na vitrine, sem nenhum campo faltando ou sobrando pra algum dos três.
