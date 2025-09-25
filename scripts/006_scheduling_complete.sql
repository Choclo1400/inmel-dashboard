-- Extensiones necesarias
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- =========================================
-- 1. Tablas base
-- =========================================
create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nombre varchar(255) not null,
  especialidad varchar(100),
  zona varchar(100),
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  enel_id varchar(64),
  direccion text,
  tipo varchar(100),
  prioridad varchar(20),
  sla_from timestamptz,
  sla_to timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Plantillas de turnos (semanales)
create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid references technicians(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0=Dom, 6=Sáb
  start_time time not null,
  end_time time not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Bloqueos duros (licencias/feriados/entrenamiento)
-- technician_id NULL => feriado global
create table if not exists time_off (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid references technicians(id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime   timestamptz not null,
  reason varchar(255),
  type varchar(20) not null check (type in ('paid','unpaid','safety','holiday','training')),
  status varchar(20) default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Citas / reservas
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references service_requests(id) on delete cascade,
  technician_id uuid references technicians(id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime   timestamptz not null,
  status varchar(20) default 'pending' check (status in ('pending','confirmed','done','canceled')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  duration_min int generated always as ((extract(epoch from (end_datetime - start_datetime))/60)::int) stored
);

-- =========================================
-- 2. Integridad y performance
-- =========================================
alter table working_hours
  add constraint wh_start_before_end check (start_time < end_time);

create unique index if not exists idx_working_hours_unique
  on working_hours (technician_id, weekday, start_time, end_time);

create index if not exists idx_bookings_technician_time
  on bookings (technician_id, start_datetime, end_datetime);

create index if not exists idx_time_off_technician_time
  on time_off (technician_id, start_datetime, end_datetime);

-- Exclusion constraint anti-solapes (bookings)
alter table bookings
  add column if not exists tsrange tstzrange
  generated always as (tstzrange(start_datetime, end_datetime, '[)')) stored;

create index if not exists bookings_tsrange_gist
  on bookings using gist (technician_id, tsrange);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'no_overlap_bookings'
  ) then
    alter table bookings add constraint no_overlap_bookings
      exclude using gist (
        technician_id with =,
        tsrange       with &&
      ) where (status in ('pending','confirmed'));
  end if;
end$$;

-- (Opcional) Exclusion para time_off por técnico
alter table time_off
  add column if not exists tsrange tstzrange
  generated always as (tstzrange(start_datetime, end_datetime, '[)')) stored;

create index if not exists time_off_tsrange_gist
  on time_off using gist (coalesce(technician_id, '00000000-0000-0000-0000-000000000000'::uuid), tsrange);

-- =========================================
-- 3. Triggers de updated_at
-- =========================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bookings_updated_at on bookings;
create trigger trg_bookings_updated_at
before update on bookings
for each row execute function set_updated_at();

drop trigger if exists trg_technicians_updated_at on technicians;
create trigger trg_technicians_updated_at
before update on technicians
for each row execute function set_updated_at();

-- =========================================
-- 4. Row Level Security (RLS)
-- =========================================
alter table technicians  enable row level security;
alter table working_hours enable row level security;
alter table time_off      enable row level security;
alter table bookings      enable row level security;
alter table service_requests enable row level security;

-- Políticas mínimas (ajusta a tus roles reales)
-- Lectura abierta a usuarios autenticados
create policy if not exists tech_select on technicians for select to authenticated using (true);
create policy if not exists wh_select   on working_hours for select to authenticated using (true);
create policy if not exists to_select   on time_off for select to authenticated using (true);
create policy if not exists bkg_select  on bookings for select to authenticated using (true);
create policy if not exists sr_select   on service_requests for select to authenticated using (true);

-- Insert controlado por el creador
create policy if not exists bkg_insert on bookings for insert to authenticated
  with check (created_by = auth.uid());

create policy if not exists to_insert on time_off for insert to authenticated
  with check (created_by = auth.uid());

create policy if not exists sr_insert on service_requests for insert to authenticated
  with check (created_by = auth.uid());

-- Update (ejemplo permisivo para supervisores/planificadores) -> personalízalo
create policy if not exists bkg_update on bookings for update to authenticated using (true) with check (true);
create policy if not exists to_update  on time_off for update to authenticated using (true) with check (true);