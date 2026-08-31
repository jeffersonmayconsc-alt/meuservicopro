# Guia do Projeto - Meu Serviço Online

## 1. Visão geral

**Nome do produto:** Meu Serviço Online  
**Nome técnico do projeto:** `meuservicopro`  
**Objetivo:** centralizar divulgação de serviços, convites, agendamentos, clientes e gestão operacional de prestadores de serviço.

O sistema possui três contextos de uso:

- **Administrador:** administra a plataforma, prestadores, convites, configurações e solicitações de privacidade.
- **Prestador:** administra agenda, serviços, clientes, divulgação e indicadores do próprio negócio.
- **Cliente:** acessa a loja ou um convite do prestador e solicita um agendamento.

Uma pessoa poderá acumular papéis. O administrador também poderá atuar como prestador e cliente; prestadores poderão ser clientes; clientes poderão solicitar acesso como prestadores. Essa arquitetura de múltiplos papéis ainda precisa ser concluída com autenticação real.

## 2. Estado atual do projeto

### Implementado

- Interface em React com layout responsivo e temas claro, escuro e automático.
- Área administrativa organizada por seções.
- Painel operacional do prestador.
- Loja pública e fluxo de solicitação de agendamento.
- Cadastro e gestão de serviços.
- Agenda, bloqueio de horários e atualização do status do atendimento.
- Cadastro e acompanhamento de clientes vinculados ao prestador.
- Personalização de marca, convite e loja do prestador.
- Portfólio de imagens.
- Convite de prestador gerado pelo administrador.
- Convite de cliente gerado pelo prestador.
- Persistência de dados no Supabase.
- Estrutura inicial para solicitações de privacidade e LGPD.
- Integração do repositório com GitHub.
- Configuração de aplicação SPA para Vercel.
- Login, confirmação de e-mail e recuperação de senha com Supabase Auth.
- Área Minha conta para alterar a própria senha.
- Consulta dos dispositivos conectados com navegador, sistema, IP e última atividade.
- Encerramento das demais sessões sem desconectar o dispositivo atual.
- Funil interno por prestador com visualizações, inícios de agendamento, agendamentos gerados e visitantes únicos.
- Comparativo de conversão por serviço nos períodos de 7, 30 e 90 dias.

### Em homologação ou pendente

- A autenticação da conta já usa Supabase Auth, mas o papel ainda é identificado provisoriamente pelo e-mail.
- O modelo definitivo de múltiplos papéis por usuário ainda não foi implementado.
- As políticas RLS do Supabase estão abertas para os perfis `anon` e `authenticated`.
- Os convites existem no banco, mas ainda precisam de segurança vinculada a usuários autenticados.
- Alguns avisos ainda usam `alert()` do navegador e devem migrar para mensagens internas da interface.

> **Importante:** não utilizar dados pessoais reais enquanto as políticas RLS definitivas e o modelo de papéis não estiverem implementados.

## 3. Tecnologias

| Camada | Tecnologia | Finalidade |
| --- | --- | --- |
| Frontend | React 19 | Componentes e estados da interface |
| Build | Vite 8 | Servidor local e geração da versão de produção |
| Banco | Supabase/PostgreSQL | Persistência dos dados |
| Cliente de banco | `@supabase/supabase-js` | Comunicação do frontend com Supabase |
| Ícones | Lucide React | Ícones da interface |
| Qualidade | Oxlint | Análise estática do código |
| Hospedagem | Vercel | Publicação do frontend |
| Versionamento | Git/GitHub | Histórico e armazenamento do código |

## 4. Estrutura principal

