-- ختم موازی قرآن (pkhatm.js، منوی ☰ › قرآن › «ختم قرآن موازی (گروهی)»، پیوند ?pk=main).
-- اجرا در Supabase SQL Editor پس از registration.sql، reminders.sql و khatm.sql (از khatm_priv.dev/hit/ip و push_check استفاده می‌کند).
-- اجرای دوباره بی‌خطر است و چیزی را پاک نمی‌کند.
--
-- هر کس، عضو حزب‌خوانی باشد یا نه، می‌گوید امروز چند صفحه یا چند آیه می‌خواند؛ از اولین جای خوانده‌نشده همان اندازه به او داده
-- می‌شود (pk_claims) تا دو نفر یک بخش را نخوانند. تا پایان روز بعد (نیمه‌شب به وقت تهران) باید «خواندم» بزند (همه یا بخشی)،
-- وگرنه بخشش آزاد می‌شود و به نفر بعد می‌رسد. وقتی همه ۶۲۳۶ آیه یک دور خوانده شد، آن ختم کامل است (pk_cycles) و دور بعد ادامه دارد.
-- اگر همه دور جاری برداشته شده باشد (هنوز نه خوانده)، نفر بعد از دور بعدی برمی‌دارد؛ پس در یک روز چند ختم هم ممکن است.
-- جای هر بخش با اندیس سراسری آیه است (۰ تا ۶۲۳۵، مثل quran/index.json)؛ ‎a_to‎ خودش جزء بخش نیست.
-- اعلان‌ها (یادآوری مهلت و «بخش باز هست») را تابع khatm-notify با pk_push_due می‌فرستد؛ جدول اشتراک جدا (pk_push) است.

create table if not exists public.pk_circles (
  id text primary key check (id ~ '^[a-z0-9_-]{2,20}$'),
  title text not null check (char_length(title) between 2 and 120),
  niyyat text not null default '' check (char_length(niyyat) <= 300),
  listed boolean not null default true,
  cycle integer not null default 1,        -- کوچک‌ترین دور ناتمام
  completed integer not null default 0,    -- تعداد ختم‌های کامل
  created_at timestamptz not null default now()
);
insert into public.pk_circles (id, title, niyyat) values ('main', 'ختم قرآن موازی نوران', '')
on conflict (id) do nothing;

create table if not exists public.pk_claims (
  id bigint generated always as identity primary key,
  circle_id text not null references public.pk_circles(id) on delete cascade,
  cycle integer not null check (cycle >= 1),
  a_from integer not null check (a_from between 0 and 6235),
  a_to integer not null check (a_to > a_from and a_to <= 6236),
  unit text not null check (unit in ('page', 'ayah')),
  name text not null default '' check (char_length(name) <= 40),
  device_hash text not null,
  user_id uuid,
  endpoint text check (endpoint is null or char_length(endpoint) <= 1000),
  claimed_at timestamptz not null default now(),
  deadline timestamptz not null,
  done boolean not null default false,
  done_at timestamptz
);
create index if not exists pk_claims_cycle_idx on public.pk_claims (circle_id, cycle, a_from);
create index if not exists pk_claims_pending_idx on public.pk_claims (device_hash) where not done;

create table if not exists public.pk_cycles (
  circle_id text not null references public.pk_circles(id) on delete cascade,
  cycle integer not null,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  readers integer not null default 0,
  primary key (circle_id, cycle)
);

-- اشتراک اعلان ختم موازی (جدا از push_subscriptions تا با لغو اعلان‌های دیگر پاک نشود).
create table if not exists public.pk_push (
  endpoint text primary key check (char_length(endpoint) <= 1000),
  p256dh text not null,
  auth text not null,
  circle_id text not null default 'main' references public.pk_circles(id) on delete cascade,
  device_hash text not null,
  open_on boolean not null default true,   -- خبر «بخش باز هست، بردارید» روزی یک بار
  created_at timestamptz not null default now()
);
create table if not exists public.pk_push_sent (
  endpoint text not null references public.pk_push(endpoint) on delete cascade,
  key text not null,
  at timestamptz not null default now(),
  primary key (endpoint, key)
);

