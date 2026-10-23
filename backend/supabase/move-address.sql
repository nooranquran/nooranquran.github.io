-- انتقال اعلان‌های یک گوشی از نشانی قدیم سایت (hezbkhani.github.io) به نشانی تازه (nooranquran.github.io).
-- اجازهٔ اعلان در مرورگر برای هر نشانی جداست، پس گوشی در نشانی تازه اشتراک تازه‌ای می‌سازد و همهٔ تنظیم‌های اشتراک قدیم
-- (شناسه حزب‌خوانی، کدهای چله، تنظیم‌ها، اذان و اعلان‌های فرستاده‌شده) به آن منتقل می‌شود؛ بعد اشتراک قدیم دیگر نیست.
-- اجرا در Supabase SQL Editor پس از reminders.sql و azan.sql. اجرای دوباره بی‌خطر است.

-- p_old را فقط خود گوشی می‌داند (همان‌طور که push_unsubscribe). خروجی: اشتراک قدیم پیدا و منتقل شد؟
create or replace function public.push_move(p_old text, p_endpoint text, p_p256dh text, p_auth text) returns boolean
language plpgsql security definer set search_path = public as $$
declare o push_subscriptions;
begin
  perform public.push_check(p_endpoint, p_p256dh, p_auth);
  if p_old is null or p_old = p_endpoint then return false; end if;
  select * into o from push_subscriptions where endpoint = p_old;
  if not found then return false; end if;
  if not exists (select 1 from push_subscriptions where endpoint = p_endpoint) then
    -- push_sent و push_azan با on update cascade همراه endpoint جابه‌جا می‌شوند، پس هیچ اعلانی دو بار نمی‌رسد.
    update push_subscriptions set endpoint = p_endpoint, p256dh = p_p256dh, auth = p_auth where endpoint = p_old;
  else
    -- گوشی در نشانی تازه هم اعلان روشن کرده بود: هر دو یکی می‌شوند و انتخاب‌های نشانی تازه مقدم است.
    update push_subscriptions n set p256dh = p_p256dh, auth = p_auth,
      group_number = coalesce(n.group_number, o.group_number),
      participant_id = case when n.group_number is null then o.participant_id else n.participant_id end,
      chl_codes = (array(select distinct x from unnest(n.chl_codes || o.chl_codes) x))[1:40],
      reg_codes = (array(select distinct x from unnest(n.reg_codes || o.reg_codes) x))[1:40],
      prefs = case when n.prefs = '{}' then o.prefs else n.prefs end
     where n.endpoint = p_endpoint;
    update push_azan set endpoint = p_endpoint
     where endpoint = p_old and not exists (select 1 from push_azan where endpoint = p_endpoint);
    delete from push_subscriptions where endpoint = p_old;
  end if;
  return true;
end $$;

revoke all on function public.push_move(text, text, text, text) from public;
grant execute on function public.push_move(text, text, text, text) to anon, authenticated;
