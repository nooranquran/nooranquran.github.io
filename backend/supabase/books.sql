-- متن کتاب‌هایی که اجازه نشرشان هنوز گرفته نشده (books.js: review و db). این متن‌ها در مخزن سایت نیستند تا پیش از اجازه منتشر نشوند.
-- هر ردیف یکی از فایل‌های همان قالب books/<کتاب>/... است: path = 'index' یا '<بخش>/<NNN>' (مثل f/003).
-- خواندن: فقط وقتی مدیر کتاب را برای همه روشن کرده (site_settings › books.shown[کتاب] = true)، یا خواننده خودش مدیر است.
create table if not exists public.book_texts (
  book text not null check (book ~ '^[a-z0-9]{2,20}$'),
  path text not null check (path ~ '^[a-z0-9/]{1,40}$'),
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (book, path)
);
alter table public.book_texts enable row level security;

create or replace function public.book_is_public(p_book text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (value -> 'shown' ->> p_book)::boolean from site_settings where key = 'books'), false)
$$;
grant execute on function public.book_is_public(text) to anon, authenticated;

drop policy if exists "read public books or admin" on public.book_texts;
create policy "read public books or admin" on public.book_texts for select to anon, authenticated
  using (public.book_is_public(book) or public.is_site_admin());
drop policy if exists "admin manages book texts" on public.book_texts;
create policy "admin manages book texts" on public.book_texts for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());
revoke all on public.book_texts from anon, authenticated;
grant select on public.book_texts to anon, authenticated;
grant insert, update, delete on public.book_texts to authenticated;
