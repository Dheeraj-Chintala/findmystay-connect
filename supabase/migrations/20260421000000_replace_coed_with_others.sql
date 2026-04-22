-- Normalize legacy gender values from co-ed to others.
update public.hostels
set gender = 'others'
where lower(gender) = 'co-ed';

update public.user_preferences
set preferred_gender = 'others'
where lower(preferred_gender) = 'co-ed';
