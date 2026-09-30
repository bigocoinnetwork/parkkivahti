-- Parkkivahti: käyttäjien ilmoitukset, kamerakuvat ja tarkastus Supabasessa.
-- Aja koko tiedosto: Supabase → SQL Editor → New query → liitä → Run. Voi ajaa uudelleen.
--
-- Oikeudet:
--   anon (kuka tahansa sovelluksen käyttäjä): saa ladata kuvan pending/-kansioon ja lisätä ODOTTAVAN ilmoituksen.
--       Ei voi lukea ilmoituksia eikä kuvia. Näkee vain hyväksytyt (approved_submissions, ilman kuvia).
--   tarkastaja (kirjautunut käyttäjä, jonka id on moderators-taulussa): lukee, hyväksyy/hylkää, katsoo ja poistaa kuvia.

create extension if not exists pgcrypto;

-- ---------- tarkastajat ----------
create table if not exists public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.moderators enable row level security;

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.moderators where user_id = auth.uid());
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to anon, authenticated;

-- ---------- ilmoitukset ----------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  kind text not null check (kind in ('correction','new')),
  target_id text check (char_length(target_id) <= 80),
  name text check (char_length(name) <= 120),
  address text check (char_length(address) <= 160),
  lat double precision not null check (lat between 59.5 and 70.2),
  lon double precision not null check (lon between 19 and 31.7),
  fee text not null check (fee in ('free','paid','gone')),
  max_stay_minutes int check (max_stay_minutes between 0 and 10080),
  limit_schedule jsonb not null default '[]'::jsonb check (jsonb_typeof(limit_schedule) = 'array' and pg_column_size(limit_schedule) < 2000),
  disc boolean not null default false,
  customers_only boolean not null default false,
  note text check (char_length(note) <= 500 and note !~* '(https?://|www\.)'),
  observed_on date not null check (observed_on > date '2025-01-01'),
  client_hash text check (char_length(client_hash) <= 64),
  photo_path text not null unique check (photo_path ~ '^pending/[0-9a-f-]{36}\.jpg$'),
  photo_taken_at timestamptz not null,
  photo_lat double precision not null check (photo_lat between 59.5 and 70.2),
  photo_lon double precision not null check (photo_lon between 19 and 31.7),
  photo_accuracy real not null check (photo_accuracy between 0 and 5000),
  photo_deleted boolean not null default false,
  reviewed_at timestamptz,
  moderator_note text check (char_length(moderator_note) <= 300)
);
alter table public.submissions enable row level security;

drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and moderator_note is null and photo_deleted = false);

drop policy if exists submissions_mod_select on public.submissions;
create policy submissions_mod_select on public.submissions for select to authenticated using (public.is_moderator());
drop policy if exists submissions_mod_update on public.submissions;
create policy submissions_mod_update on public.submissions for update to authenticated using (public.is_moderator()) with check (public.is_moderator());
drop policy if exists submissions_mod_delete on public.submissions;
create policy submissions_mod_delete on public.submissions for delete to authenticated using (public.is_moderator());

