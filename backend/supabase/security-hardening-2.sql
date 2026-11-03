-- سخت‌گیری امنیتی، مرحله دوم (۱۴۰۵/۰۸/۱۲). یک بار در SQL Editor سوپابیس اجرا کنید؛ اجرای دوباره هم بی‌خطر است.
--
-- ۱) محدودیت تعداد برای هر اینترنت (IP) در ثبت‌نام چله، ثبت‌نام دوره، «ارسال نظر» و «برداشت آیه».
--    پیش از این، ثبت‌نام‌ها هیچ محدودیتی نداشتند: یک اسکریپت می‌توانست در چند ثانیه با نام‌های ساختگی همه ظرفیت یک چله
--    یا دوره را پر کند و جای مردم واقعی را بگیرد. محدودیت نظر و برداشت هم فقط برای هر «گوشی» بود که با عوض کردن شناسه
--    گوشی دور زده می‌شد. حدها بالاتر از بیشترین ثبت‌نام واقعی تا امروز است (بیشترین: ۱۷ ثبت‌نام در یک ساعت، از همه با هم)،
--    پس یک خانواده یا یک گروه پشت یک اینترنت گیر نمی‌کنند. مدیر سایت محدودیتی ندارد.
create or replace function khatm_priv.net_limit(p_kind text, p_min integer, p_hour integer)
returns void language plpgsql set search_path = public, pg_temp as $$
declare ip text := khatm_priv.ip(); c integer;
begin
  if public.is_site_admin() then return; end if;
  insert into khatm_rate as r (bucket, who, n) values (date_trunc('minute', now()), 'nl-m:' || p_kind || ':' || ip, 1)
  on conflict (bucket, who) do update set n = r.n + 1 returning r.n into c;
  if c > p_min then raise exception 'net_limit'; end if;
  insert into khatm_rate as r (bucket, who, n) values (date_trunc('hour', now()), 'nl-h:' || p_kind || ':' || ip, 1)
  on conflict (bucket, who) do update set n = r.n + 1 returning r.n into c;
  if c > p_hour then raise exception 'net_limit'; end if;
  if random() < 0.01 then delete from khatm_rate where bucket < now() - interval '2 days'; end if;
end $$;
revoke all on function khatm_priv.net_limit(text, integer, integer) from public, anon, authenticated;

-- حد را در ابتدای همان تابع‌ها می‌گذارد (بدنه‌ها دست نمی‌خورند). chl_add_member هم برای chl_join و هم chl_join_type است؛
-- reg_admin_add و chl_admin_add فقط برای مدیرند و net_limit مدیر را نمی‌شمارد.
do $$
declare f record; def text;
begin
  for f in select * from (values
      ('chl_add_member', 'join', 8, 30),
      ('reg_register',   'join', 8, 30),
      ('feedback_send',  'fb',   3, 10),
      ('reflect_send',   'rf',   4, 15)) v(fn, kind, per_min, per_hour)
  loop
    select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = f.fn;
    if def is null or position('net_limit' in def) > 0 then continue; end if;
    def := regexp_replace(def, '\mbegin\M', format('begin%s  perform khatm_priv.net_limit(%L, %s, %s);',
             chr(10), f.kind, f.per_min, f.per_hour));
    execute def;
  end loop;
end $$;

-- ۲) لایه دوم برای جدول‌ها: بازدیدکننده بی‌ورود (anon) فقط از راه تابع‌های سایت می‌نویسد، به‌جز گزارش روزانه.
--    RLS همین حالا جلوی نوشتن را می‌گیرد؛ این برای روزی است که سیاستی اشتباهی اضافه شود.
do $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
grant insert on public.daily_reports to anon;
-- فهرست مدیران را بی‌ورود هیچ‌کس نباید بخواند (RLS هم همین حالا چیزی نشان نمی‌دهد).
revoke all on public.site_admins from anon;