```text
agendamento/
├── src/
│   ├── App.jsx                 # Orquestra estado, rotas internas e integrações entre módulos
│   ├── App.css                 # Estilos da aplicação
│   ├── index.css               # Estilos globais
│   ├── main.jsx                # Inicialização do React
│   ├── components/
│   │   └── Stat.jsx            # Indicador reutilizável em painéis
│   ├── lib/
│   │   └── supabaseClient.js   # Cliente do Supabase
│   ├── modules/
│   │   ├── account/
│   │   │   └── AccountSecurity.jsx     # Perfil, senha e sessões da conta
│   │   └── provider/
│   │       ├── OperationalSummary.jsx  # Resumo operacional do prestador
│   │       └── StorePerformance.jsx    # Funil e desempenho por serviço
│   └── assets/                 # Imagens locais
├── supabase/
│   ├── schema.sql              # Estrutura completa do banco
│   ├── seed.sql                # Dados iniciais de demonstração
│   ├── portfolio_migration.sql # Alterações relacionadas ao portfólio
│   └── migrations/             # Migrações versionadas
├── scripts/
│   └── fix-encoding.mjs        # Verificação/correção de codificação UTF-8
├── vercel.json                 # Rewrite para a SPA
├── package.json                # Dependências e comandos
└── .env.local                  # Variáveis locais, não versionadas
```

O `src/App.jsx` permanece como orquestrador dos estados compartilhados e dos fluxos que atravessam mais de uma área. Conta e segurança, resumo operacional, desempenho da loja e componentes compartilhados já possuem módulos próprios. As próximas extrações devem seguir o mesmo padrão, uma área funcional por vez, preservando as regras existentes.

### Limites de manutenção

- `src/components`: componentes visuais reutilizáveis e sem regra específica de um perfil.
- `src/modules/account`: autenticação complementar, perfil, senha, sessões e segurança da própria conta.
- `src/modules/provider`: agenda, serviços, clientes, loja, resumo e desempenho exclusivos do prestador.
- `src/modules/admin`: destino das telas e regras de administração da plataforma.
- `src/modules/client`: destino da loja pública, convite e fluxo de agendamento do cliente.
- `src/lib`: acesso técnico a serviços externos, persistência e utilitários sem interface.
- `src/App.jsx`: composição dos módulos, sessão ativa, navegação e estado que realmente precisa ser compartilhado.

Não colocar novas telas completas diretamente em `App.jsx`. Funcionalidades novas devem nascer dentro do módulo do perfil responsável e receber apenas os dados e ações necessários por propriedades.

### Padrão da gestão de prestadores

A linha administrativa de prestador está isolada em `src/modules/admin/ProviderManagementRow.jsx`. Ela não reutiliza `.providerRow`, porque essa classe também atende representantes e possui uma geometria diferente.

- Desktop amplo: Grid com colunas estáveis para identidade, status, conta, responsável e ação.
- Painel intermediário: duas linhas previsíveis, sem quebra livre baseada no conteúdo.
- Mobile: cartão vertical com controles de largura total.
- Os breakpoints usam container queries sobre `.providerRows`, pois a largura útil depende da sidebar e não apenas do viewport.
- O formulário de vínculo aparece somente sob comando, reduzindo ruído visual.
- A transferência de responsável exige seleção e confirmação em **Aplicar**.
- Nomes e e-mails extensos devem truncar ou ajustar dentro da própria área, sem aumentar a largura da página.

### Trabalho com vários agentes

É possível usar mais de um agente, desde que cada um tenha uma área de propriedade clara. A divisão recomendada é:

| Área | Diretório principal |
| --- | --- |
| Conta e segurança | `src/modules/account` |
| Operação e desempenho do prestador | `src/modules/provider` |
| Administração | `src/modules/admin` |
| Cliente e loja pública | `src/modules/client` |
| Banco, RLS e migrações | `supabase/migrations` |
| Componentes compartilhados | `src/components` |

Dois agentes não devem editar ao mesmo tempo `src/App.jsx`, `src/App.css`, `supabase/schema.sql` ou a mesma migração. Para trabalhos paralelos, usar branches ou worktrees separados, integrar uma área por vez e executar `npm run lint` e `npm run build` depois de cada integração. Migrações já aplicadas não devem ser reescritas; correções devem entrar em uma nova migração.

## 5. Perfis e política de acesso

### Administrador

Pode:

- Acessar a visão geral da plataforma.
- Revisar, aprovar, pausar e reativar prestadores.
- Criar links de convite para novos prestadores.
- Configurar marca, regras operacionais e políticas da plataforma.
- Acompanhar solicitações de privacidade.
- Alternar para visualização de prestador e cliente para conferência.

O administrador deve poder acumular os papéis de prestador e cliente sem perder os privilégios administrativos.

### Representante

O representante é um acesso delegado pelo Admin master para apoiar a operação administrativa. Não é um administrador e não possui gestão sobre outros representantes.

