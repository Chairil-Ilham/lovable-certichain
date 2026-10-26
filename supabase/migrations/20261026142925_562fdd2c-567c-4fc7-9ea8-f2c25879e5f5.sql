create table public.demo_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kind text not null check (kind in ('admin','student'))
);
grant select on public.demo_accounts to authenticated;
grant all on public.demo_accounts to service_role;
alter table public.demo_accounts enable row level security;
create policy "Read own demo flag" on public.demo_accounts for select to authenticated using (user_id = auth.uid());

create or replace function public.is_demo_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.demo_accounts where user_id = auth.uid() and kind = 'admin')
$$;
revoke execute on function public.is_demo_admin() from public, anon;
grant execute on function public.is_demo_admin() to authenticated;

-- Demo admin: read everything, but only write certificates it created itself.
create policy "Demo admin reads certificates" on public.certificates for select to authenticated using (public.is_demo_admin());
create policy "Demo admin creates own certificates" on public.certificates for insert to authenticated
  with check (public.is_demo_admin() and created_by = auth.uid());
create policy "Demo admin updates own certificates" on public.certificates for update to authenticated
  using (public.is_demo_admin() and created_by = auth.uid())
  with check (public.is_demo_admin() and created_by = auth.uid());
create policy "Demo admin registers own certificates" on public.chain_registry for insert to authenticated
  with check (public.is_demo_admin() and exists (select 1 from public.certificates c where c.code = certificate_code and c.created_by = auth.uid()));
create policy "Demo admin updates own registry" on public.chain_registry for update to authenticated
  using (public.is_demo_admin() and exists (select 1 from public.certificates c where c.code = certificate_code and c.created_by = auth.uid()))
  with check (public.is_demo_admin() and exists (select 1 from public.certificates c where c.code = certificate_code and c.created_by = auth.uid()));