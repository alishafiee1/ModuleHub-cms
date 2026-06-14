<div dir="rtl" style="text-align:right;">

# پروپزال — سفارشی‌سازی زندهٔ کارت (کد پویا + realtime)

> پوشهٔ change: `docs/change/card-live-customization/`  
> جزئیات فنی در [design.md](./design.md) — **چرا** و **چی** اینجاست.  
> **جدا از:** [folder-card-management](../folder-card-management/proposal.md) (مدیریت پوشه + HTML استاتیک بدون drag/resize).

---

## §۱ چرا این change جداست؟

در change قبلی کارت می‌تواند **ظاهر ثابت** داشته باشد — یک فایل HTML/CSS بدون اسکریپت، جای کارت روی بوم قفل است. ولی بعضی ماژول‌ها می‌خواهند روی کارت **عدد زنده**، **وضعیت**، یا **کل HTML پویا** نشان دهند — مثلاً «۳ کاربر آنلاین» هر چند ثانیه عوض شود، بدون رفرش کل صفحه.

اگر برای هر کارت یک پورت و یک polling جدا باز کنیم، با زیاد شدن کارت‌ها سرور و nginx قاطی می‌شود. پس یک **درگاه واحد** در CMS می‌خواهیم که با **شناسهٔ کارت (node id)** مسیردهی کند، HTML/داده را به کارت برساند و در مرورگر به‌روز کند.

---

## §۲ این کار برای کیه؟

**توسعه‌دهندهٔ ماژول** — یک endpoint یا handler در ماژولِ در حال اجرا می‌نویسد؛ CMS فقط پل است.

**ادمین** — روی بوم کارت را می‌چیند؛ نیازی به دانستن پورت داخلی هر ماژول ندارد.

**بازدیدکننده** — کارت‌های پویا را بدون رفرش صفحه می‌بیند؛ اگر ماژول خاموش باشد، fallback به حالت پیش‌فرض (آیکون + عنوان).

---

## §۳ چی می‌سازیم؟

### یک پورت (درگاه) برای همهٔ کارت‌ها

- CMS یک مسیر ثابت در همان سرور اصلی (مثلاً `/api/card-ui/...`) — **نه** پورت TCP جدید per-card.
- همهٔ ارتباط مرورگر ↔ CMS از همین درگاه است؛ CMS به ماژول‌های running در پشت صحنه وصل می‌شود.

### مسیریابی با شناسهٔ کارت

- هر کارت روی بوم یک `nodeId` دارد (مثلاً `mod-weather-01`).
- درخواست‌ها شکل می‌گیرند: `GET /api/card-ui/:nodeId/html` یا `GET /api/card-ui/:nodeId/data`.
- CMS از `site-layout.json` می‌فهمد این node به کدام `moduleId` و کدام `port` محلی وصل است.

### ارسال HTML به کارت

- ماژول می‌تواند تکه HTML (یا JSON با فیلد `html`) برگرداند.
- CMS آن را داخل **iframe sandbox** با `allow-scripts` (برخلاف قالب استاتیک) تزریق یا سرو می‌کند.
- مرورگر فقط به CMS درخواست می‌زند — مستقیم به پورت ماژول نمی‌رود (امنیت + CORS).

### به‌روزرسانی realtime داده

- مرورگر هر N ثانیه (یا SSE/WebSocket در فاز بعد) از `/api/card-ui/:nodeId/data` می‌خواند.
- CMS پاسخ ماژول را **کش** می‌کند (مثلاً ۳–۵ ثانیه) تا ۳۰ کارت همزمان سرور را نخوابانند.
- فقط کارت‌های **visible** در viewport poll می‌شوند.

---

## §۴ چی در این change نمی‌سازیم؟

مدیریت پوشه، توضیح کارت، چرخ‌دندهٔ پوشه → [folder-card-management](../folder-card-management/proposal.md).

قالب HTML **استاتیک** بدون اسکریپت و با قفل drag/resize → همان change.

چسباندن HTML آزاد در `site-layout.json` توسط ادمین — فقط از ماژولِ validated.

WebSocket سراسری برای کل سایت در فاز اول — polling + cache کافی است.

---

## §۵ چطور بفهمیم درست شده؟

ماژول demo با `cardPresentation.mode: live` روی بوم یک عدد را هر ۳ ثانیه عوض می‌کند — بدون F5.

با ۲۰ کارت live روی صفحه، درخواست‌های همزمان به ماژول از طریق CMS محدود و کش‌شده‌اند.

اگر ماژول stop شود، کارت به حالت default برمی‌گردد — بدون خطای قرمز برای بازدیدکننده.

`nodeId` اشتباه → 404 از CMS، نه crash بوم.

---

## §۶ سناریوی نمونه

ماژول «دماسنج» running است. روی کارت `node-thermo-1` هر ۵ ثانیه دما از `/api/card-ui/node-thermo-1/data` خوانده می‌شود. CMS از پورت محلی ماژول `GET /__modulehub/card-ui?cardId=node-thermo-1` می‌زند، JSON را کش می‌کند، به مرورگر می‌دهد. اسکریپت داخل iframe عدد را روی DOM به‌روز می‌کند.

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