- Somente o Admin master pode gerar convites de representante.
- O convite é vinculado ao e-mail, possui token único e expira em sete dias.
- O convidado precisa criar ou acessar uma conta com o mesmo e-mail do convite.
- Somente o Admin master pode ativar ou suspender representantes.
- Representantes não visualizam a seção de gestão de representantes.
- O prestador convidado por um representante fica vinculado automaticamente a esse representante.
- O representante consulta e administra somente os prestadores vinculados a ele e os clientes desses prestadores.
- O Admin master pode transferir um prestador para outro representante ou assumir a responsabilidade diretamente.
- As funções de convite e alteração de status também validam `is_master_admin()` no Supabase; esconder a interface não é a única proteção.

Tabelas: `platform_representatives` e `representative_invites`. Funções principais: `get_my_platform_role()`, `create_representative_invite()`, `accept_representative_invite()` e `set_representative_status()`.

### Árvore de relacionamentos

```text
auth.users
├── platform_representatives.user_id
│   └── providers.representative_user_id
│       └── provider_clients.provider_id
│           └── clients.id
├── provider_accounts.user_id
│   └── providers.id
└── client_accounts.user_id
    └── clients.id
```

As chaves estrangeiras impedem vínculos com registros inexistentes. A função `can_manage_provider()` percorre essa árvore para limitar o acesso autenticado: Admin master acessa toda a plataforma; representante acessa seus prestadores; prestador acessa o próprio cadastro; e o cliente autenticado acessa a própria identidade. Convites de prestador usam `create_scoped_provider_invite()` e registram o representante responsável. Transferências usam `transfer_provider_representative()` e são exclusivas do Admin master.

### Prestador de serviço

O acesso inicial deve ocorrer por link de convite criado pelo administrador, salvo quando o auto cadastro estiver explicitamente habilitado.

Pode:

- Configurar dados do negócio e aparência da loja.
- Cadastrar, editar, ordenar e desativar serviços.
- Gerenciar agenda e horários bloqueados.
- Atualizar o status de agendamentos.
- Consultar clientes vinculados ao próprio negócio.
- Criar links para convidar clientes.
- Consultar indicadores da própria operação.

O prestador pode também possuir o papel de cliente.

### Cliente

O acesso principal deve ocorrer pelo link enviado por um prestador aprovado.

Pode:

- Visualizar a loja e os serviços do prestador do convite.
- Consultar a última solicitação feita a cada prestador, incluindo serviço, data, hora e status.
- Agendar novamente um serviço anterior com uma ação direta, sem alterar o pedido antigo.
- Escolher serviço, data e horário.
- Solicitar agendamento.
- Fornecer consentimento para uso dos dados no atendimento.
- Solicitar acesso, correção ou exclusão de dados.

O cliente poderá solicitar o papel de prestador, mas só deverá receber esse acesso após cumprir a política de cadastro e aprovação administrativa.

### Histórico e novo agendamento

O módulo `src/modules/client/ClientServiceHistory.jsx` apresenta o pedido mais recente de cada prestador reconhecido para o cliente. A identificação atual combina o e-mail autenticado, o contato preenchido no formulário e o contato lembrado localmente para cada prestador.

Ao usar **Agendar novamente**:

1. O prestador e o serviço anteriores são selecionados.
2. A entrada muda para o fluxo de agendamento.
3. O formulário recebe a data atual como ponto de partida e mantém nome e contato lembrados.
4. A página leva o cliente diretamente para a escolha do novo horário.
5. A confirmação cria uma nova solicitação; o registro anterior permanece intacto no histórico.

Enquanto `clients` não estiver vinculado a `auth.users` por `user_id`, o histórico depende da correspondência do contato. Depois da implantação do modelo definitivo de perfis, a consulta deve usar a identidade autenticada como vínculo principal.

## 6. Fluxos de convite

### Administrador convida prestador

1. O administrador acessa **Admin > Convites**.
2. Informa o e-mail do prestador.
3. O sistema gera um token na tabela `provider_invites`.
4. O link utiliza o formato `#prestador=TOKEN`.
5. O convidado abre o link e preenche o cadastro.
6. O convite passa de `ativo` para `usado`.
7. Conforme a política, o prestador fica em análise ou é aprovado automaticamente.

