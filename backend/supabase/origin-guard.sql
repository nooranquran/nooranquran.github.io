-- نگهبان نشانی (۱۴۰۵/۰۸/۰۱): پایگاه داده فقط به صفحه‌هایی جواب می‌دهد که روی نشانی رسمی نوران باز شده‌اند.
-- چرا: کد سایت عمومی است و هر کس می‌تواند آن را روی نشانی دیگری بگذارد. بدون این نگهبان، آن کپی با همین کلید عمومی
-- گروه‌ها، چله‌ها و گزارش‌ها را از پایگاه داده ما می‌خواند و کاملاً واقعی به نظر می‌رسد. با این نگهبان، کپی در مرورگر
-- هیچ داده‌ای نمی‌گیرد و چیزی هم نمی‌تواند ثبت کند.
--
-- چطور: مرورگر در هر درخواست به Supabase سرآیند Origin (نشانی صفحه) را خودش می‌گذارد و کد صفحه نمی‌تواند آن را عوض کند.
-- PostgREST پیش از هر درخواست ‎/rest/v1‎ تابع check_origin را صدا می‌زند؛ اگر Origin در فهرست نباشد، درخواست رد می‌شود.
-- درخواست بی‌Origin (تابع‌های لبه، Cron، SQL Editor) مثل قبل کار می‌کند، چون از مرورگر نمی‌آید.
-- محدودیت: برنامه‌ای که بیرون از مرورگر اجرا شود می‌تواند Origin را جعل کند؛ این نگهبان جلوی سایت‌های کپی در مرورگر
-- بازدیدکنندگان را می‌گیرد، نه جلوی کسی که مستقیم با API کار می‌کند. حفاظت داده‌ها همچنان با RLS و تابع‌هاست.
--
-- اجرا: یک بار کل این فایل را در Supabase › SQL Editor اجرا کنید. اجرای دوباره بی‌خطر است.
-- برگرداندن (اگر سایت درست کار نکرد): فقط این دو خط را اجرا کنید:
--   alter role authenticator reset pgrst.db_pre_request;
--   notify pgrst, 'reload config';

create or replace function public.check_origin() returns void
language plpgsql stable set search_path = public, pg_temp as $$
declare o text := coalesce(nullif(current_setting('request.headers', true), '')::json->>'origin', '');
begin
  if o = ''
     or o in ('https://nooranquran.github.io', 'https://hezbkhani.github.io')
     or o ~ '^http://(localhost|127\.0\.0\.1)(:[0-9]+)?$' then
    return;
  end if;
  -- «null» هم رد می‌شود: صفحه‌های sandbox و فایل‌های محلی این را می‌فرستند و کپی‌ها می‌توانند پشتش پنهان شوند.
  raise exception 'origin_not_allowed' using errcode = '42501',
    hint = 'نشانی رسمی نوران فقط https://nooranquran.github.io است.';
end $$;

revoke all on function public.check_origin() from public;
grant execute on function public.check_origin() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.check_origin';
notify pgrst, 'reload config';
