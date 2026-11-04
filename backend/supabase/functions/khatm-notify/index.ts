// اعلان‌های ختم قرآن موازی (pkhatm.js و backend/supabase/parallel-khatm.sql): Supabase Cron هر ۱۵ دقیقه با x-cron-secret صدا می‌زند.
// چه بفرستد را pk_push_due در پایگاه داده حساب می‌کند: یادآوری شب آخر مهلت هر بخش، و روزی یک بار «بخش‌های باز مانده» از ساعت ۱۰.
// هر اعلان یک بار (جدول pk_push_sent). Secrets همان daily-reminders: VAPID_PUBLIC_KEY، VAPID_PRIVATE_KEY، CRON_SECRET، SITE_URL (اختیاری).
// با JWT verification خاموش deploy شود.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const env = (k: string) => Deno.env.get(k) || ''
const SITE_URL = (env('SITE_URL') || 'https://nooranquran.github.io').replace(/\/$/, '')
const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'Content-Type': 'application/json' } })
type Row = { endpoint: string; p256dh: string; auth: string; key: string; title: string; body: string; url: string }

Deno.serve(async req => {
  if (!env('CRON_SECRET') || req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'unauthorized' }, 401)
  webpush.setVapidDetails('https://nooranquran.github.io', env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'))
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
  const { data, error } = await db.rpc('pk_push_due')
  if (error) return json({ error: error.message }, 500)
  const rows = (data || []) as Row[]
  const stats = { slot: 'pk', sent: 0, removed: 0, failed: 0 }
  const one = async (r: Row) => {
    // اول ثبت، تا دو اجرای هم‌زمان دو بار نفرستند؛ اگر نرسید (جز اشتراک منقضی)، برداشته می‌شود تا اجرای بعد بفرستد.
    const { data: ins } = await db.from('pk_push_sent').upsert({ endpoint: r.endpoint, key: r.key }, { onConflict: 'endpoint,key', ignoreDuplicates: true }).select('key')
    if (!ins?.length) return
    const msg = JSON.stringify({ title: r.title, body: r.body, url: `${SITE_URL}/${r.url}`, tag: 'pk:' + r.key })
    try { await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, msg, { TTL: 6 * 3600, urgency: 'high' }); stats.sent++ }
    catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) { stats.removed++; await db.rpc('pk_push_off', { p_endpoint: r.endpoint }) }
      else { stats.failed++; console.error('push failed', code, (e as Error).message); await db.from('pk_push_sent').delete().eq('endpoint', r.endpoint).eq('key', r.key) }
    }
  }
  for (let i = 0; i < rows.length; i += 25) await Promise.all(rows.slice(i, i + 25).map(one))
  if (stats.sent || stats.failed || stats.removed) await db.from('push_runs').insert({ slot: 'pk', stats })
  if (Math.random() < 0.02) await db.rpc('pk_push_cleanup')
  return json(stats)
})
