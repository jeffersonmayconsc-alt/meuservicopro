-- Carrinho de interesse: cliente pode marcar mais de um serviço como
-- interesse (além do que efetivamente está sendo agendado no horário
-- escolhido); a lista extra fica registrada no agendamento pra o
-- prestador ver antes de entrar em contato. Não afeta cálculo de
-- horário/duração — é só informativo.
alter table public.bookings
  add column if not exists extra_services text not null default '';

-- Provider pode optar por não expor preço na vitrine pública (querem
-- negociar/conversar antes) sem precisar marcar "sob consulta" serviço
-- por serviço.
alter table public.providers
  add column if not exists show_prices boolean not null default true;
