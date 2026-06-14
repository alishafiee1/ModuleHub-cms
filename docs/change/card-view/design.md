<div dir="rtl" style="text-align:right;">

# طراحی — card-view از ZIP تا کارت روی بوم

> **مسیر:** `docs/change/card-view/design.md`  
> **راهنمای سازنده:** [module-card-guide.md](./module-card-guide.md)

---

## این سند دربارهٔ چیه؟

از وقتی ZIP آپلود می‌شود تا وقتی بازدیدکننده روی بوم یک کارت سفارشی می‌بیند — **بدون** اینکه CMS وسط دادهٔ ماژول را جابه‌جا کند (برای static/spa).

---

## اصل مهم

کارت **بخشی از خود ماژول** است. CMS می‌گوید کدام فایل HTML را در چه ابعادی نشان بده. خواندن سنسور، زدن دکمه، cache مرورگر — **کار ماژول**.

---

## فایل کارت کجاست؟

سازنده در ZIP یکی از این‌ها را می‌گذارد:

- `card.html` در ریشه — ترجیح اول  
- یا `card/index.html` اگر پوشهٔ جدا خواست  

اگر هیچ‌کدام نبود، مثل الان آیکون و عنوان پیش‌فرض می‌آید.

نام استاندارد **`card.html`** است (نه `cart.html`).

بعد از پیاده‌سازی، CMS این را مثل بقیهٔ فایل‌های ماژول از مسیر `/modules/<moduleId>/...` لود می‌کند و داخل یک **iframe جدا** روی بوم می‌گذارد تا اگر HTML بد بود، کل سایت نخوابد.

---

## سه نوع ماژول — داستان کوتاه

### استاتیک

سارا فقط HTML و CSS می‌نویسد. شاید یک `fetch('./info.json')` برای یک عدد ثابت. شاید چیزی در IndexedDB کش کرده. **هیچ process و هیچ API سرور لازم نیست.** CMS فقط فایل را نشان می‌دهد.

### SPA

مثل استاتیک، ولی اپ اصلی `index.html` یا build است. `card.html` باید **سبک** بماند — نه کل React داخل کارت. اگر عدد زنده می‌خواهد و سرور ندارد، یا fetch به سرویس خارجی (با رعایت CORS) یا نوع ماژول را backend کند.

### بک‌اند (مثلاً IoT)

رضا سرور Node دارد. روی کارت می‌خواهد هر پنج ثانیه خلاصه بگیرد و با دکمه relay را بزند. داخل `card.html` یک اسکریپت ساده `fetch` می‌زند به **همان ماژول**:

```
GET  ./api/card/summary
POST ./api/card/action
```

مسیرها نسبت به `/modules/iot-hub/` هستند. احراز هویت همان session مرورگر است — نه توکن جدا از CMS.

اگر ماژول **stopped** باشد، CMS به‌جای iframe خراب، همان کارت پیش‌فرض (آیکون + عنوان) را نشان می‌دهد.

---

## اندازهٔ کارت

ادمین ماژول را نصب می‌کند، در صورت نیاز Start می‌زند، می‌رود «ویرایش چیدمان» و گوشهٔ کارت را می‌کشد. مقدار در `site-layout.json` ذخیره می‌شود — همان `cardGrid` امروز.

سازنده باید CSS را **انعطاف‌پذیر** بنویسد (`%`، `min-height`، فونت نسبی) چون ادمین ممکن است کارت را ۳×۳ یا ۶×۴ بگذارد.

---

## `module.json` — وقتی manifest بیاید

الان wizard هنوز کامل از [add manifest](../add%20manifest/design-module-json.md) پیروی نمی‌کند؛ ولی پیش‌بینی می‌کنیم بخشی به نام `cardView` داشته باشیم:

```json
"cardView": {
  "enabled": true,
  "template": "card.html",
  "mode": "static"
}
```

برای backend مقدار `mode` می‌تواند `module-api` باشد و مسیرهای summary/action را معرفی کند. جزئیات در راهنما آمده — اینجا فقط می‌گوییم CMS از همین جا بفهمد کارت سفارشی دارد یا نه.

ماژول **docker** وقتی بیاید ([docker-module](../docker-module/proposal.md))، همان قرارداد backend است — فقط process داخل کانتینر است.

---

## امنیت — خلاصه

HTML کارت را از تنظیمات سایت نمی‌چسبانی — فقط از ZIP. iframe جدا می‌کند. برای backend، `POST` باید در خود ماژول validate شود (نه هر actionی از هر جایی).

---

## فرق با پلن‌های قبلی

پلن معلق [archive](../../archive/1405-03-24-static-card-template-suspended/proposal.md) می‌خواست کارت را بعد از فعال‌سازی **قفل** کند. اینجا می‌گوییم ادمین می‌تواند اندازه را عوض کند.

`card-live-customization` هنوز از درگاه CMS برای داده حرف می‌زند — برای static/spa آن را **نمی‌خواهیم**؛ آن change باید فقط جایی بماند که واقعاً به proxy CMS نیاز است (اگر اصلاً بماند).

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>