### Prestador convida cliente

1. O prestador precisa estar aprovado e ativo.
2. Ele gera um convite na própria área.
3. O token é armazenado em `client_invites`.
4. O link utiliza o formato `#cliente=TOKEN`.
5. O cliente acessa a loja e solicita um agendamento.
6. Os dados ficam vinculados ao prestador que originou o convite.

## 7. Área administrativa

A gestão está dividida para evitar uma página única muito longa:

- **Visão geral:** indicadores, pendências e políticas ativas.
- **Prestadores:** lista, aprovação, ativação e pausa.
- **Convites:** criação de link para novo prestador.
- **Configurações:** marca e regras operacionais.
- **Privacidade:** indicadores LGPD e solicitações registradas.

Na barra lateral, as ações de tema e saída ficam próximas ao nome do projeto, antes das seções de navegação.

## 8. Área do prestador

A área operacional está dividida em:

- **Agenda:** compromissos do dia, filtros, status e bloqueios.
- **Serviços:** cadastro, preço, duração, disponibilidade, ordem e fotos.
- **Clientes:** vínculos, histórico, retorno e contato.
- **Resumo:** receita estimada, atendimentos e relacionamento com clientes.
- **Desempenho da loja:** visualizações, visitantes, início de agendamento, conversão e comparação por serviço.
- **Minha loja:** identidade, vitrine, convite e links públicos.

O prestador também possui recursos para:

- Gerar e copiar link de agendamento.
- Gerar e copiar link da loja.
- Compartilhar o acesso quando permitido pela plataforma.
- Personalizar título, mensagem, oferta, cores, estilo, logotipo e destaques.

## 9. Banco de dados

### Tabelas principais

| Tabela | Responsabilidade |
| --- | --- |
| `platform_settings` | Marca e regras globais da plataforma |
| `providers` | Cadastro e estado dos prestadores |
| `provider_services` | Serviços oferecidos por cada prestador |
| `portfolio_photos` | Fotos gerais e fotos vinculadas a serviços |
| `bookings` | Agendamentos solicitados |
| `clients` | Cadastro global de clientes |
| `provider_clients` | Vínculo e consentimento entre prestador e cliente |
| `blocked_slots` | Horários indisponíveis na agenda |
| `privacy_requests` | Solicitações de privacidade/LGPD |
| `provider_invites` | Convites enviados pelo administrador |
| `client_invites` | Convites enviados por prestadores |
| `analytics_events` | Eventos do funil comercial vinculados ao prestador e ao serviço |

### Eventos internos de desempenho

- `visualizou_servico`: registrado quando o cliente acessa ou seleciona um serviço.
- `iniciou_agendamento`: registrado na primeira interação com o formulário ou ao clicar para agendar.
- `agendamento_concluido`: registrado somente depois que o pedido é salvo no banco.

Os eventos usam um identificador anônimo salvo no navegador para calcular visitantes únicos e evitar duplicações na mesma visita. A aba **Indicadores** do prestador apresenta o funil e o desempenho por serviço.

### Segurança atual

Todas as tabelas possuem RLS habilitada, mas as políticas de dados atuais permitem acesso completo para `anon` e `authenticated`. A autenticação de conta é real; a autorização dos dados ainda permanece aberta apenas para homologação.

Antes da produção com usuários reais, substituir essas políticas por regras baseadas em `auth.uid()` e nas relações de papel e propriedade dos dados.

## 10. Arquitetura recomendada para autenticação

Para suportar múltiplos papéis de forma segura, recomenda-se criar:

```text
auth.users
    └── profiles
          └── user_roles
                ├── admin
                ├── provider
                └── client
```

Estrutura sugerida:

- `profiles`: dados comuns da pessoa autenticada.
- `user_roles`: um registro por papel atribuído ao usuário.
- `providers.user_id`: proprietário autenticado do negócio.
- `clients.user_id`: identidade autenticada do cliente.
- `role_requests`: pedidos para receber um novo papel.
- `provider_invites`: convite administrativo vinculado a e-mail e validade.
- `client_invites`: origem do relacionamento entre cliente e prestador.

As políticas RLS devem garantir:

