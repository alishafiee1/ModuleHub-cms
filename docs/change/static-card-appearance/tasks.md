<div dir="rtl" style="text-align:right;">

# تسک‌ها — ظاهر سفارشی ثابت کارت

> **مسیر:** `docs/change/static-card-appearance/tasks.md`  
> **یک خط:** قدم‌های ساخت قالب بصری ادمین، پاک‌سازی سرور، رندر امن روی بوم و تست — طبق [design.md](./design.md).  
> **چرا:** [proposal.md](./proposal.md)

---

## فازبندی کلی

**فاز ۱** مدل داده و پاک‌سازی سرور — پایهٔ بقیه.  
**فاز ۲** رندر روی بوم برای بازدیدکننده.  
**فاز ۳** ویرایشگر و پیش‌نمایش برای ادمین.  
**فاز ۴** تست، مستندات رفتار UI، هم‌خوانی با changeهای مرتبط.

فاز ۲ می‌تواند با mock داده شروع شود؛ تست نهایی E2E بعد از فاز ۳.

---

## فاز ۱ — داده و پاک‌سازی سرور

> **ریسک این فاز:** اگر پاک‌سازی ضعیف باشد، قالب مخرب به layout ذخیره می‌شود.

- [ ] ۱.۱ فیلدهای `cardDisplayMode` و `cardCustomTemplate` روی node چیدمان (طبق design)
- [ ] ۱.۲ سرویس پاک‌سازی قالب: حذف script/iframe/event handler و لیست سفید تگ‌ها
- [ ] ۱.۳ اعتبارسنجی سقف حجم قالب و رد ذخیره اگر بعد از پاک‌سازی خالی شد
- [ ] ۱.۴ resolve جای‌نگهدارها (`{{title}}`, `{{thumbnail}}`, …) در لایهٔ سرور یا مشترک
- [ ] ۱.۵ PATCH ادمین برای ذخیرهٔ روش نمایش + قالب — فقط Super Admin
- [ ] ۱.۶ تست خودکار: قالب حاوی `script` → رد یا strip و خالی → خطا
- [ ] ۱.۷ تست خودکار: توکن `{{thumbnail}}` وقتی تصویر نیست → placeholder بدون crash
- [ ] ۱.۸ **تموم شدن فاز:** تست‌های unit پاک‌سازی و PATCH سبز

---

## فاز ۲ — رندر روی بوم

> **ریسک این فاز:** رندر ناامن `innerHTML` روی کل صفحه — باید محفظهٔ ایزوله باشد.

- [ ] ۲.۱ در ساخت کارت: اگر `custom-static` → ظرف قالب به‌جای آیکون+مارک‌داون
- [ ] ۲.۲ رندر با جای‌نگهدارهای resolve‌شده داخل Shadow DOM یا scope امن
- [ ] ۲.۳ fallback: قالب نامعتبر یا mode ناشناس → نمایش پیش‌فرض + لاگ
- [ ] ۲.۴ حفظ رفتار کلیک پوشه/ماژول و چرخ‌دنده روی لایهٔ بیرونی
- [ ] ۲.۵ تست خودکار: کارت با قالب معتبر → HTML expected در ظرف ایزوله
- [ ] ۲.۶ **تموم شدن فاز:** کارت نمونه روی بوم با قالب ثابت بدون خطای کنسول

---

## فاز ۳ — ویرایشگر ادمین

> **ریسک این فاز:** ادمین پیش‌نمایش را ببیند ولی بوم متفاوت باشد — باید همان مسیر رندر باشد.

- [ ] ۳.۱ دیالوگ یا بخش در منوی چرخ‌دنده: سوییچ `default` / `custom-static`
- [ ] ۳.۲ ویرایشگر متن قالب + پیش‌نمایش زنده (همان resolve و sanitize)
- [ ] ۳.۳ مخفی شدن ویرایشگر مارک‌داون وقتی custom-static فعال است
- [ ] ۳.۴ راهنمای کوتاه توکن‌های مجاز (`{{title}}`, `{{thumbnail}}`, …) در UI
- [ ] ۳.۵ toast موفق/خطا بعد از ذخیره؛ به‌روزرسانی کارت روی بوم
- [ ] ۳.۶ پشتیبانی پوشه و ماژول (همان API با تفاوت توکن‌های موجود)
- [ ] ۳.۷ **تموم شدن فاز:** ادمین دستی یک قالب ذخیره و روی بوم می‌بیند

---

## فاز ۴ — تست E2E و مستندات

- [ ] ۴.۱ E2E **SCA-01:** ادمین سوییچ به custom-static → قالب با عنوان → ذخیره → مهمان همان را می‌بیند
- [ ] ۴.۲ E2E **SCA-02:** برگشت به default → مارک‌داون دوباره نمایش
- [ ] ۴.۳ E2E **SCA-03:** قالب مخرب (`script`) → ذخیره رد و پیام خطا
- [ ] ۴.۴ به‌روزرسانی `docs/UI-behavior.md` — بخش ظاهر سفارشی کارت
- [ ] ۴.۵ لینک از `docs/change/card-live-customization/proposal.md` به این change (مرز ثابت vs پویا)
- [ ] ۴.۶ `npm test` سبز
- [ ] ۴.۷ **تموم شدن change:** همهٔ تیک‌ها + E2E سه‌گانه

---

## پس از اتمام

- [ ] خط در `docs/tasks.md` اصلی
- [ ] `/sync-docs` → `1405-XX-XX-static-card-appearance`
- [ ] در صورت نیاز OpenSpec جداگانه از روی همین docs

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
