// رله Cloudflare برای وقتی که سرور Supabase از اینترنت ایران (بدون فیلترشکن) در دسترس نیست.
// هر درخواست /rest/v1، /auth/v1 و /functions/v1 را دست‌نخورده به Supabase می‌فرستد و جواب را برمی‌گرداند.
// سایت (config.js، SUPABASE_PROXY) اول مستقیم می‌رود و اگر نرسید از این رله.
// استقرار: npx wrangler deploy (wrangler.toml همین پوشه).
const TARGET = 'https://wnswskzgfaywpmjhdgnx.supabase.co';
const ORIGINS = ['https://nooranquran.github.io', 'https://hezbkhani.github.io'];

export default {
  async fetch(req) {
    const u = new URL(req.url), origin = req.headers.get('origin') || '';
    if (!/^\/(rest|auth|functions)\/v1\//.test(u.pathname)) return new Response('Nooran relay', { status: 404 });
    if (origin && !ORIGINS.includes(origin) && !/^http:\/\/localhost(:\d+)?$/.test(origin)) return new Response('Forbidden', { status: 403 });
    const h = new Headers(req.headers);
    ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-real-ip'].forEach(k => h.delete(k));
    // نشانی کاربر برای محدودیت تلاش (code_guard) نگه داشته می‌شود.
    h.set('x-forwarded-for', req.headers.get('cf-connecting-ip') || '');
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();
    return fetch(TARGET + u.pathname + u.search, { method: req.method, headers: h, body, redirect: 'manual' });
  }
};
