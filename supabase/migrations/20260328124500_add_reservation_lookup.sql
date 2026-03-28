create or replace function joschi.lookup_reservations_by_email(email_input text)
returns table (
    id uuid,
    status joschi.reservation_status,
    guest_name text,
    guest_email text,
    party_size integer,
    area joschi.reservation_area,
    reservation_date date,
    reservation_time time,
    notes text
)
language sql
security definer
set search_path = joschi, public
as $$
    select
        r.id,
        r.status,
        r.guest_name,
        r.guest_email,
        r.party_size,
        r.area,
        r.reservation_date,
        r.reservation_time,
        r.notes
    from joschi.reservations r
    where lower(r.guest_email) = lower(trim(email_input))
    order by r.reservation_date asc, r.reservation_time asc;
$$;

revoke all on function joschi.lookup_reservations_by_email(text) from public;
grant execute on function joschi.lookup_reservations_by_email(text) to anon, authenticated, service_role;