- Admin acessa dados globais conforme sua responsabilidade.
- Prestador acessa apenas negócio, agenda, serviços e clientes vinculados a ele.
- Cliente acessa apenas os próprios dados e agendamentos.
- Conteúdo público expõe somente informações comerciais necessárias.
- Tokens de convite possuem expiração, uso único e cancelamento.

## 11. Configuração local

### Pré-requisitos

- Node.js instalado.
- Acesso ao projeto Supabase.
- Arquivo `.env.local` configurado.

### Variáveis necessárias

```env
VITE_SUPABASE_URL=URL_DO_PROJETO
VITE_SUPABASE_ANON_KEY=CHAVE_PUBLICA_ANON
```

Nunca registrar `.env.local`, tokens privados ou chaves administrativas no GitHub.

### Instalação e execução

```powershell
npm install
npm run dev
```

Endereço local padrão:

```text
http://localhost:5173
```

Se a porta estiver ocupada, o Vite selecionará outra e mostrará o endereço no terminal.

### Acesso administrativo local

```text
Admin master: jeffersonmaycon.sc@gmail.com
```

A senha é gerenciada pelo próprio usuário em **Minha conta** e não deve ser registrada neste documento.

## 12. Comandos de desenvolvimento

```powershell
npm run dev           # Inicia o ambiente local
npm run build         # Gera e valida a versão de produção
npm run lint          # Analisa problemas de código
npm run fix-encoding  # Verifica a codificação dos arquivos
npm run preview       # Abre localmente o build de produção
```

O lint possui atualmente um aviso conhecido em `scripts/fix-encoding.mjs` relacionado ao uso intencional de expressão regular com caracteres de controle.

## 13. GitHub e publicação

### Repositório

```text
https://github.com/jeffersonmayconsc-alt/meuservicopro.git
```

Branch principal: `main`.

### Vercel

O projeto está configurado como SPA por meio de `vercel.json`, direcionando todas as rotas para `index.html`.

Domínio principal de produção: `https://meuservicopro.vercel.app`.

Em 2026-08-29 o alias antigo `marketplace-profit-center.vercel.app` foi removido da Vercel para evitar confusão com o nome anterior do projeto. Após a remoção, `meuservicopro.vercel.app` respondeu `200` e o alias antigo respondeu `404`. Depois de cada deploy, conferir `vercel alias ls`, porque a Vercel pode reanexar aliases históricos; se isso acontecer, remover novamente com `vercel alias rm marketplace-profit-center.vercel.app --yes`.

Antes de publicar:

1. Executar `npm run lint`.
2. Executar `npm run build`.
3. Conferir `git status --short`.
4. Garantir que `.env.local`, `dist`, `.vercel`, `node_modules` e arquivos temporários não serão enviados.
5. Validar os fluxos de administrador, prestador e cliente localmente.
6. Publicar somente após aprovação da versão local.

## 14. Arquivos que não devem ser versionados

- `.env`
- `.env.local`
- `.vercel/`
- `node_modules/`
- `dist/`
- `supabase/.temp/`
- Capturas de tela temporárias
- Logs locais
- Arquivos com tokens, senhas ou chaves privadas

### Módulo operacional do representante

O representante possui uma área própria em `src/modules/representative/RepresentativePreview.jsx`, dividida em **Visão geral**, **Minha carteira** e **Convites**.

- Visualiza indicadores somente dos prestadores vinculados.
- Aprova, pausa e acessa a operação dos prestadores da própria carteira.
- Vincula a conta de acesso do prestador.
- Gera convites por `create_scoped_provider_invite`; o banco associa automaticamente o convite e o futuro prestador ao representante autenticado.
- Não transfere prestadores, administra outros representantes ou altera configurações globais.
- O Admin master pode pré-visualizar uma carteira, mas não cria convites em nome do representante.

O vínculo de autoridade continua sendo `providers.representative_user_id`. A interface filtra a carteira para clareza operacional, enquanto a autorização efetiva deve permanecer garantida pelas funções e políticas RLS do Supabase.

### Debug de acesso do representante

Em 2026-08-29 foi corrigido o fluxo em que o botão **Definir senha** podia ficar preso em **Salvando...** na tela de representantes.

