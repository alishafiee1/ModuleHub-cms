<div dir="rtl" style="text-align:right;">

# پروپزال — یک راه مشخص برای به‌روز کردن کد روی سرور

> **مسیر:** `docs/change/server-code-update-standard/proposal.md`  
> **مرتبط:** استاندارد اسکریپت‌ها · وضعیت شبکهٔ سرور (اینترنت آزاد پیش‌فرض)

---

## §۱ درد

کد را روی لپ‌تاپ عوض می‌کنی، ولی سایت روی سرور خانه همان نسخهٔ قدیمی می‌ماند. گاهی مستقیم روی سرور دست می‌زنی — بعد نمی‌دانی کدام نسخه «درست» است. موقع به‌روزرسانی، سیستم از تو نام کاربری و رمز می‌خواهد و وسط کار می‌ایستد. چند روش مختلف (کپی دستی، اسکریپت قدیمی، دستور پراکنده) باعث می‌شود هر بار مثل اولین بار استرس داشته باشی.

---

## §۲ برای کی؟

**خودت** — کسی که هم روی ویندوز کد می‌زند هم روی سرور لینوکس سایت را زنده نگه می‌دارد. نه کاربر سایت، نه مهمان.

---

## §۳ چی می‌سازیم؟

- **یک داستان ثابت:** تغییر فقط روی کامپیوتر خودت → فرستادن به مخزن مشترک → یک دستور روی سرور → چک سلامت
- **ورود یک‌بار به مخزن** روی سرور — بعدش به‌روزرسانی روزمره بدون سؤال رمز
- **هم‌خوان کردن راهنماها** با واقعیت امروز سرور (اینترنت آزاد از قبل روشن است؛ دیگر نیازی به ترفندهای قدیمی شبکه برای هر بار کشیدن کد نیست)
- **یک منوی کوتاه** در داک: «اولین بار چه کار کن / هر بار بعد از تغییر چه کار کن»

---

## §۴ چی نمی‌سازیم؟

- قابلیت جدید برای بازدیدکنندهٔ سایت
- چند مسیر موازی که هر کدام ادعای «درست‌ترین» داشته باشند
- نگه‌داشتن اسکریپت‌های خطرناک که روی سرور فایل‌ها را خودسرانه برمی‌گردانند

---

## §۵ اگر موفق شود

بعد از هر تغییر مهم، با خیال راحت می‌دانی: کد سرور همان چیزی است که از کامپیوترت فرستادی؛ سایت بالا می‌آید؛ اگر چیزی خراب شد، می‌دانی کجا را نگاه کنی — نه ده جای مختلف.

---

## §۶ ریسک

اگر ورود یک‌بار به مخزن را راه نیندازی، هر deploy دوباره گیر می‌کند. اگر هنوز روی سرور ویرایش کنی، نسخه‌ها دوباره قاطی می‌شوند.

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
