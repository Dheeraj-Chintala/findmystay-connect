-- Public contact fields for tenants (RLS does not expose owner profiles to other users)
alter table public.hostels
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

comment on column public.hostels.contact_phone is 'Owner-published phone for listing contact';
comment on column public.hostels.contact_email is 'Owner-published email for listing contact';
