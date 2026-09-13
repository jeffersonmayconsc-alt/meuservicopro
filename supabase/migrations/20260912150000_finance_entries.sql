-- Ledger manual de receita/despesa da operação da plataforma (não é billing
-- real). Só o admin master enxerga: nenhuma policy pra anon nem authenticated comum.
create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('receita', 'despesa')),
  category text not null default '',
  description text not null default '',
  amount numeric(10,2) not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists finance_entries_date_idx on public.finance_entries (date desc);
create index if not exists finance_entries_entry_type_idx on public.finance_entries (entry_type);

alter table public.finance_entries enable row level security;

drop policy if exists "master_manage_finance_entries" on public.finance_entries;
create policy "master_manage_finance_entries" on public.finance_entries for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());

grant select, insert, update, delete on public.finance_entries to authenticated;
