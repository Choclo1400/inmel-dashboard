-- RBAC users table aligned to prompt
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text not null,
  apellido text not null,
  telefono text,
  rol text not null check (rol in ('ADMIN','SUPERVISOR','GESTOR','TECNICO','SYSTEM')),
  activo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;

-- Helper to check roles
create or replace function public.has_role(required_roles text[])
returns boolean language sql stable as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.rol = any(required_roles)
  );
$$;

-- Read policy: ADMIN/SUPERVISOR/GESTOR see all; TECNICO only self
drop policy if exists users_read_all on public.users;
create policy users_read_all on public.users
  for select using (
    auth.role() = 'authenticated' and (
      public.has_role(array['ADMIN','SUPERVISOR','GESTOR']) or id = auth.uid()
    )
  );

-- Insert: only ADMIN
drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin on public.users
  for insert with check ( public.has_role(array['ADMIN']) );

-- Update: ADMIN any
drop policy if exists users_update_admin on public.users;
create policy users_update_admin on public.users
  for update using ( public.has_role(array['ADMIN']) ) with check ( true );

-- Update self: cannot change rol/activo/email
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using ( id = auth.uid() )
  with check (
    id = auth.uid()
    and (rol is not distinct from old.rol)
    and (activo is not distinct from old.activo)
    and (email is not distinct from old.email)
  );

-- Optional: audit table if not exists
create table if not exists public.audit_logs (
  id bigserial primary key,
  entity text not null,
  entity_id text not null,
  action text not null,
  by_user uuid references public.users(id),
  at timestamptz default now(),
  meta jsonb
);

alter table public.audit_logs enable row level security;
create policy audit_logs_select_self on public.audit_logs for select using (true);
create policy audit_logs_insert_any on public.audit_logs for insert with check (true);
