<div dir="rtl" style="text-align:right;">

# راهنمای ساخت ماژول — card-view

> این متن را بعداً به skill `new-module-rolls/Card-view` تبدیل می‌کنیم.  
> فنی: [design.md](./design.md)

---

## قبل از هر چیز

وقتی ZIP ماژول را می‌سازی، فکر کن صفحهٔ اصلی ModuleHub یک دیوار از کارت است. **کارت** همان جایی است که اول نگاه می‌کنند. **داخل ماژول** (`index.html` یا اپ کامل) جایی است که کار اصلی انجام می‌شود.

اگر `card.html` بگذاری، CMS همان را روی دیوار نشان می‌دهد. اگر نگذاری، فقط آیکون و اسم می‌آید.

---

## داستان اول — سارا و سایت استاتیک

سارا طراح است. یک ZIP ساده دارد: `index.html` برای نمونه‌کارها و یک `card.html` برای جلوی سایت.

`card.html` شاید فقط این باشد: پس‌زمینهٔ آبی، عنوان «نمونه‌کارها»، یک خط توضیح. **هیچ JavaScript لازم نیست.**

بعد از آپلود، ادمین روی بوم کارت را می‌بیند. می‌رود «ویرایش چیدمان» و کارت را کمی بزرگ‌تر می‌کند تا متن راحت خوانده شود. بازدیدکننده کلیک می‌کند → می‌رود `/modules/sara-portfolio/` → همان `index.html` کامل.

اگر سارا بخواهد یک عدد از فایل JSON نشان دهد، داخل `card.html` می‌نویسد:

```javascript
fetch('./stats.json').then(r => r.json()).then(d => { ... });
```

این **کار خود ماژول** است. CMS وسطش نیست.

---

## داستان دوم — SPA بدون سرور جدا

علی یک React build کرده. `index.html` همان اپ است. برای کارت یک `card.html` جدا می‌سازد — سبک و سبک — تا کل bundle روی بوم لود نشود.

اگر علی بخواهد روی کارت «زنده» چیزی ببیند بدون backend، یا باید به API بیرونی وصل شود (و CORS را درست کند) یا نوع ماژول را عوض کند و یک سرور کوچک backend بگذارد.

---

## داستان سوم — رضا و IoT

رضا سرور Node دارد که با دستگاه‌ها حرف می‌زند. می‌خواهد روی کارت خانه ببیند: چند دستگاه آنلاین است، یک هشدار هست یا نه، و یک دکمه «برق اصلی».

در ZIP دارد:

- `package.json` و سرور  
- `index.html` — داشبورد کامل  
- `card.html` — خلاصه + دکمه  

در سرور دو route می‌گذارد:

- `GET /api/card/summary` → JSON مثل `{ devicesOnline: 12, alerts: 1, mainPower: "on" }`  
- `POST /api/card/action` → بدنه مثل `{ action: "toggle-main-power" }`  

داخل `card.html` با `fetch` همان آدرس‌های نسبی را صدا می‌زند و هر چند ثانیه refresh می‌کند. **همه‌چیز داخل همان ماژول running** است.

وقتی ادمین ماژول را Stop کند، CMS دیگر iframe خالی نشان نمی‌دهد — برمی‌گردد به کارت پیش‌فرض با آیکون.

ادمین بعد از Start اندازهٔ کارت را روی بوم تنظیم می‌کند — مثلاً عریض‌تر تا دکمه و عدد کنار هم جا شوند.

---

## چک‌لیست قبل از ZIP

- `card.html` یا `card/index.html` داری؟  
- در اندازهٔ کوچک و بزرگ خواناست؟  
- برای static/spa به CMS polling نیاز نداری؟  
- برای backend، summary و action را تست کردی وقتی ماژول running است؟  
- secret داخل ZIP نیست؟  

---

## اشتباهاتی که دیدیم

خیلی‌ها فکر می‌کنند HTML کارت را باید در پنل ModuleHub بچسبانند — **نه**، فقط داخل ZIP.

 بعضی‌ها دنبال `/api/card-ui` در CMS می‌گردند — برای static لازم نیست؛ برای IoT همان API خودت زیر `/modules/<id>/` است.

نام فایل را `cart.html` نگذار — **`card.html`**.

---

## قدم بعدی تیم CMS

وقتی در کد پیاده شد، `modulehub-card-store.js` اگر `card.html` دید، iframe می‌سازد. تا آن موقع این راهنما قرارداد توافقی بین سازنده و پروژه است.

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>
