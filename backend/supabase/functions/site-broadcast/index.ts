// پیام همگانی از خود پایگاه داده (pg_net)، مثلاً خبر یک بخش تازه سایت؛ همان کار «پیام همگانی» مدیر در daily-reminders،
// ولی با x-cron-secret به جای توکن ورود مدیر. Secrets همان daily-reminders: VAPID_PUBLIC_KEY، VAPID_PRIVATE_KEY، CRON_SECRET، SITE_URL (اختیاری).
// بدنه: { title, body, path? (مثل ?book=jadid)، audience? (all | hezb | chl) }. با JWT verification خاموش deploy شود.
// نمونه از SQL Editor:
//   select net.http_post(url := '<SUPABASE_URL>/functions/v1/site-broadcast', headers := '{"Content-Type":"application/json","x-cron-secret":"..."}'::jsonb,
//     body := '{"title":"...","body":"...","path":"?book=jadid"}'::jsonb, timeout_milliseconds := 120000);
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const env = (k: string) => Deno.env.get(k) || ''
const SITE_URL = (env('SITE_URL') || 'https://nooranquran.github.io').replace(/\/$/, '')
const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async req => {
  if (!env('CRON_SECRET') || req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'unauthorized' }, 401)
  const body = await req.json().catch(() => ({}))
  const title = String(body.title || '').trim().slice(0, 80), text = String(body.body || '').trim().slice(0, 500)
  if (!title || !text) return json({ error: 'empty' }, 400)
  const path = typeof body.path === 'string' && /^\?[\w=&%-]{1,120}$/.test(body.path) ? body.path : ''
  webpush.setVapidDetails('https://nooranquran.github.io', env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'))
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
  let q = db.from('push_subscriptions').select('endpoint,p256dh,auth')
  if (body.audience === 'hezb') q = q.not('group_number', 'is', null)
  if (body.audience === 'chl') q = q.neq('chl_codes', '{}')
  const { data: subs, error } = await q
  if (error) return json({ error: error.message }, 500)
  const msg = JSON.stringify({ title, body: text, url: `${SITE_URL}/${path}`, tag: 'broadcast:' + Date.now() })
  const stats = { slot: 'broadcast', sent: 0, removed: 0, failed: 0, devices: subs.length }
  const one = async (s: { endpoint: string; p256dh: string; auth: string }) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, msg, { TTL: 24 * 3600, urgency: 'high' }); stats.sent++ }
    catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) { stats.removed++; await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint) }
      else { stats.failed++; console.error('push failed', code, (e as Error).message) }
    }
  }
  for (let i = 0; i < subs.length; i += 25) await Promise.all(subs.slice(i, i + 25).map(one))
  await db.from('push_runs').insert({ slot: 'broadcast', stats: { ...stats, title } })
  return json(stats)
})
