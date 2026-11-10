-- گزارش «پیگیری اعضا» در مدیریت (admin-activity.js): برای هر گروه و هر شناسه، تعداد روزهای گزارش‌شده و آخرین روز گزارش در یک بازه.
-- فقط مدیران سایت (is_site_admin) جواب می‌گیرند. یک بار در Supabase › SQL Editor اجرا کنید.
create or replace function public.admin_report_counts(p_from date, p_to date)
returns table (group_number integer, participant_id integer, days integer, last_day date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_site_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if p_to - p_from > 400 then raise exception 'range' ; end if;
  return query
    select r.group_number, r.participant_id, count(*)::integer, max(r.report_date)
      from daily_reports r
     where r.report_date between p_from and p_to
     group by r.group_number, r.participant_id;
end $$;
revoke all on function public.admin_report_counts(date, date) from public, anon;
grant execute on function public.admin_report_counts(date, date) to authenticated;
