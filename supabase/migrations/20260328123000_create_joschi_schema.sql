create schema if not exists joschi;

grant usage on schema joschi to anon, authenticated, service_role;

create type joschi.reservation_area as enum ('innen', 'aussen');

create type joschi.reservation_status as enum (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
);

create or replace function joschi.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists joschi.reservations (
    id uuid primary key default gen_random_uuid(),
    status joschi.reservation_status not null default 'pending',
    source text not null default 'website',
    guest_name text not null,
    guest_phone text not null,
    guest_email text not null,
    party_size integer not null,
    area joschi.reservation_area not null,
    reservation_date date not null,
    reservation_time time not null,
    notes text not null default '',
    internal_notes text not null default '',
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    cancelled_at timestamptz,
    constraint reservations_source_check
        check (source in ('website', 'admin', 'import')),
    constraint reservations_party_size_check
        check (
            (area = 'innen' and party_size between 1 and 25)
            or (area = 'aussen' and party_size between 1 and 8)
        ),
    constraint reservations_email_check
        check (position('@' in guest_email) > 1)
);

create index if not exists reservations_date_time_idx
    on joschi.reservations (reservation_date, reservation_time);

create index if not exists reservations_area_date_time_idx
    on joschi.reservations (area, reservation_date, reservation_time);

create index if not exists reservations_status_date_idx
    on joschi.reservations (status, reservation_date);

create unique index if not exists reservations_import_source_idx
    on joschi.reservations (source, reservation_date, reservation_time, area, guest_email)
    where source = 'import';

drop trigger if exists reservations_set_updated_at on joschi.reservations;

create trigger reservations_set_updated_at
before update on joschi.reservations
for each row
execute function joschi.set_updated_at();

alter table joschi.reservations enable row level security;

grant insert on joschi.reservations to anon, authenticated;
grant select, insert, update, delete on joschi.reservations to service_role;

drop policy if exists "website_insert_pending_reservations" on joschi.reservations;

create policy "website_insert_pending_reservations"
on joschi.reservations
for insert
to anon, authenticated
with check (
    status = 'pending'
    and source = 'website'
    and internal_notes = ''
);

comment on schema joschi is 'Joschi reservation data.';

comment on table joschi.reservations is
'Canonical reservation store. Form mapping: name->guest_name, personen->party_size, bereich->area, datum->reservation_date, uhrzeit->reservation_time, telefon->guest_phone, email->guest_email, nachricht->notes.';
