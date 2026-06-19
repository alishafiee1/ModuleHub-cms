<div dir="rtl" style="text-align:right;">

# راهنمای ساخت کارت — برای سازندهٔ ماژول

> بعداً به skill `new-module-rolls/Card-view` تبدیل می‌شود.  
> چرا این کار را می‌کنیم: [proposal.md](./proposal.md) · CMS چه می‌کند: [design.md](./design.md)

---

## قبل از هر چیز — یک تصویر ساده

صفحهٔ اصلی ModuleHub مثل یک دیوار از کارت است. **کارت** اولین چیزی است که دیده می‌شود. **داخل ماژول** (`index.html` یا اپ کامل) جایی است که کار اصلی انجام می‌شود.

اگر `card.html` بگذاری، CMS همان را روی دیوار نشان می‌دهد. اگر نگذاری، فقط آیکون و اسم می‌آید.

**مهم:** CMS فقط قاب را می‌آویزد. **تو** تصمیم می‌گیری داخل قاب چه باشد و داده چطور بیاید — ثابت، هر چند ثانیه refresh، WebSocket، یا هر روش دیگر.

---

## داستان اول — سارا و سایت استاتیک

سارا طراح است. ZIP ساده دارد: `index.html` برای نمونه‌کارها و یک `card.html` برای جلوی سایت.

`card.html` شاید فقط پس‌زمینهٔ آبی، عنوان «نمونه‌کارها»، یک خط توضیح باشد. **هیچ JavaScript لازم نیست.**

بعد از آپلود، ادمین روی بوم کارت را می‌بیند، می‌رود «ویرایش چیدمان» و کارت را کمی بزرگ‌تر می‌کند. بازدیدکننده کلیک می‌کند → می‌رود `/modules/sara-portfolio/` → همان `index.html` کامل.

اگر سارا بخواهد یک عدد از فایل JSON نشان دهد:

```javascript
fetch('./stats.json').then(r => r.json()).then(d => {
  document.getElementById('count').textContent = d.projects;
});
```

این کار **خود ماژول** است. CMS وسطش نیست.

---

## داستان دوم — علی و SPA بدون سرور

علی React build کرده. `index.html` همان اپ است. برای کارت یک `card.html` **سبک** جدا می‌سازد تا کل bundle روی بوم لود نشود.

اگر علی بخواهد روی کارت چیزی «زنده» ببیند:

- بدون backend خودش → API بیرونی (با رعایت CORS)  
- یا نوع ماژول را backend کند و سرور کوچک بگذارد  

باز هم **روش ارتباط با داده انتخاب علی است** — CMS تفاوتی قائل نمی‌شود.

---

## داستان سوم — رضا، IoT و دادهٔ زنده

رضا ماژول IoT دارد: دستگاه‌ها را جمع می‌کند، روشن و خاموش می‌کند. می‌خواهد روی کارت خانه ببیند چند دستگاه آنلاین است، یک هشدار هست یا نه، و یک دکمه «برق اصلی».

در ZIP دارد:

- سرور (مثلاً Node) — طبق سیاست پروژه اغلب داخل **داکر** اجرا می‌شود ([docker-module](../docker-module/proposal.md))  
- `index.html` — داشبورد کامل  
- `card.html` — خلاصه + دکمه  

### سیاست ارسال و دریافت — مال خودت است

CMS برایت تعیین نمی‌کند حتماً polling بزنی یا WebSocket. هر دو و بیشتر مجازند، تا زمانی که از **همان ماژول running** سرویس بگیری — آدرس‌های نسبی زیر `/modules/<moduleId>/`.

**مثال ساده — polling (برای شروع راحت است):**

```javascript
async function refresh() {
  const d = await fetch('./api/card/summary').then(r => r.json());
  document.getElementById('online').textContent = d.devicesOnline;
}
setInterval(refresh, 5000);
refresh();
```

**مثال — WebSocket (برای IoT اغلب بهتر است):**

```javascript
const ws = new WebSocket(
  (location.protocol === 'https:' ? 'wss:' : 'ws:') +
  '//' + location.host + location.pathname.replace(/card\.html.*/, '') +
  'api/card/ws'
);
ws.onmessage = (e) => {
  const d = JSON.parse(e.data);
  document.getElementById('online').textContent = d.devicesOnline;
};
```

**دکمه و فرمان** — خودت endpoint می‌سازی (`POST`، پیام WebSocket، …) و خودت validate می‌کنی. مثال با POST:

```javascript
await fetch('./api/card/action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'toggle-main-power' })
});
```

همهٔ این‌ها **داخل همان process ماژول** است. اگر ماژول باگ داشته باشد یا زیاد منابع بخورد، هدف این است که **سرور اصلی CMS** آسیب نبیند — برای همین backend در داکر و کارت فقط از طریق iframe به ماژول وصل است.

وقتی ادمین ماژول را **Stop** کند، CMS دیگر iframe خالی نشان نمی‌دهد — برمی‌گردد به کارت پیش‌فرض با آیکون.

ادمین بعد از Start اندازهٔ کارت را روی بوم تنظیم می‌کند — مثلاً عریض‌تر تا دکمه و عدد کنار هم جا شوند.

---

## چک‌لیست قبل از ZIP

- `card.html` یا `card/index.html` داری؟  
- در اندازهٔ کوچک و بزرگ خواناست؟  
- برای static/spa از CMS چیزی برای «دادهٔ زنده» نمی‌خواهی؟  
- برای backend، روش داده (polling / WebSocket / …) را **خودت** تست کردی وقتی ماژول running است؟  
- secret داخل ZIP نیست؟  
- برای IoT داکر: ماژول طبق [docker-module](../docker-module/proposal.md) قابل نصب و Start است؟  

---

## اشتباهاتی که دیدیم

خیلی‌ها فکر می‌کنند HTML کارت را باید در پنل ModuleHub بچسبانند — **نه**، فقط داخل ZIP.

بعضی‌ها دنبال `/api/card-ui` در CMS می‌گردند — آن درگاه مرکزی برای این مدل نیست؛ دادهٔ کارت از **API خود ماژول** زیر `/modules/<id>/` می‌آید.

فکر نکن CMS اجازه نمی‌دهد WebSocket بزنی — اگر سرور ماژول WebSocket دارد، `card.html` می‌تواند وصل شود.

نام فایل را `cart.html` نگذار — **`card.html`**.

---

## قدم بعدی تیم CMS

وقتی در کد پیاده شد، اگر `card.html` در ZIP باشد، CMS iframe می‌سازد. تا آن موقع این راهنما قرارداد توافقی بین سازنده و پروژه است.

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>
