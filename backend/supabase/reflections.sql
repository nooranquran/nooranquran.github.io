-- برداشت‌های «تأمل روز»: زیر آیه روز (daily-words.js) هر کس می‌تواند برداشت کوتاهی بفرستد (learn-sheets.js › reflect).
-- اجرا در Supabase SQL Editor (پس از registration.sql و feedback.sql). اجرای دوباره بی‌خطر است و چیزی را پاک نمی‌کند.
-- هر برداشت تا مدیر در ‎#admin‎ › «نظرها» تأییدش نکرده، برای کسی دیده نمی‌شود. بازدیدکننده جدول را مستقیم نمی‌بیند؛
-- فقط با تابع‌های reflect_send و reflect_list. شناسه گوشی همان کد «پیشنهادها و نظرها» است و فقط هش آن ذخیره می‌شود.

create table if not exists public.reflections (
  id bigint generated always as identity primary key,
  device_hash text not null,
  ref text not null check (ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  name text check (name is null or char_length(name) <= 40),
  body text not null check (char_length(body) between 2 and 300),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reflections_ref_idx on public.reflections (ref, approved, created_at desc);
create index if not exists reflections_device_idx on public.reflections (device_hash, created_at desc);

alter table public.reflections enable row level security;
revoke all on public.reflections from anon;
grant select, update, delete on public.reflections to authenticated;
drop policy if exists "admin reads reflections" on public.reflections;
create policy "admin reads reflections" on public.reflections for select to authenticated using (public.is_site_admin());
drop policy if exists "admin updates reflections" on public.reflections;
create policy "admin updates reflections" on public.reflections for update to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admin deletes reflections" on public.reflections;
create policy "admin deletes reflections" on public.reflections for delete to authenticated using (public.is_site_admin());

-- فرستادن برداشت: حداکثر ۳۰۰ نویسه، و از هر گوشی حداکثر ۵ برداشت در ۲۴ ساعت.
create or replace function public.reflect_send(p_device text, p_ref text, p_body text, p_name text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare h text; b text := btrim(coalesce(p_body, '')); n text := nullif(btrim(coalesce(p_name, '')), ''); new_id bigint;
begin
  if p_device is null or char_length(p_device) not between 16 and 100 then raise exception 'bad_device'; end if;
  if p_ref is null or p_ref !~ '^[0-9]{1,3}:[0-9]{1,3}$' then raise exception 'bad_device'; end if;
  if char_length(b) < 2 then raise exception 'rf_empty'; end if;
  if char_length(b) > 300 then raise exception 'rf_long'; end if;
  if n is not null and char_length(n) > 40 then n := left(n, 40); end if;
  h := public.feedback_hash(p_device);
  if (select count(*) from public.reflections where device_hash = h and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'rf_limit';
  end if;
  insert into public.reflections (device_hash, ref, name, body) values (h, p_ref, n, b) returning id into new_id;
  return new_id;
end $$;

-- برداشت‌های تأییدشده یک آیه (۳۰ تای آخر).
create or replace function public.reflect_list(p_ref text)
returns table (name text, body text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.name, r.body, r.created_at from public.reflections r
  where r.ref = p_ref and r.approved
  order by r.created_at desc limit 30
$$;

revoke all on function public.reflect_send(text, text, text, text) from public;
revoke all on function public.reflect_list(text) from public;
grant execute on function public.reflect_send(text, text, text, text) to anon, authenticated;
grant execute on function public.reflect_list(text) to anon, authenticated;