-- Lisäyksen tarkistukset palvelimella: tulvasuoja, kuvan tuoreus, kuvaajan etäisyys paikasta ja kuvan olemassaolo.
create or replace function public.submissions_before_insert() returns trigger
language plpgsql security definer set search_path = public, storage as $$
declare dist double precision;
begin
  if (select count(*) from public.submissions where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Ilmoituksia tulee juuri nyt liikaa. Yritä myöhemmin uudelleen.';
  end if;
  if new.client_hash is not null and (select count(*) from public.submissions
      where client_hash = new.client_hash and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Päivittäinen ilmoitusraja (10) on täynnä. Yritä huomenna uudelleen.';
  end if;
  if new.observed_on > current_date + 1 or new.observed_on < current_date - 400 then
    raise exception 'Havaintopäivän pitää olla viimeisen vuoden ajalta.';
  end if;
  if new.photo_taken_at < now() - interval '30 minutes' or new.photo_taken_at > now() + interval '5 minutes' then
    raise exception 'Kuva on liian vanha. Ota uusi kuva paikan päällä.';
  end if;
  dist := 2 * 6371000 * asin(sqrt(power(sin(radians(new.photo_lat - new.lat) / 2), 2)
          + cos(radians(new.lat)) * cos(radians(new.photo_lat)) * power(sin(radians(new.photo_lon - new.lon) / 2), 2)));
  if dist > 500 + least(new.photo_accuracy, 200) then
    raise exception 'Kuva on otettu liian kaukana ilmoitetusta paikasta.';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'report-photos' and name = new.photo_path) then
    raise exception 'Kuvaa ei löytynyt. Lähetä ilmoitus uudelleen.';
  end if;
  new.status := 'pending'; new.reviewed_at := null; new.moderator_note := null; new.created_at := now();
  return new;
end $$;
drop trigger if exists submissions_throttle on public.submissions;
drop trigger if exists submissions_before_insert on public.submissions;
create trigger submissions_before_insert before insert on public.submissions
  for each row execute function public.submissions_before_insert();

create or replace function public.submissions_reviewed() returns trigger language plpgsql as $$
begin
  if new.status <> old.status then new.reviewed_at := now(); end if;
  return new;
end $$;
drop trigger if exists submissions_reviewed on public.submissions;
create trigger submissions_reviewed before update on public.submissions
  for each row execute function public.submissions_reviewed();

-- Hyväksytyt julkisesti luettavaksi ilman kuvia ja laitetunnistetta.
drop view if exists public.approved_submissions;
create view public.approved_submissions as
  select id, kind, target_id, name, address, lat, lon, fee, max_stay_minutes, limit_schedule,
         disc, customers_only, note, observed_on, reviewed_at
  from public.submissions where status = 'approved';
grant select on public.approved_submissions to anon, authenticated;

-- ---------- kuvat (yksityinen säilö) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 3145728, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg'];

drop policy if exists "report photos upload" on storage.objects;
create policy "report photos upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'report-photos' and name ~ '^pending/[0-9a-f-]{36}\.jpg$');
drop policy if exists "report photos moderator read" on storage.objects;
create policy "report photos moderator read" on storage.objects for select to authenticated
  using (bucket_id = 'report-photos' and public.is_moderator());
drop policy if exists "report photos moderator delete" on storage.objects;
create policy "report photos moderator delete" on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and public.is_moderator());

-- ---------- ensimmäinen tarkastaja ----------
-- 1) Luo käyttäjä: Authentication → Users → Add user → Create new user (sähköposti + salasana, Auto Confirm).
-- 2) Aja alla oleva rivi omalla sähköpostillasi:
-- insert into public.moderators (user_id) select id from auth.users where email = 'sinun@osoite.fi';

-- ---------- kovennus (Supabasen tietoturvaneuvojan suositukset, lisätty 30.9.2026) ----------
-- Julkinen näkymä ilman SECURITY DEFINERiä: anon lukee vain hyväksytyt rivit ja vain turvalliset sarakkeet.
drop policy if exists submissions_public_approved on public.submissions;
create policy submissions_public_approved on public.submissions for select to anon, authenticated using (status = 'approved');
revoke select on public.submissions from anon;
grant select (id, kind, target_id, name, address, lat, lon, fee, max_stay_minutes, limit_schedule, disc, customers_only, note, observed_on, reviewed_at, status) on public.submissions to anon;
alter view public.approved_submissions set (security_invoker = true);
revoke execute on function public.is_moderator() from anon;
revoke execute on function public.submissions_before_insert() from public, anon, authenticated;
alter function public.submissions_reviewed() set search_path = public;
drop policy if exists moderators_self on public.moderators;
create policy moderators_self on public.moderators for select to authenticated using (user_id = auth.uid());