alter table public.pk_circles enable row level security;
alter table public.pk_claims enable row level security;
alter table public.pk_cycles enable row level security;
alter table public.pk_push enable row level security;
alter table public.pk_push_sent enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pk_circles' and policyname = 'admin manages pk circles') then
    create policy "admin manages pk circles" on public.pk_circles for all to authenticated
      using (public.is_site_admin()) with check (public.is_site_admin());
  end if;
end $$;
revoke all on public.pk_claims, public.pk_cycles, public.pk_push, public.pk_push_sent from anon, authenticated;
grant select, insert, update on public.pk_circles to authenticated;

-- ---------- کمکی‌ها ----------
create schema if not exists pk_priv;
-- اندیس سراسری آیه اول هر صفحه مصحف (۶۰۴ صفحه، همان page در quran/index.json).
create or replace function pk_priv.ps() returns integer[] language sql immutable as $$
  select '{0,7,12,23,31,36,44,55,64,68,76,83,90,95,100,108,112,119,126,133,141,148,152,160,170,176,183,188,193,197,203,209,217,222,226,231,237,240,244,252,255,259,263,266,271,276,281,288,289,293,302,308,315,322,330,338,345,354,363,370,376,384,393,401,408,414,425,433,441,446,450,458,466,473,479,487,493,499,504,507,512,516,519,526,530,537,544,552,558,567,572,579,584,587,594,598,606,614,620,627,633,640,647,655,663,668,671,674,678,682,686,692,700,705,710,714,719,726,733,739,745,751,758,764,772,777,782,789,797,807,816,824,833,841,848,857,862,870,879,883,890,899,907,913,920,926,931,935,940,946,954,965,976,984,991,997,1005,1011,1021,1027,1035,1041,1049,1058,1074,1084,1091,1097,1103,1109,1113,1117,1124,1132,1141,1149,1160,1168,1176,1185,1193,1200,1205,1212,1221,1229,1235,1241,1248,1255,1261,1266,1271,1275,1282,1289,1296,1303,1307,1314,1321,1328,1334,1341,1346,1352,1357,1364,1370,1378,1384,1389,1397,1406,1417,1425,1434,1442,1452,1461,1470,1478,1485,1492,1501,1510,1518,1526,1535,1544,1554,1561,1570,1581,1590,1600,1610,1618,1626,1633,1639,1648,1659,1665,1674,1682,1691,1699,1707,1712,1720,1725,1735,1741,1749,1755,1760,1768,1774,1783,1792,1802,1817,1833,1853,1872,1892,1907,1915,1927,1935,1943,1955,1965,1973,1980,1988,1994,2003,2011,2019,2029,2036,2046,2056,2067,2078,2087,2095,2104,2115,2125,2133,2144,2155,2160,2167,2174,2185,2193,2201,2214,2223,2237,2250,2261,2275,2288,2301,2314,2326,2345,2360,2385,2399,2412,2424,2435,2446,2461,2473,2483,2493,2507,2518,2527,2540,2555,2564,2573,2584,2595,2600,2610,2618,2625,2633,2641,2650,2659,2667,2673,2690,2700,2715,2732,2747,2762,2777,2791,2801,2811,2818,2822,2827,2834,2844,2849,2852,2857,2866,2875,2887,2898,2910,2922,2932,2951,2971,2992,3015,3043,3068,3091,3115,3138,3159,3172,3181,3194,3203,3214,3222,3235,3247,3257,3265,3273,3280,3287,3295,3302,3311,3322,3329,3336,3346,3354,3363,3370,3378,3385,3392,3403,3414,3424,3433,3441,3450,3459,3469,3480,3488,3497,3503,3514,3523,3533,3539,3548,3555,3563,3568,3576,3583,3587,3595,3606,3613,3620,3628,3637,3645,3654,3663,3671,3678,3690,3698,3704,3717,3732,3745,3759,3775,3788,3812,3839,3864,3890,3914,3941,3970,3986,3996,4012,4031,4053,4063,4068,4079,4089,4098,4105,4114,4125,4132,4140,4149,4158,4166,4173,4182,4191,4199,4210,4218,4229,4238,4247,4256,4264,4272,4282,4287,4294,4303,4316,4323,4335,4347,4358,4372,4385,4398,4414,4432,4453,4473,4486,4495,4505,4515,4524,4530,4538,4545,4556,4564,4574,4583,4592,4598,4606,4611,4616,4623,4630,4645,4665,4681,4705,4726,4749,4766,4784,4810,4828,4852,4873,4895,4917,4941,4968,4995,5029,5055,5078,5086,5093,5099,5104,5110,5115,5125,5129,5135,5142,5150,5155,5161,5168,5177,5185,5192,5199,5208,5217,5222,5229,5236,5241,5253,5267,5286,5313,5331,5357,5385,5414,5429,5447,5460,5475,5494,5512,5542,5570,5596,5616,5641,5672,5702,5727,5758,5800,5829,5854,5882,5909,5931,5963,5993,6016,6043,6072,6098,6125,6137,6155,6176,6193,6207,6221}'::integer[]
