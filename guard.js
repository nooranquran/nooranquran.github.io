// نگهبان نشانی رسمی. پیش از همه اسکریپت‌ها و بی‌defer اجرا می‌شود (index.html و 404.html).
// ۱) اگر سایت دیگری نوران را در قاب (iframe) بگذارد تا کاربر را فریب دهد و روی دکمه‌ها بزند (clickjacking)، صفحه خود را
//    از قاب بیرون می‌آورد یا پنهان می‌شود. GitHub Pages سرآیند X-Frame-Options نمی‌گذارد و CSP در meta هم frame-ancestors ندارد.
// ۲) اگر همین کد روی نشانی دیگری باز شود (کپی سایت)، نوار قرمزی نشان می‌دهد که این نشانی رسمی نیست.
//    کسی که سایت را عمداً جعل کند می‌تواند این فایل را بردارد؛ جلوی او را نگهبان پایگاه داده (origin-guard.sql) و آگاه بودن
//    کاربران می‌گیرد. این فایل جلوی کپی‌های بی‌دقت و آینه‌ها را می‌گیرد و به بازدیدکننده نشانی درست را می‌گوید.
(function () {
  var OFFICIAL = 'nooranquran.github.io';
  var framedByOther = false;
  try { framedByOther = window.top !== window.self && window.top.location.hostname !== location.hostname; } catch (e) { framedByOther = true; }
  if (framedByOther) {
    document.documentElement.style.display = 'none';
    try { window.top.location.replace(location.href); } catch (e) {}
    return;
  }
  var h = location.hostname;
  if (h === OFFICIAL || h === 'localhost' || h === '127.0.0.1' || h === '') return;
  window.NOORAN_UNOFFICIAL = true;
  function warn() {
    if (document.getElementById('nqUnofficial')) return;
    var b = document.createElement('div');
    b.id = 'nqUnofficial';
    b.setAttribute('role', 'alert');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#b00020;color:#fff;padding:10px 16px;font:15px/1.8 Vazirmatn,Tahoma,sans-serif;text-align:center;box-shadow:0 2px 10px #0008';
    b.innerHTML = '⚠️ این نشانی رسمی نوران نیست. نشانی رسمی فقط <a href="https://nooranquran.github.io/" style="color:#fff;font-weight:bold" dir="ltr">nooranquran.github.io</a> است. در این صفحه رمز، ایمیل یا اطلاعات خود را وارد نکنید.';
    document.body.appendChild(b);
    document.body.style.paddingTop = b.offsetHeight + 'px';
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', warn) : warn();
})();