- O front chama a Edge Function `admin-set-password` com `email`, `userId` e `passwordLength` quando a conta do representante já existe.
- A Edge Function atualiza o usuário diretamente por `userId`, evitando varrer a lista inteira do Supabase Auth nesse fluxo.
- Quando a conta já existe, a função atualiza apenas senha e metadados; a confirmação de e-mail fica preservada no Auth.
- O front usa timeout de 20 segundos e mostra uma mensagem contextual em vez de deixar o botão bloqueado.
- Representante que já acessou aparece com a ação **Redefinir senha**; conta pendente ou sem acesso aparece como **Definir senha**.
- A função `admin-set-password` precisa estar publicada no Supabase sempre que esse contrato mudar.
- O teste local deve ser feito em `http://127.0.0.1:5173`, na aba **Admin > Rede de representantes > Contas**.

Também foi corrigido o roteamento de links de convite. O hash `#representante=...` agora é tratado antes da rota pública de agenda, então não cai mais no aviso **Este link de agendamento não está mais disponível**. Convites de prestador (`#prestador=...`) e cliente (`#cliente=...`) também são isolados da validação de `#agendar`/`#loja`.

Em seguida foi validado o link público `#agendar=consultoria-norte-p3`. A causa do erro era operacional: o prestador `Consultoria Norte` estava com `active=false` e `approval_status='pausado'`. Foi reativado para `active=true` e `approval_status='aprovado'`, e a rota passou a abrir os serviços e o formulário de agendamento em produção.

O link de divulgação/agendamento (`#agendar=<slug>`) também passou a exibir as configurações públicas do prestador que antes ficavam mais concentradas no link de loja (`#loja=<slug>`): tema, título do convite, mensagem, primeira oferta, destaques e fotos vinculadas aos serviços. O objetivo é que o link usado em divulgação já carregue contexto comercial suficiente sem esconder o formulário de agendamento.

### Homologação do perfil Prestador

Homologação executada em produção para os prestadores ativos:

- `clinica-vida-plena-p1`
- `estudio-corpo-livre-p2`
- `consultoria-norte-p3`

Fluxos validados:

- Link público `#agendar=<slug>` abre sem cair no login e sem mostrar erro indevido.
- Link público `#loja=<slug>` abre a vitrine e mantém CTA de agendamento.
- Cada prestador ativo possui 3 serviços ativos.
- O formulário público de agendamento existe em cada link.
- Foi criado um agendamento de homologação para cada prestador ativo via interface pública.
- Os registros de teste foram removidos em seguida: 3 agendamentos, 3 clientes e 3 vínculos `provider_clients`.
- O link `#agendar=consultoria-norte-p3` exibe título, mensagem, oferta, destaques e foto de serviço configurados pelo prestador.

Bloqueio encontrado:

- Os prestadores ativos `p1`, `p2` e `p3` estão sem `owner_user_id`.
- Sem esse vínculo, o painel interno do Prestador não pode ser homologado como login real do prestador.
- A gestão agora destaca **Prestadores sem acesso** em **Admin > Visão geral**, apontando para a aba Prestadores, onde o Admin master deve usar **Criar acesso** ou **Vincular conta**.

Critério para homologação final do painel Prestador:

1. Cada prestador ativo precisa ter uma conta vinculada.
2. O login do prestador deve abrir diretamente o módulo Prestador.
3. Validar abas Agenda, Serviços, Clientes, Insights, Desempenho da loja e Minha loja com esse login real.
4. Repetir teste de link público depois de qualquer alteração em Minha loja ou Serviços.

### Landing page profissional do prestador

Em 2026-08-30 foi iniciada a ampliação do submódulo **Prestador > Minha loja** para permitir que o prestador monte uma landing page mais profissional sem misturar funções operacionais.

Nova aba: **Conversão**.

Ordem das abas em **Minha loja** segue a ordem de criação/visualização da landing:

1. **Identidade:** marca, nome, cores, estilo e tema público.
2. **Vitrine:** história, destaques e link da loja.
3. **Recursos:** profissionais/salas que aparecem como opção no agendamento.
4. **Conversão:** CTA, prova social, selos, FAQ e canais comerciais.
5. **Convite:** link direto e convite individual do cliente.

