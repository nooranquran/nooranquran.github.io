// نسخه ثابت فهرست چله‌ها و دوره‌ها (chelleh/live.json) را از Supabase می‌سازد تا وقتی سرور از ایران در دسترس نیست،
// منو و برگه ثبت‌نام چله از خود سایت (گیت‌هاب) نشان داده شود (chelleh.js، loadLive). هر ساعت با .github/workflows/chelleh-live.yml اجرا می‌شود.
// فقط داده‌های عمومی که سایت با کلید عمومی می‌خواند؛ هیچ نام یا کد عضوی در آن نیست.
// اگر فقط شمار ثبت‌نامی‌ها عوض شده باشد، فایل تا ۶ ساعت دست نمی‌خورد تا تاریخچه مخزن پر از تغییرهای کوچک نشود.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../config.js', import.meta.url), 'utf8');
const URL_ = src.match(/SUPABASE_URL:\s*'([^']+)'/)[1], KEY = src.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/)[1];
const OUT = new URL('../chelleh/live.json', import.meta.url);
const rpc = async (fn, body = {}) => {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw Error(`${fn}: ${r.status} ${await r.text()}`);
  return (await r.json()) || [];
};
// «امروز» از سرور است و در نسخه ثابت نمی‌ماند (سایت خودش حساب می‌کند).
const clean = a => a.map(({ today, ...x }) => x);

const types = clean(await rpc('chl_types'));
if (!types.length) throw Error('chl_types returned nothing; keeping the old file');
const hezb_rounds = types.some(t => t.kind === 'hezb') ? clean(await rpc('reg_rounds')) : [];
const type_rounds = {};
for (const t of types) if (t.kind !== 'hezb' && (t.start_mode !== 'self' || t.round_id)) type_rounds[t.key] = clean(await rpc('chl_type_rounds', { p_type: t.key }));
const data = { types, hezb_rounds, type_rounds };

const VOLATILE = new Set(['waiting', 'active', 'reserved', 'members']);
const shape = d => JSON.stringify(d, (k, v) => (VOLATILE.has(k) ? undefined : v));
let old = null; try { old = JSON.parse(readFileSync(OUT, 'utf8')); } catch {}
const same = old && JSON.stringify({ types: old.types, hezb_rounds: old.hezb_rounds, type_rounds: old.type_rounds }) === JSON.stringify(data);
const fresh = old && Date.now() - Date.parse(old.generated_at) < 6 * 3600e3;
if (same || (old && fresh && shape({ types: old.types, hezb_rounds: old.hezb_rounds, type_rounds: old.type_rounds }) === shape(data))) { console.log('unchanged'); process.exit(0); }
writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), ...data }) + '\n');
console.log('written', types.length, 'types');
