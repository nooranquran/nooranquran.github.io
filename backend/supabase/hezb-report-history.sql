-- تقویم «سهم روزها» در حزب‌خوانی (hezb-days.js): روزهایی که یک شناسه گزارش ثبت کرده، تا حدود یک سال گذشته.
-- همان دسترسی hezb_reported_days (update-day-start-azan.sql) است، فقط بازه‌اش بلندتر: هر کس گروه و شناسه را بداند فقط تاریخ‌ها را می‌بیند، نه چیز دیگری.
-- یک بار در Supabase › SQL Editor اجرا کنید. تا اجرا نشده، سایت همان «هفته اخیر» را نشان می‌دهد و روزهای قدیمی‌تر «نامعلوم» هستند.
create or replace function public.hezb_report_history(p_group integer, p_participant integer) returns date[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(report_date order by report_date), '{}')
    from daily_reports
   where group_number = p_group and participant_id = p_participant
     and report_date between public.reading_day() - 400 and public.reading_day()
$$;
revoke all on function public.hezb_report_history(integer, integer) from public;
grant execute on function public.hezb_report_history(integer, integer) to anon, authenticated;
