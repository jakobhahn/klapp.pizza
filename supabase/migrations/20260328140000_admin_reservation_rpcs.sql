create or replace function public.admin_list_upcoming_reservations()
returns table (
    id uuid,
    status joschi.reservation_status,
    guest_name text,
    guest_phone text,
    guest_email text,
    party_size integer,
    area joschi.reservation_area,
    reservation_date date,
    reservation_time time,
    notes text
)
language sql
security definer
set search_path = public, joschi
as $$
    select
        r.id,
        r.status,
        r.guest_name,
        r.guest_phone,
        r.guest_email,
        r.party_size,
        r.area,
        r.reservation_date,
        r.reservation_time,
        r.notes
    from joschi.reservations r
    where r.reservation_date >= timezone('Europe/Berlin', now())::date
    order by r.reservation_date asc, r.reservation_time asc, r.created_at asc;
$$;

create or replace function public.admin_confirm_reservation(reservation_id_input uuid)
returns joschi.reservations
language plpgsql
security definer
set search_path = public, joschi
as $$
declare
    updated_row joschi.reservations;
begin
    update joschi.reservations
    set
        status = 'confirmed',
        updated_at = now()
    where id = reservation_id_input
      and reservation_date >= timezone('Europe/Berlin', now())::date
    returning * into updated_row;

    return updated_row;
end;
$$;

revoke all on function public.admin_list_upcoming_reservations() from public;
grant execute on function public.admin_list_upcoming_reservations() to service_role;

revoke all on function public.admin_confirm_reservation(uuid) from public;
grant execute on function public.admin_confirm_reservation(uuid) to service_role;