$$;
-- صفحه آیه g (از ۱)
create or replace function pk_priv.page_of(g integer) returns integer language sql immutable set search_path = pk_priv, pg_temp as $$
  select max(i) from generate_subscripts(pk_priv.ps(), 1) i where (pk_priv.ps())[i] <= g
$$;
-- آیه اول صفحه p؛ برای p بزرگ‌تر از ۶۰۴، پایان قرآن.
create or replace function pk_priv.page_start(p integer) returns integer language sql immutable set search_path = pk_priv, pg_temp as $$
  select case when p > 604 then 6236 when p < 1 then 0 else (pk_priv.ps())[p] end
$$;
-- مهلت: پایان روز بعد به وقت تهران.
create or replace function pk_priv.deadline() returns timestamptz language sql stable as $$
  select (((now() at time zone 'Asia/Tehran')::date + 2)::timestamp) at time zone 'Asia/Tehran'
$$;
-- بخش‌های مهلت‌گذشته آزاد می‌شوند.
create or replace function pk_priv.purge(p_id text) returns void language sql security definer set search_path = public, pg_temp as $$
  delete from pk_claims where circle_id = p_id and not done and deadline <= now()
$$;
-- اولین جای خوانده‌نشده و برداشته‌نشده: (دور، از، تا پایان جای خالی)
create or replace function pk_priv.gap(p_id text, p_cycle integer, out c integer, out g_from integer, out g_to integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r record; pos integer;
begin
  c := p_cycle;
  loop
    pos := 0; g_to := null;
    for r in select a_from, a_to from pk_claims where circle_id = p_id and cycle = c order by a_from loop
      if r.a_from > pos then g_to := r.a_from; exit; end if;
      pos := greatest(pos, r.a_to);
    end loop;
    if g_to is null and pos < 6236 then g_to := 6236; end if;
    if g_to is not null then g_from := pos; return; end if;
    c := c + 1;
    if c > p_cycle + 60 then raise exception 'pk_busy'; end if;
  end loop;
end $$;

-- وضعیت ختم برای این گوشی
create or replace function pk_priv.view(p_id text, p_dh text) returns json
language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object(
    'id', k.id, 'title', k.title, 'niyyat', k.niyyat, 'cycle', k.cycle, 'completed', k.completed,
    'deadline', pk_priv.deadline(),
    'next', (select json_build_object('c', g.c, 'f', g.g_from, 't', g.g_to) from pk_priv.gap(k.id, k.cycle) g),
    'cycles', coalesce((select json_agg(json_build_object('c', x.cycle, 'done', x.d, 'taken', x.t) order by x.cycle) from (
        select cycle, sum(a_to - a_from) filter (where done)::integer d, sum(a_to - a_from) filter (where not done)::integer t
          from pk_claims where circle_id = k.id and cycle >= k.cycle group by cycle order by cycle limit 5) x), '[]'::json),
    'segs', coalesce((select json_agg(json_build_object('c', s.cycle, 'f', s.a_from, 't', s.a_to, 'd', s.done) order by s.cycle, s.a_from)
        from pk_claims s where s.circle_id = k.id and s.cycle between k.cycle and k.cycle + 1), '[]'::json),
    'mine', coalesce((select json_agg(json_build_object('id', m.id, 'c', m.cycle, 'f', m.a_from, 't', m.a_to, 'unit', m.unit,
              'deadline', m.deadline, 'at', m.claimed_at) order by m.claimed_at)
        from pk_claims m where m.circle_id = k.id and not m.done
         and (m.device_hash = p_dh or (m.user_id is not null and m.user_id = auth.uid()))), '[]'::json),
    'my_read', (select coalesce(sum(a_to - a_from), 0)::integer from pk_claims m where m.circle_id = k.id and m.done
         and (m.device_hash = p_dh or (m.user_id is not null and m.user_id = auth.uid()))),
    'today', (select json_build_object('readers', count(distinct device_hash), 'ayahs', coalesce(sum(a_to - a_from), 0)) from pk_claims t
         where t.circle_id = k.id and t.done and t.done_at >= ((now() at time zone 'Asia/Tehran')::date::timestamp at time zone 'Asia/Tehran')),
    'recent', coalesce((select json_agg(json_build_object('c', y.cycle, 'at', y.completed_at, 'readers', y.readers) order by y.cycle desc)
        from (select * from pk_cycles where circle_id = k.id order by cycle desc limit 5) y), '[]'::json))
  from pk_circles k where k.id = p_id
$$;

-- ---------- تابع‌های بازدیدکننده ----------
create or replace function public.pk_get(p_id text, p_device text) returns json
language plpgsql security definer set search_path = public, pg_temp as $$
declare dh text := khatm_priv.dev(p_device); res json;
begin
  perform khatm_priv.hit('pd:' || dh, 'minute', 60);
  perform khatm_priv.hit('pi:' || khatm_priv.ip(), 'minute', 1500);
  perform pk_priv.purge(left(coalesce(p_id, ''), 20));
  res := pk_priv.view(left(coalesce(p_id, ''), 20), dh);
  if res is null then raise exception 'pk_not_found'; end if;
  return res;
end $$;

-- برداشتن بخش امروز: p_unit 'page' یا 'ayah'، p_count چند صفحه یا آیه.
-- از اولین جای باز شروع می‌شود؛ اگر آن جای باز (بخشی که آزاد شده) کوچک‌تر بود، همان‌قدر داده می‌شود.
create or replace function public.pk_claim(p_id text, p_device text, p_unit text, p_count integer, p_name text default '', p_endpoint text default null)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare dh text := khatm_priv.dev(p_device); k pk_circles; g record; e integer; n integer; nm text; ep text; nid bigint;
begin
  if p_unit not in ('page', 'ayah') then raise exception 'pk_bad_unit'; end if;
  if p_count is null or p_count < 1 or (p_unit = 'page' and p_count > 604) or (p_unit = 'ayah' and p_count > 6236) then raise exception 'pk_bad_count'; end if;
  perform khatm_priv.hit('pd:' || dh, 'minute', 20);
  perform khatm_priv.hit('pc:' || dh, 'day', 60);
  perform khatm_priv.hit('pi:' || khatm_priv.ip(), 'minute', 600);
  select * into k from pk_circles where id = p_id for update;
  if not found then raise exception 'pk_not_found'; end if;
  perform pk_priv.purge(k.id);
  select count(*) into n from pk_claims where circle_id = k.id and not done and device_hash = dh;
  if n >= 3 then raise exception 'pk_too_many'; end if;
  select * into g from pk_priv.gap(k.id, k.cycle);
  if p_unit = 'page' then e := pk_priv.page_start(pk_priv.page_of(g.g_from) + p_count);
  else e := g.g_from + p_count; end if;
  e := least(e, g.g_to, 6236);
  nm := left(coalesce(public.reg_clean_name(p_name), ''), 40);
  ep := case when p_endpoint is not null and exists (select 1 from pk_push where endpoint = p_endpoint) then p_endpoint end;
  insert into pk_claims (circle_id, cycle, a_from, a_to, unit, name, device_hash, user_id, endpoint, deadline)
  values (k.id, g.c, g.g_from, e, p_unit, nm, dh, auth.uid(), ep, pk_priv.deadline()) returning id into nid;
  return json_build_object('claimed', nid, 'view', pk_priv.view(k.id, dh));
end $$;

-- «خواندم»: همه بخش، یا اگر p_upto داده شد، تا پیش از آیه p_upto (بقیه آزاد می‌شود).
create or replace function public.pk_done(p_id text, p_claim bigint, p_device text, p_upto integer default null)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare dh text := khatm_priv.dev(p_device); k pk_circles; m pk_claims; total integer; fin integer := null; c integer;
begin
  perform khatm_priv.hit('pd:' || dh, 'minute', 30);
  select * into k from pk_circles where id = p_id for update;
  if not found then raise exception 'pk_not_found'; end if;
  perform pk_priv.purge(k.id);
  select * into m from pk_claims where id = p_claim and circle_id = k.id and not done
     and (device_hash = dh or (user_id is not null and user_id = auth.uid()));
  if not found then raise exception 'pk_not_mine'; end if;
  if p_upto is not null then
    if p_upto <= m.a_from then raise exception 'pk_bad_count'; end if;
    if p_upto < m.a_to then m.a_to := p_upto; end if;
  end if;
  update pk_claims set done = true, done_at = now(), a_to = m.a_to where id = m.id;
  select coalesce(sum(a_to - a_from), 0) into total from pk_claims where circle_id = k.id and cycle = m.cycle and done;
  if total >= 6236 and not exists (select 1 from pk_cycles where circle_id = k.id and cycle = m.cycle) then
    insert into pk_cycles (circle_id, cycle, started_at, readers)
    select k.id, m.cycle, min(claimed_at), count(distinct device_hash) from pk_claims where circle_id = k.id and cycle = m.cycle;
    fin := m.cycle;
    c := k.cycle;
    while exists (select 1 from pk_cycles where circle_id = k.id and cycle = c) loop c := c + 1; end loop;
    update pk_circles set completed = completed + 1, cycle = c where id = k.id;
  end if;
  return json_build_object('finished', fin, 'view', pk_priv.view(k.id, dh));
end $$;

-- پس دادن بخش برداشته‌شده
create or replace function public.pk_release(p_id text, p_claim bigint, p_device text) returns json
language plpgsql security definer set search_path = public, pg_temp as $$
declare dh text := khatm_priv.dev(p_device); n integer;
begin
  perform khatm_priv.hit('pd:' || dh, 'minute', 30);
  perform 1 from pk_circles where id = p_id for update;
  delete from pk_claims where id = p_claim and circle_id = p_id and not done
     and (device_hash = dh or (user_id is not null and user_id = auth.uid()));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'pk_not_mine'; end if;
  return pk_priv.view(p_id, dh);
end $$;

-- روشن کردن اعلان ختم موازی برای این گوشی؛ بخش‌های برداشته‌شده همین گوشی هم یادآوری مهلت می‌گیرند.
create or replace function public.pk_push_on(p_id text, p_device text, p_endpoint text, p_p256dh text, p_auth text, p_open boolean default true)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare dh text := khatm_priv.dev(p_device);
begin
  perform khatm_priv.hit('pd:' || dh, 'minute', 20);
  perform public.push_check(p_endpoint, p_p256dh, p_auth);
  if not exists (select 1 from pk_circles where id = p_id) then raise exception 'pk_not_found'; end if;
  insert into pk_push (endpoint, p256dh, auth, circle_id, device_hash, open_on) values (p_endpoint, p_p256dh, p_auth, p_id, dh, coalesce(p_open, true))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, circle_id = excluded.circle_id,
    device_hash = excluded.device_hash, open_on = excluded.open_on;
  update pk_claims set endpoint = p_endpoint where circle_id = p_id and not done and device_hash = dh;
end $$;

create or replace function public.pk_push_off(p_endpoint text) returns void
language sql security definer set search_path = public, pg_temp as $$
  update pk_claims set endpoint = null where endpoint = p_endpoint and not done;
  delete from pk_push where endpoint = p_endpoint;
$$;

create or replace function public.pk_push_status(p_endpoint text) returns json
language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object('on', true, 'open', open_on) from pk_push where endpoint = p_endpoint
$$;

-- ---------- برای تابع khatm-notify (فقط service_role) ----------
-- ۱) یادآوری مهلت: از ۶ ساعت مانده به پایان مهلت (یعنی شب روز بعد)، برای بخشی که هنوز «خواندم» نخورده.
-- ۲) «بخش باز هست»: روزی یک بار از ساعت ۱۰ صبح تهران، برای گوشی‌هایی که الان بخشی دست ندارند.
create or replace function public.pk_push_due() returns table (endpoint text, p256dh text, auth text, key text, title text, body text, url text)
language sql stable security definer set search_path = public, pg_temp as $$
  with day as (select (now() at time zone 'Asia/Tehran') as t)
  select p.endpoint, p.p256dh, p.auth, 'due:' || c.id,
         'مهلت بخش ختم موازی قرآن',
         'بخشی که برداشته‌اید (' || case when c.unit = 'page' then (pk_priv.page_of(c.a_to - 1) - pk_priv.page_of(c.a_from) + 1)::text || ' صفحه' else (c.a_to - c.a_from)::text || ' آیه' end
           || ') تا پایان امشب مهلت دارد. اگر خواندید «خواندم» را بزنید (اگر بخشی را خواندید، همان‌قدر را ثبت کنید)؛ وگرنه به نفر دیگری داده می‌شود.',
         '?pk=' || c.circle_id
    from pk_claims c join pk_push p on p.endpoint = c.endpoint
   where not c.done and c.deadline > now() and c.deadline - now() <= interval '6 hours'
     and not exists (select 1 from pk_push_sent s where s.endpoint = p.endpoint and s.key = 'due:' || c.id)
  union all
  select p.endpoint, p.p256dh, p.auth, 'open:' || p.circle_id || ':' || ((select t from day)::date)::text,
         k.title,
         'ختم ' || k.cycle::text || ' در جریان است' || case when k.completed > 0 then ' (تاکنون ' || k.completed::text || ' ختم کامل شده)' else '' end
           || '. بخش‌های باز مانده؛ اگر امروز فرصت دارید، چند صفحه یا چند آیه بردارید و بخوانید.',
         '?pk=' || p.circle_id
    from pk_push p join pk_circles k on k.id = p.circle_id
   where p.open_on and extract(hour from (select t from day)) between 10 and 20
     and not exists (select 1 from pk_claims c where c.circle_id = p.circle_id and not c.done and c.deadline > now() and c.device_hash = p.device_hash)
     and not exists (select 1 from pk_push_sent s where s.endpoint = p.endpoint and s.key = 'open:' || p.circle_id || ':' || ((select t from day)::date)::text)
