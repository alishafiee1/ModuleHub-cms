<div dir="rtl" style="text-align:right;">

# معلق — قالب HTML استاتیک روی کارت

> **مسیر:** `docs/archive/1405-03-24-static-card-template-suspended/`  
> **تاریخ معلق:** ۱۴۰۵/۰۳/۲۴ (2026-06-14)  
> **چرا معلق شد:** به‌جای پیاده‌سازی iframe + `card.html` ثابت، می‌خواهیم **روش یکپارچهٔ جدید** برای تکمیل دیزاین کارت‌ها در [card-live-customization](../../change/card-live-customization/proposal.md) طراحی کنیم.  
> **مرجع اصلی change:** [1405-03-24-folder-card-management](../../change/1405-03-24-folder-card-management/proposal.md) (فاز ۱–۳ ✅)

---

## چی بود؟

سازندهٔ ماژول یک فایل `assets/card.html` (فقط HTML/CSS) داخل ZIP می‌گذاشت؛ CMS آن را داخل iframe روی کارت نشان می‌داد. جای و اندازهٔ کارت یک‌بار تنظیم می‌شد و بعد **قفل** می‌ماند (`layoutLocked`).

## چرا کنار گذاشته شد؟

- دو مسیر جدا (مارک‌داون توضیح + HTML استاتیک + بعداً live) برای کاربر و توسعه‌دهنده گیج‌کننده بود.
- می‌خواهیم یک **روش واحد** برای «کارت کامل‌تر از آیکون+عنوان» داشته باشیم — احتمالاً ترکیب قالب، دادهٔ زنده، و تنظیم از داخل ماژول.
- پیاده‌سازی در کد انجام نشد؛ طراحی اولیه در [design.md](../../change/1405-03-24-folder-card-management/design.md) §۷ و [behavior.md](./behavior.md) باقی مانده.

## جایگزین

[card-live-customization](../../change/card-live-customization/proposal.md) — فازهای جدید برای تکمیل دیزاین کارت (نه کپی مستقیم این پلن).

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>
