create type joschi.campaign_channel as enum ('instagram', 'other');
create type joschi.campaign_mode as enum ('capture_then_redirect', 'direct_for_returning');
create type joschi.discount_reason as enum ('welcome_registration', 'repeat_visit');
create type joschi.discount_status as enum ('issued', 'redeemed', 'cancelled');

create table if not exists joschi.campaign_redirects (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    label text not null,
    target_url text not null,
    channel joschi.campaign_channel not null default 'instagram',
    mode joschi.campaign_mode not null default 'capture_then_redirect',
    is_active boolean not null default true,
    description text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    starts_at timestamptz,
    ends_at timestamptz,
    constraint campaign_redirects_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]*$')
);

create table if not exists joschi.lead_registrations (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references joschi.campaign_redirects(id) on delete cascade,
    name text not null,
    email_normalized text not null,
    email_verified_at timestamptz,
    service_email_accepted_at timestamptz not null default now(),
    marketing_consent_granted_at timestamptz,
    marketing_consent_text_version text,
    first_scan_at timestamptz not null default now(),
    last_scan_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lead_registrations_email_check check (position('@' in email_normalized) > 1),
    constraint lead_registrations_campaign_email_unique unique (campaign_id, email_normalized)
);

create table if not exists joschi.email_verification_codes (
    id uuid primary key default gen_random_uuid(),
    registration_id uuid not null references joschi.lead_registrations(id) on delete cascade,
    code_hash text not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    attempt_count integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists joschi.flyer_sessions (
    id uuid primary key default gen_random_uuid(),
    registration_id uuid not null references joschi.lead_registrations(id) on delete cascade,
    token_hash text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists joschi.discount_codes (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references joschi.campaign_redirects(id) on delete cascade,
    registration_id uuid not null references joschi.lead_registrations(id) on delete cascade,
    code text not null unique,
    discount_percent integer not null,
    reason joschi.discount_reason not null,
    status joschi.discount_status not null default 'issued',
    eligible_after_redemption_id uuid references joschi.discount_codes(id) on delete set null,
    issued_at timestamptz not null default now(),
    redeemed_at timestamptz,
    redemption_reference text,
    redeemed_by_admin text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint discount_codes_percent_check check (discount_percent in (5, 10)),
    constraint discount_codes_reason_unique unique (registration_id, reason)
);

create table if not exists joschi.scan_events (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references joschi.campaign_redirects(id) on delete cascade,
    registration_id uuid references joschi.lead_registrations(id) on delete set null,
    request_ip_hash text,
    user_agent text not null default '',
    referer text not null default '',
    created_at timestamptz not null default now()
);

create index if not exists campaign_redirects_active_slug_idx
    on joschi.campaign_redirects (slug, is_active);

create index if not exists lead_registrations_campaign_verified_idx
    on joschi.lead_registrations (campaign_id, email_verified_at);

create index if not exists email_verification_codes_registration_idx
    on joschi.email_verification_codes (registration_id, created_at desc);

create index if not exists flyer_sessions_registration_idx
    on joschi.flyer_sessions (registration_id, expires_at);

create index if not exists discount_codes_campaign_reason_idx
    on joschi.discount_codes (campaign_id, reason, status, issued_at desc);

create index if not exists discount_codes_code_idx
    on joschi.discount_codes (code);

create index if not exists scan_events_campaign_created_idx
    on joschi.scan_events (campaign_id, created_at desc);

drop trigger if exists campaign_redirects_set_updated_at on joschi.campaign_redirects;
create trigger campaign_redirects_set_updated_at
before update on joschi.campaign_redirects
for each row execute function joschi.set_updated_at();

drop trigger if exists lead_registrations_set_updated_at on joschi.lead_registrations;
create trigger lead_registrations_set_updated_at
before update on joschi.lead_registrations
for each row execute function joschi.set_updated_at();

drop trigger if exists flyer_sessions_set_updated_at on joschi.flyer_sessions;
create trigger flyer_sessions_set_updated_at
before update on joschi.flyer_sessions
for each row execute function joschi.set_updated_at();

drop trigger if exists discount_codes_set_updated_at on joschi.discount_codes;
create trigger discount_codes_set_updated_at
before update on joschi.discount_codes
for each row execute function joschi.set_updated_at();

alter table joschi.campaign_redirects enable row level security;
alter table joschi.lead_registrations enable row level security;
alter table joschi.email_verification_codes enable row level security;
alter table joschi.flyer_sessions enable row level security;
alter table joschi.discount_codes enable row level security;
alter table joschi.scan_events enable row level security;

grant select, insert, update, delete on joschi.campaign_redirects to service_role;
grant select, insert, update, delete on joschi.lead_registrations to service_role;
grant select, insert, update, delete on joschi.email_verification_codes to service_role;
grant select, insert, update, delete on joschi.flyer_sessions to service_role;
grant select, insert, update, delete on joschi.discount_codes to service_role;
grant select, insert, update, delete on joschi.scan_events to service_role;

create or replace view public.admin_flyer_code_view as
select
    dc.id,
    dc.campaign_id,
    dc.registration_id,
    dc.code,
    dc.discount_percent,
    dc.reason,
    dc.status,
    dc.eligible_after_redemption_id,
    dc.issued_at,
    dc.redeemed_at,
    dc.redemption_reference,
    dc.redeemed_by_admin,
    lr.name as registration_name,
    lr.email_normalized,
    lr.email_verified_at,
    cr.slug as campaign_slug,
    cr.label as campaign_label
from joschi.discount_codes dc
join joschi.lead_registrations lr on lr.id = dc.registration_id
join joschi.campaign_redirects cr on cr.id = dc.campaign_id;

grant select on public.admin_flyer_code_view to service_role;

insert into joschi.campaign_redirects (slug, label, target_url, channel, mode, description)
values (
    'flyer',
    'Flyer Hauptkampagne',
    'https://www.instagram.com/joschi_hamburg/',
    'instagram',
    'capture_then_redirect',
    'QR-Flyer mit E-Mail-Verifikation und Willkommensrabatt'
)
on conflict (slug) do update
set
    label = excluded.label,
    target_url = excluded.target_url,
    channel = excluded.channel,
    mode = excluded.mode,
    description = excluded.description,
    is_active = true;