Quando houver recursos ativos em `provider_resources`, a landing pública exibe uma seção **Equipe e estrutura**. Essa seção ajuda o cliente a entender quem/sala/equipe pode atendê-lo antes de chegar ao formulário de agendamento.

Recursos adicionados:

- Subtítulo comercial da página pública.
- Texto configurável do botão principal.
- Tema público definido pelo prestador: automático, claro ou escuro.
- WhatsApp comercial e Instagram.
- Selos de confiança.
- Blocos de prova social/resultados.
- Título da seção de prova social.
- Perguntas frequentes da landing page.

Novas colunas em `public.providers`:

- `landing_subtitle`
- `cta_label`
- `proof_title`
- `proof_items`
- `faq_items`
- `contact_channels`
- `trust_badges`

Migration local: `supabase/migrations/20260830020000_provider_landing_page_builder.sql`.

Esses campos aparecem no link público `#loja=<slug>` e também complementam `#agendar=<slug>` quando houver dados preenchidos. O objetivo é melhorar conversão sem esconder o formulário de agendamento.

O seletor de aparência não deve aparecer para o cliente na landing pública da loja. A decisão visual do link público fica em **Prestador > Minha loja > Identidade > Tema público**, salvo em `providers.theme.publicAppearance`.

O prestador também possui uma prévia dentro de **Prestador > Minha loja**, abaixo do editor. A prévia usa o rascunho atual (`inviteDraft`), então alterações ainda não salvas já aparecem para conferência antes de publicar no link real. A prévia é contextual: cada aba mostra o trecho da landing que está sendo editado naquele momento, em vez de sempre mostrar a página inteira.

Os estilos **Profissional**, **Acolhedor** e **Premium** não devem ser apenas variações sutis de borda. Eles alteram a presença da landing pública e da prévia interna:

- **Profissional:** página mais direta, compacta e operacional.
- **Acolhedor:** largura maior, hero mais suave, destaque lateral e cards em grade mais respirada.
- **Premium:** hero amplo, CTA mais forte, cards de serviço em três colunas e blocos com tratamento visual mais sofisticado.

Refinamento Premium em 2026-08-30:

- Hero com logo em destaque, profundidade visual, CTA arredondado e contraste mais forte.
- Topo Premium usa composição própria: logo em selo absoluto no desktop, conteúdo em duas colunas internas, moldura discreta, oferta alinhada com CTA e recuo removido no mobile.
- Cards de serviço com acabamento elevado, sombra discreta e imagem em proporção mais nobre.
- Cards Premium de serviço possuem hierarquia própria: título mais forte, descrição com leitura confortável, preço/duração em cápsula e ação visual **Selecionar** sem alterar o fluxo de clique.
- No desktop, a vitrine Premium usa três colunas quando há espaço.
- No mobile, a vitrine Premium volta para uma coluna para preservar leitura e toque confortável.

## 15. Requisitos de landing page para divulgação

Em 2026-08-30, a landing do prestador recebeu a primeira camada dos requisitos necessários para divulgação em tráfego pago e canais públicos.

Campos adicionados em `public.providers` pela migration local `supabase/migrations/20260830040000_provider_landing_marketing_controls.sql`:

- `terms_text`: política, regras de atendimento, cancelamento e privacidade do prestador.
- `neighborhood`, `address`, `service_mode`: local e formato do atendimento.
- `hero_banner_url` e `gallery_photos`: banner/galeria configurável por URL, além da galeria por upload em `portfolio_photos`.
- `testimonials`: depoimentos completos com nome, foto, nota e texto.
- `seo_title` e `seo_description`: SEO básico por prestador.
- `meta_pixel_id` e `google_tag_id`: IDs de rastreamento externo, sem permitir script livre.
- `thank_you_title` e `thank_you_message`: conteúdo da página exibida após o agendamento.
- `landing_status`: controle de publicação entre `rascunho` e `publicado`.

O padrão da migration ficou como `publicado` para não tirar do ar prestadores antigos já aprovados. Novos prestadores criados pelo app iniciam como `rascunho` no fluxo local, e precisam ser salvos/publicados pelo prestador ou pela gestão.

No painel, os controles ficam em **Prestador > Minha loja**:

