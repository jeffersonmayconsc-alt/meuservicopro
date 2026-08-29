# Meu Serviço Online

Projeto de agendamento multi-serviÃ§o para homologaÃ§Ã£o de fluxo entre cliente, prestador e administrador.

## O que estÃ¡ pronto

- Portal do cliente por link do prestador para solicitar horÃ¡rios sem ver outros prestadores.
- Cadastro leve do cliente no momento do agendamento, com aceite de uso dos dados.
- Cliente Ãºnico na plataforma pelo contato, com vÃ­nculo separado por prestador.
- Consentimento registrado por vÃ­nculo cliente-prestador, com finalidade visÃ­vel ao cliente.
- SolicitaÃ§Ã£o de privacidade pelo cliente para acesso ou exclusÃ£o de dados.
- Painel do prestador com abas de agenda, clientes e insights.
- Catalogo de servicos por prestador, com N servicos, preco fixo/a partir de/sob consulta, duracao variavel, ordenacao e pausa.
- Portfolio de fotos em base64, com fotos gerais e fotos vinculadas a servicos, carregado sob demanda.
- Destaques livres em chips na vitrine publica do prestador.
- Agenda operacional por data, com ocupaÃ§Ã£o do dia, quadro de horÃ¡rios e bloqueios manuais.
- Filtros de agenda por status e filtros de clientes por relacionamento.
- Ação de recontato por WhatsApp para clientes sem retorno, abrindo direto na conversa com o número do cliente quando o contato for um celular reconhecível.
- Status do agendamento trocado em 1 clique por um grupo de botões (pendente/confirmado/concluído/cancelado), sem abrir menu.
- Indicadores de hoje, pendentes, clientes, receita estimada, concluÃ­dos e sem retorno.
- Painel admin para cadastrar prestadores, pausar/ativar operaÃ§Ã£o e personalizar nome/cor da plataforma.
- Auto cadastro do prestador pela tela inicial, com status `em anÃ¡lise`.
- Admin atua como aprovaÃ§Ã£o e governanÃ§a, nÃ£o como digitador obrigatÃ³rio do cadastro.
- Painel admin com governanÃ§a LGPD, clientes globais, vÃ­nculos e pedidos de privacidade.
- ParÃ¢metros administrativos para cadastro, aprovaÃ§Ã£o, agenda, retorno, LGPD, compartilhamento e taxa da plataforma.
- Controle de auto cadastro aberto/fechado e aprovaÃ§Ã£o manual/automÃ¡tica.
- Tela de login por perfil para homologar permissÃµes de cliente, prestador e admin.
- Interface responsiva para desktop e celular.
- Dados compartilhados de verdade entre navegadores/dispositivos via Supabase (Postgres), em vez de `localStorage` isolado por navegador.
- ValidaÃ§Ã£o contra conflito de horÃ¡rio no mesmo prestador.
- Link compartilhÃ¡vel por prestador usando `#agendar=ID_DO_PRESTADOR`.
- Link pÃºblico automÃ¡tico pelo nome da loja + identificador curto, como `#agendar=clinica-vida-plena-p1`.
- Link da loja para divulgaÃ§Ã£o, como `#loja=clinica-vida-plena-p1`, separado do link de convite/agendamento.
- PÃ¡gina de convite personalizada por prestador com upload de logo/imagem, tÃ­tulo, mensagem e proposta de primeiro agendamento.
- Tema visual por prestador, com cor principal, cor de fundo e estilo da pÃ¡gina pÃºblica.
- GestÃ£o de clientes com Ãºltimo atendimento, dias sem retorno e alerta de recontato.
- Agendamento salva o servico especifico em `bookings.service_id`; reservas antigas sem servico continuam aparecendo como "Servico nao especificado".
- Cliente que volta a agendar com o mesmo prestador no mesmo navegador tem nome, contato e último serviço pré-preenchidos, com opção de "não é você? limpar dados salvos" (dado guardado só no navegador do cliente, por prestador, nunca enviado como consentimento).
- Consentimento LGPD já registrado para aquele contato com aquele prestador não é pedido do zero de novo — o checkbox nasce marcado e avisa que já há registro, mas continua editável.
- Link de agendamento/loja inválido ou de prestador sem serviços disponíveis mostra aviso claro em vez de expor a tela interna da plataforma.

