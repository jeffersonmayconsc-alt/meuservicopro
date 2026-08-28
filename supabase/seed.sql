-- ============================================================
-- Meu Servico Online - dados de demonstracao
-- Rode depois de schema.sql. Replica o initialState que o app
-- usava no localStorage, pra qualquer link ja testado continuar
-- funcionando (slugs calculados com o mesmo algoritmo do app).
-- ============================================================

insert into public.platform_settings
  (id, brand_name, brand_accent, brand_support, brand_privacy_email, approval_mode,
   min_lead_hours, max_advance_days, return_alert_days, inactive_alert_days,
   cancellation_window_hours, default_slot_interval, require_consent,
   allow_client_privacy_request, allow_provider_self_signup, allow_whatsapp_share, platform_fee_percent)
values
  (1, 'Meu Serviço Online', '#2563eb', 'contato@meuservicopro.local', 'privacidade@meuservicopro.local', 'manual',
   2, 30, 30, 60, 12, 60, true, true, true, true, 0)
on conflict (id) do nothing;

insert into public.providers
  (id, name, owner, category, city, service, invite_title, invite_message, first_offer,
   logo_url, theme, duration, price, highlights, active, approval_status, capacity, slug)
values
  ('p1', 'Clinica Vida Plena', 'Dra. Marina Lopes', 'Saude', 'Sao Paulo', 'Consulta inicial',
   'Bem-vindo ao seu primeiro atendimento',
   'Agende sua consulta com tranquilidade. Vou entender sua necessidade e indicar o melhor caminho para o seu cuidado.',
   'Primeira consulta com avaliacao completa e plano inicial.',
   '', '{"accent":"#2563eb","background":"#111827","style":"profissional"}'::jsonb,
   50, 180, array['Atendimento humanizado', 'Plano inicial personalizado'], true, 'aprovado', 8, 'clinica-vida-plena-p1'),
  ('p2', 'Estudio Corpo Livre', 'Renato Alves', 'Bem-estar', 'Curitiba', 'Avaliacao e plano',
   'Comece seu plano com uma avaliacao',
   'Escolha o melhor horario para conversarmos sobre seus objetivos e montar uma rotina possivel para voce.',
   'Avaliacao inicial com plano personalizado.',
   '', '{"accent":"#0f766e","background":"#10231f","style":"acolhedor"}'::jsonb,
   60, 120, array['Treinos adaptados', 'Acompanhamento individual'], true, 'aprovado', 6, 'estudio-corpo-livre-p2'),
  ('p3', 'Consultoria Norte', 'Bianca Reis', 'Consultoria', 'Belo Horizonte', 'Sessao estrategica',
   'Vamos organizar sua proxima decisao',
   'Reserve uma sessao para mapear cenario, prioridades e proximos passos com clareza.',
   'Primeira sessao estrategica com diagnostico.',
   '', '{"accent":"#7c3aed","background":"#1f1b2e","style":"premium"}'::jsonb,
   45, 250, array['Diagnostico objetivo', 'Plano de acao claro'], false, 'pausado', 4, 'consultoria-norte-p3')
on conflict (id) do nothing;

insert into public.provider_services
  (id, provider_id, name, description, price, price_mode, duration, active, position)
values
  ('ps-p1-1', 'p1', 'Consulta inicial', 'Primeira consulta com avaliacao completa e plano inicial.', 180, 'fixo', 50, true, 0),
  ('ps-p1-2', 'p1', 'Retorno terapeutico', 'Sessao de acompanhamento para revisar evolucao, ajustes e proximos passos.', 140, 'fixo', 40, true, 1),
  ('ps-p1-3', 'p1', 'Orientacao familiar', 'Conversa orientativa para familiares, com encaminhamentos combinados apos a avaliacao.', 0, 'sob_consulta', null, true, 2),
  ('ps-p2-1', 'p2', 'Avaliacao e plano', 'Avaliacao inicial com plano personalizado.', 120, 'fixo', 60, true, 0),
  ('ps-p2-2', 'p2', 'Sessao avulsa', 'Treino acompanhado com foco no objetivo combinado para o dia.', 70, 'fixo', 50, true, 1),
  ('ps-p2-3', 'p2', 'Pacote mensal 8x', 'Plano recorrente com oito sessoes mensais e ajuste de rotina.', 480, 'fixo', null, true, 2),
  ('ps-p3-1', 'p3', 'Sessao estrategica', 'Primeira sessao estrategica com diagnostico.', 250, 'fixo', 45, true, 0),
  ('ps-p3-2', 'p3', 'Projeto sob medida', 'Diagnostico e proposta para projetos com escopo aberto.', 0, 'sob_consulta', null, true, 1)
on conflict (id) do nothing;

insert into public.clients (id, name, contact, consent, created_at) values
  ('c1', 'Ana Beatriz', 'ana@email.com', true, '2026-08-24T12:00:00.000Z'),
  ('c2', 'Carlos Mendes', 'carlos@email.com', true, '2026-08-24T12:00:00.000Z'),
  ('c3', 'Juliana Costa', 'juliana@email.com', true, '2026-08-24T12:00:00.000Z')
on conflict (id) do nothing;

insert into public.provider_clients (id, provider_id, client_id, created_at) values
  ('pc1', 'p1', 'c1', '2026-08-24T12:00:00.000Z'),
  ('pc2', 'p1', 'c2', '2026-08-24T12:00:00.000Z'),
  ('pc3', 'p2', 'c3', '2026-08-24T12:00:00.000Z')
on conflict (id) do nothing;

insert into public.bookings (id, provider_id, client, contact, date, time, status, notes) values
  ('a1', 'p1', 'Ana Beatriz', 'ana@email.com', '2026-08-26', '09:00', 'confirmado', 'Primeira consulta'),
  ('a2', 'p1', 'Carlos Mendes', 'carlos@email.com', '2026-08-26', '14:00', 'pendente', 'Prefere atendimento online'),
  ('a3', 'p2', 'Juliana Costa', 'juliana@email.com', '2026-08-27', '10:00', 'confirmado', 'Quer remarcar se chover')
on conflict (id) do nothing;

insert into public.blocked_slots (id, provider_id, date, time, reason) values
  ('b1', 'p1', '2026-08-26', '11:00', 'Reuniao interna')
on conflict (id) do nothing;

-- privacy_requests: initialState nao trazia nenhuma, nada pra semear aqui.
