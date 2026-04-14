drop function if exists public.create_reservation(
    text,
    text,
    text,
    integer,
    joschi.reservation_area,
    date,
    time,
    text
);

create or replace function public.create_reservation(
    guest_name text,
    guest_phone text,
    guest_email text,
    party_size integer,
    area joschi.reservation_area,
    reservation_date date,
    reservation_time time,
    notes text default '',
    metadata_input jsonb default '{}'::jsonb
)
returns joschi.reservations
language plpgsql
security definer
set search_path = public, joschi
as $$
declare
    normalized_metadata jsonb;
    inserted_row joschi.reservations;
begin
    normalized_metadata := case
        when jsonb_typeof(coalesce(metadata_input, '{}'::jsonb)) = 'object'
            then coalesce(metadata_input, '{}'::jsonb)
        else '{}'::jsonb
    end;

    insert into joschi.reservations (
        guest_name,
        guest_phone,
        guest_email,
        party_size,
        area,
        reservation_date,
        reservation_time,
        notes,
        source,
        status,
        metadata
    )
    values (
        trim(create_reservation.guest_name),
        trim(create_reservation.guest_phone),
        lower(trim(create_reservation.guest_email)),
        create_reservation.party_size,
        create_reservation.area,
        create_reservation.reservation_date,
        create_reservation.reservation_time,
        coalesce(trim(create_reservation.notes), ''),
        'website',
        'pending',
        normalized_metadata || jsonb_build_object(
            'submitted_from', 'vercel-api',
            'submitted_at', now()
        )
    )
    returning * into inserted_row;

    return inserted_row;
end;
$$;

revoke all on function public.create_reservation(
    text,
    text,
    text,
    integer,
    joschi.reservation_area,
    date,
    time,
    text,
    jsonb
) from public;

grant execute on function public.create_reservation(
    text,
    text,
    text,
    integer,
    joschi.reservation_area,
    date,
    time,
    text,
    jsonb
) to anon, authenticated, service_role;
