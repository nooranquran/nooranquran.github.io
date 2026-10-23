// اعلان‌های گوشی‌هایی که از نشانی قدیم (hezbkhani.github.io) آمده‌اند به همین نشانی منتقل می‌شود.
// صفحهٔ نشانی قدیم، اشتراک اعلان آن‌جا را در nqOldPush می‌فرستد. اجازهٔ اعلان برای هر نشانی جداست، پس این‌جا یک بار
// اجازه گرفته می‌شود (با یک لمس، چون مرورگرها بی‌لمس اجازه نمی‌پرسند) و push_move همهٔ تنظیم‌های اشتراک قدیم را
// به اشتراک تازه می‌برد؛ از آن پس اعلان‌ها با نام همین نشانی می‌رسد و نشانی قدیم دیگر اعلانی نمی‌فرستد.
(() => {
  const K = 'nqOldPush', LATER = 'nqMoveLater', cfg = window.APP_CONFIG;
  let old = null; try { old = localStorage.getItem(K); } catch {}
  if (!old || !cfg || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

  const rpc = (name, body) => fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(async r => { if (!r.ok) throw Error('rpc ' + r.status); const t = await r.text(); return t ? JSON.parse(t) : null; });
  const drop = () => { try { localStorage.removeItem(K); } catch {} };
  const b64 = s => { const r = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  async function newSub() {
    const r = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
    return await r.pushManager.getSubscription() || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.VAPID_PUBLIC_KEY) });
  }
  async function move(sub) {
    const k = sub.toJSON().keys;
    await rpc('push_move', { p_old: old, p_endpoint: sub.endpoint, p_p256dh: k.p256dh, p_auth: k.auth });
    drop();
  }

  function banner() {
    try { if (sessionStorage.getItem(LATER)) return; } catch {}
    const b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;z-index:9999;max-width:520px;margin:0 auto;background:#fffaf0;color:#2f2416;border:1px solid #006b50;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:14px 16px;font:15px/1.8 Vazirmatn,Tahoma,sans-serif;direction:rtl;text-align:right';
    b.innerHTML = '<div class="m">نشانی سایت عوض شده است. یادآوری‌های شما هنوز با نام نشانی قدیم می‌رسد؛ با یک لمس به نشانی تازه منتقل می‌شود و همهٔ تنظیم‌هایش می‌ماند.</div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="go" style="flex:1;min-width:150px;background:#006b50;color:#fff;border:0;border-radius:10px;padding:9px 14px;font:inherit;cursor:pointer">انتقال یادآوری‌ها</button>'
      + '<button class="later" style="background:transparent;color:#006b50;border:1px solid #006b50;border-radius:10px;padding:9px 14px;font:inherit;cursor:pointer">بعداً</button></div>';
    const msg = b.querySelector('.m'), btns = b.querySelector('.go').parentNode;
    const end = (text, ms) => { msg.textContent = text; btns.remove(); setTimeout(() => b.remove(), ms); };
    b.querySelector('.later').onclick = () => { try { sessionStorage.setItem(LATER, '1'); } catch {} b.remove(); };
    b.querySelector('.go').onclick = async () => {
      // روی آیفون، درخواست اجازه باید بی‌درنگ پس از لمس دکمه باشد.
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return end('اجازهٔ اعلان داده نشد؛ یادآوری‌ها مثل قبل با نام نشانی قدیم می‌رسد. هر وقت خواستید از تنظیم اعلان‌های مرورگر اجازه دهید.', 8000);
      btns.style.opacity = '.5'; btns.style.pointerEvents = 'none';
      try { await move(await newSub()); end('یادآوری‌ها منتقل شد ✓ از این پس با نام نشانی تازه می‌رسد.', 5000); }
      catch { end('انتقال انجام نشد؛ یادآوری‌ها مثل قبل می‌رسد. بار بعد که سایت را باز کنید دوباره امتحان می‌شود.', 8000); }
    };
    document.body.appendChild(b);
  }

  addEventListener('load', async () => {
    try {
      // اگر اشتراک قدیم دیگر در سرور نیست (قبلاً منتقل یا لغو شده)، کاری نمانده است.
      const st = await rpc('push_status', { p_endpoint: old });
      if (!st || !st.length) return drop();
      const r = await navigator.serviceWorker.getRegistration();
      const sub = r && await r.pushManager.getSubscription();
      if (sub) return await move(sub);
      if (Notification.permission === 'granted') return await move(await newSub());
      if (Notification.permission === 'default') banner();
    } catch {}
  });
})();