$$;
create or replace function public.pk_push_cleanup() returns void
language sql security definer set search_path = public, pg_temp as $$
  delete from pk_push_sent where at < now() - interval '30 days';
$$;

revoke all on function public.pk_push_due(), public.pk_push_cleanup() from public, anon, authenticated;
grant execute on function public.pk_push_due(), public.pk_push_cleanup() to service_role;
revoke all on function public.pk_get(text, text), public.pk_claim(text, text, text, integer, text, text), public.pk_done(text, bigint, text, integer),
  public.pk_release(text, bigint, text), public.pk_push_on(text, text, text, text, text, boolean), public.pk_push_off(text), public.pk_push_status(text) from public;
grant execute on function public.pk_get(text, text), public.pk_claim(text, text, text, integer, text, text), public.pk_done(text, bigint, text, integer),
  public.pk_release(text, bigint, text), public.pk_push_on(text, text, text, text, text, boolean), public.pk_push_off(text), public.pk_push_status(text) to anon, authenticated;
revoke all on all functions in schema pk_priv from public;

-- ─────────────────────────────────────────────────────────────
-- زمان‌بندی اعلان‌ها (پس از deploy تابع khatm-notify با JWT خاموش)؛ همان x-cron-secret کار site-notifications:
-- select cron.schedule('pk-notifications', '*/15 * * * *', $c$ select net.http_post(
--   url := 'https://<project>.supabase.co/functions/v1/khatm-notify',
--   headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 60000) $c$);