## DecisÃµes de custo zero

- Frontend em React + Vite.
- Banco de dados no Supabase Free (Postgres) â€” sem custo nesta fase, mas jÃ¡ compartilhado entre quem acessa o app, ao contrÃ¡rio do `localStorage`.
- Sem servidor prÃ³prio obrigatÃ³rio e sem autenticaÃ§Ã£o paga nesta fase.
- **Atualização 2026-08-29:** o login já usa autenticação real (Supabase Auth, senha de verdade) pra admin e prestador — deixou de ser simulação. O cliente público continua sem login (nome+contato direto no formulário).
- **Aviso de segurança (atualizado):** o papel `anon` (cliente público, sem login) continua com RLS aberta de propósito — é o que sustenta o agendamento sem conta, aceitável só porque o app segue em fase de homologação sem dados reais de clientes. Já o papel autenticado (admin/representante/prestador) **não é mais aberto** — cada um só acessa o que tem permissão de gerenciar. Ver `guia_claudinha.md` §4.1 e `supabase/schema.sql` para o detalhe das políticas.
- Mesmo que um cliente receba links de vÃ¡rios prestadores, cada prestador enxerga apenas o vÃ­nculo e histÃ³rico gerados com ele (isso Ã© aplicado em cÃ³digo, nÃ£o por regra de banco, pelo motivo acima).
- A camada LGPD atual Ã© homologÃ¡vel: registra consentimento e pedidos, mas ainda precisa de autenticaÃ§Ã£o real e trilha de auditoria para produÃ§Ã£o.

## Quando evoluir

Para produÃ§Ã£o real, os prÃ³ximos passos naturais sÃ£o:

- AutenticaÃ§Ã£o real (Supabase Auth) e polÃ­ticas de RLS por papel (cliente/prestador/admin), substituindo o acesso aberto atual.
- Envio de confirmaÃ§Ã£o por WhatsApp/e-mail apenas quando houver provedor definido.
- Separar URLs pÃºblicas por prestador, por exemplo `/clinica-vida-plena`.
- Auditoria LGPD completa: polÃ­tica de privacidade pÃºblica, trilha de auditoria, autenticaÃ§Ã£o real, regras de acesso, exportaÃ§Ã£o e exclusÃ£o efetiva de dados.
- Mover upload de logo (hoje base64 direto no banco) para Supabase Storage.

## Como rodar

1. Crie um projeto no [Supabase](https://supabase.com) (Free tier).
2. No **SQL Editor** do painel, rode `supabase/schema.sql` e depois `supabase/seed.sql`, nessa ordem.
3. Em **Project Settings â†’ API**, copie a **Project URL** e a chave **anon public**.
4. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do passo 3.
5. Rode:

```bash
npm install
npm run dev
```

## HomologaÃ§Ã£o sugerida

1. Entrar como cliente e criar um agendamento.
2. Verificar o agendamento no painel do prestador.
3. Alterar status para confirmado/concluÃ­do/cancelado.
4. Solicitar cadastro de um novo prestador pela tela inicial.
5. Aprovar o prestador no admin e validar que ele passa a ter link e agenda.
6. Alterar nome/cor da plataforma e validar a personalizaÃ§Ã£o.
7. Entrar como prestador, copiar o link gerado pelo nome da loja + identificador e abrir em outra aba para validar o agendamento direto.
8. Copiar o link da loja, abrir a pÃ¡gina pÃºblica e clicar em agendar.
9. Editar a pÃ¡gina de convite do prestador e conferir a experiÃªncia do cliente pelo link.
10. No painel do prestador, filtrar agenda, consultar clientes sem retorno e testar o botÃ£o de recontato.
11. Como cliente, registrar uma solicitaÃ§Ã£o de privacidade e conferir no painel admin.
12. No admin, alterar parÃ¢metros da plataforma e validar o impacto no cadastro, agendamento e privacidade.
13. No painel do prestador, bloquear um horÃ¡rio e confirmar que o cliente nÃ£o consegue agendar nele.
14. No painel do prestador, criar 3 servicos, incluindo um "sob consulta" e um com duracao vazia, e conferir a vitrine publica.
15. Subir uma foto geral e uma foto de servico; confirmar que aparecem na loja e que a tela inicial continua sem carregar `portfolio_photos`.