- **Identidade:** marca, tema público, status da landing e SEO básico.
- **Vitrine:** história, local/formato de atendimento, banner principal, banners, fotos, galeria por URL, destaques e exibição de preços.
- **Recursos:** profissionais/salas/equipe que aparecem no agendamento quando ativos.
- **Conversão:** subtítulo, CTA, canais comerciais, selos, prova social, depoimentos completos, página de obrigado, pixels externos, política/termos e FAQ.
- **Convite:** links e textos de convite direto para cliente.

Na página pública:

- Prestadores em `rascunho` deixam de aparecer nos links públicos.
- O cliente vê local/formato de atendimento quando preenchido.
- Banner principal e galeria aparecem na vitrine.
- Depoimentos aparecem quando houver nome ou texto.
- Política/termos aparecem em bloco próprio na landing.
- Após solicitar agendamento, o cliente vê a tela de obrigado configurada pelo prestador.
- Eventos internos continuam alimentando `analytics_events`.
- Eventos externos disparam para Meta/Google apenas por ID configurado, usando eventos como `view_storefront`, `view_booking_page` e `booking_complete`.

Limitação importante: como o projeto ainda usa Vite SPA com rotas por hash (`#loja=` e `#agendar=`), o SEO básico melhora título/descrição no navegador, mas não substitui uma rota pública real como `/loja/slug` com renderização/prerender para indexação forte e compartilhamento perfeito em redes sociais.

## 16. Regra de trabalho com agentes

Para preservar tempo, custo e foco, ajustes pequenos devem ser tratados de forma direta.

- Usar subagentes somente quando houver trabalho paralelo real ou revisão especializada necessária.
- Evitar auditorias completas para mudanças pequenas de UI ou texto.
- Rodar apenas as validações proporcionais ao risco da alteração.
- Para alteração visual simples, priorizar leitura pontual, patch pequeno e `npm run build`.
- Só rodar lint, Playwright, Supabase ou deploy quando a mudança tocar fluxo crítico, banco, produção ou comportamento público.
- Respostas finais devem ser curtas, dizendo o que mudou e qual validação foi feita.

Para ajustes com imagem de referência:

- Primeiro descrever objetivamente a imagem antes de editar: forma, tamanho, cor, borda, fundo, sombra, texto e hierarquia.
- Separar o que é parte do ícone do que é fundo, botão, halo ou efeito decorativo.
- Quando o usuário disser “só o ícone”, remover texto, badges, halos, fundos extras e contornos que não fazem parte do próprio símbolo.
- Preferir SVG/HTML/CSS direto quando o objetivo for ícone preciso; evitar tentativa visual por aproximação.
- Se houver dúvida entre duas interpretações, aplicar a mais literal e simples da referência.
- Depois do primeiro ajuste, validar visualmente a diferença principal antes de continuar refinando detalhes.

## 17. Próximas prioridades

1. Criar o modelo `profiles` + `user_roles` para múltiplos papéis.
2. Fechar as políticas RLS e testar cada perfil isoladamente.
4. Criar validade, cancelamento e histórico completo dos convites.
5. Continuar a extração de administração, cliente, agenda, serviços e loja do `App.jsx` para seus respectivos módulos.
6. Substituir `alert()` por notificações e mensagens contextuais.
7. Adicionar testes automatizados para login, convite, agendamento e permissões.
8. Criar trilha de auditoria para ações administrativas.
9. Definir política de retenção, exclusão e exportação de dados.
10. Validar acessibilidade e responsividade em todas as áreas antes da produção final.

## 18. Critérios mínimos para uso em produção

O projeto só deve receber dados reais quando os itens abaixo estiverem concluídos:

- Autenticação real ativada.
- E-mails verificados e recuperação de senha funcionando.
- Papéis persistidos no banco e não inferidos pelo e-mail.
- RLS restritiva validada para todos os perfis.
- Convites com validade, uso único e revogação.
- Logs e auditoria das ações sensíveis.
- Política de privacidade e termos publicados.
- Rotina de backup e recuperação validada.
- Testes dos fluxos críticos aprovados.
- Variáveis de produção configuradas sem exposição de segredos.

---

**Documento local de referência.** Atualize este guia sempre que houver mudança relevante na arquitetura, nas regras de acesso, no banco de dados ou no processo de publicação.
