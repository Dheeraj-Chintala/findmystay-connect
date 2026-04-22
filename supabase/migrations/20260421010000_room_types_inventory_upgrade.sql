-- Room inventory upgrade: move from rooms to room_types and transactional check-in.

create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.hostels(id) on delete cascade,
  type text not null,
  price numeric not null check (price >= 0),
  total_beds integer not null check (total_beds > 0),
  occupied_beds integer not null default 0,
  available_beds integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_types_occupied_non_negative check (occupied_beds >= 0),
  constraint room_types_available_non_negative check (available_beds >= 0),
  constraint room_types_occupied_le_total check (occupied_beds <= total_beds),
  constraint room_types_available_formula check (available_beds = total_beds - occupied_beds)
);

create index if not exists room_types_property_id_idx on public.room_types(property_id);
create index if not exists room_types_type_idx on public.room_types(type);

create unique index if not exists room_types_property_type_unique
  on public.room_types(property_id, type);

create trigger set_updated_at
  before update on public.room_types
  for each row execute function public.update_updated_at();

alter table public.room_types enable row level security;

drop policy if exists "Anyone can read room types" on public.room_types;
create policy "Anyone can read room types"
  on public.room_types for select
  to anon, authenticated
  using (true);

drop policy if exists "Owners manage room types for own hostels" on public.room_types;
create policy "Owners manage room types for own hostels"
  on public.room_types for all
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = room_types.property_id
        and hostels.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.hostels
      where hostels.id = room_types.property_id
        and hostels.owner_id = auth.uid()
    )
  );

insert into public.room_types (property_id, type, price, total_beds, occupied_beds, available_beds, created_at)
select
  r.hostel_id,
  r.sharing_type,
  r.price_per_month,
  greatest(r.total_beds, 1),
  greatest(r.total_beds - r.available_beds, 0),
  greatest(r.available_beds, 0),
  r.created_at
from public.rooms r
on conflict (property_id, type) do update
set
  price = excluded.price,
  total_beds = excluded.total_beds,
  occupied_beds = excluded.occupied_beds,
  available_beds = excluded.available_beds;

alter table public.bookings add column if not exists room_type_id uuid references public.room_types(id) on delete set null;

update public.bookings b
set room_type_id = rt.id
from public.rooms r
join public.room_types rt
  on rt.property_id = r.hostel_id
 and rt.type = r.sharing_type
where b.room_id = r.id
  and b.room_type_id is null;

drop index if exists bookings_room_id_idx;
create index if not exists bookings_room_type_id_idx on public.bookings(room_type_id);

create or replace function public.owner_checkin_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if not exists (
    select 1 from public.hostels h
    where h.id = v_booking.hostel_id
      and h.owner_id = auth.uid()
  ) then
    raise exception 'Not authorized to check in this booking';
  end if;

  if v_booking.status <> 'approved' then
    raise exception 'Only approved bookings can be checked in';
  end if;

  if v_booking.room_type_id is null then
    raise exception 'Booking has no room type selected';
  end if;

  update public.room_types rt
  set occupied_beds = rt.occupied_beds + 1,
      available_beds = rt.total_beds - (rt.occupied_beds + 1)
  where rt.id = v_booking.room_type_id
    and rt.available_beds > 0;

  if not found then
    raise exception 'No beds available in selected room type';
  end if;

  update public.bookings
  set status = 'checked_in'
  where id = p_booking_id
  returning * into v_booking;

  insert into public.hostel_members (hostel_id, user_id, booking_id, status)
  values (v_booking.hostel_id, v_booking.user_id, v_booking.id, 'active')
  on conflict (hostel_id, user_id)
  do update set
    booking_id = excluded.booking_id,
    status = excluded.status,
    joined_at = now();

  return v_booking;
end;
$$;

grant execute on function public.owner_checkin_booking(uuid) to authenticated, service_role;
