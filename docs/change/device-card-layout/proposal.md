<div dir="rtl" style="text-align:right;">

# پروپزال — چیدمان جداگانهٔ کارت برای موبایل، تبلت و PC

> **مسیر:** `docs/change/device-card-layout/proposal.md`  
> **مرتبط:** [UI-behavior.md](../../UI-behavior.md) §۱.۱ · بوم cardGrid فعلی  
> **راهنما:** `AI learning docs/00-start-new-project/how-to-manage-change-folders.md`

---

## §۱ چرا این کار؟

الان ادمین فقط **یک چیدمان** روی بوم ۳۰×۹ دارد. وقتی کاربر سایت را روی موبایل یا تبلت باز می‌کند، همان `cardGrid` دسکتاپ با سلول‌های کوچک‌تر نمایش داده می‌شود — کارت‌ها عملاً **جمع می‌شوند** و چیدمان طراحی‌شده از بین می‌رود.

ادمین می‌خواهد برای هر دستگاه **طراحی مستقل** داشته باشد: روی PC یک چیدمان، روی تبلت دیگری، روی موبایل سومی — بدون اینکه با تغییر اندازهٔ پنجره، اندازهٔ واقعی کارت‌ها «کش بیاید».

---

## §۲ کاربران

| نقش | نیاز |
|-----|------|
| **Super Admin** | در حالت ویرایش، بین PC / تبلت / موبایل جابه‌جا شود، چیدمان هر کدام را جدا بکشد و ذخیره کند |
| **بازدیدکننده** | با باز کردن سایت روی هر دستگاه، چیدمان همان breakpoint را ببیند — ثابت و خوانا |
| **فاز اول** | فقط Super Admin ویرایش می‌کند؛ بازدیدکننده فقط نتیجه را می‌بیند |

---

## §۳ چی می‌سازیم؟

- **سه دکمهٔ دستگاه** در نوار ابزار مدیریت کارت (کنار «ویرایش») — فقط وقتی حالت ویرایش فعال است
- **سه چیدمان مستقل** برای هر `LayoutTreeNode`: دسکتاپ (پیش‌فرض)، تبلت، موبایل
- **انتخاب خودکار breakpoint** هنگام نمایش: بر اساس عرض viewport واقعی مرورگر
- **پیش‌فرض PC:** `cardGrid` فعلی = چیدمان دسکتاپ؛ سازگاری با JSONهای قدیمی حفظ می‌شود
- **بدون resize روان:** تغییر عرض پنجره فقط breakpoint را عوض می‌کند؛ کارت‌ها به چیدمان ذخیره‌شدهٔ همان دستگاه می‌پرند، نه scale تدریجی
- **تولید هوشمند یک‌بار:** اگر چیدمان تبلت/موبایل ست نشده باشد، سیستم از چیدمان بزرگ‌تر مشتق می‌کند، جا نمی‌گیردها را بهینه می‌چیند، **ذخیره می‌کند** — دفعهٔ بعد بدون اجرای مجدد
- **ذخیره در `site-layout.json`** — همان روال PATCH فعلی، با فیلدهای breakpoint

---

## §۴ چی نمی‌سازیم؟

- breakpointهای سفارشی توسط ادمین (فقط سه سطح ثابت)
- پیش‌نمایش همزمان چند دستگاه کنار هم (split view)
- چرخش landscape/portrait جداگانه
- ویرایش چیدمان برای Module Manager (فقط Super Admin)
- تغییر در `cardBackground` بر اساس دستگاه — پس‌زمینهٔ کارت مشترک می‌ماند

---

## §۵ معیار موفقیت

1. ادمین روی PC چیدمان می‌سازد، به موبایل سوییچ می‌کند، چیدمان متفاوتی می‌کشد و ذخیره می‌کند.
2. بازدیدکننده با عرض &lt; ۶۴۱px چیدمان موبایل را می‌بیند — کارت‌ها همان اندازهٔ طراحی‌شدهٔ موبایل، نه نسخهٔ کوچک‌شدهٔ دسکتاپ.
3. سایت با JSON قدیمی (فقط `cardGrid`) بدون خطا بالا می‌آید؛ موبایل/تبلت در اولین بار از دسکتاپ مشتق و ذخیره می‌شوند.
4. تغییر اندازهٔ پنجره بین breakpointها — کارت‌ها **نه** resize تدریجی دارند **بله** layout عوض می‌شود.

---

## §۶ ریسک

| ریسک | شدت | توضیح |
|------|-----|--------|
| JSON شلوغ یا ناسازگار | متوسط | سه فیلد grid روی هر node — migrate و validation دقیق لازم است |
| الگوریتم مشتق‌سازی بد چیدمان بسازد | بالا | ادمین باید بتواند بعداً دستی اصلاح کند؛ toast اطلاع‌رسانی «چیدمان خودکار ساخته شد» |
| سردرگمی ادمین (کدام دستگاه فعال است؟) | متوسط | دکمهٔ فعال واضح + برچسب در نوار ابزار |
| تداخل با `folderCanvas.gridRows` | متوسط | ارتفاع بوم ممکن است per-device باشد — در design مشخص می‌شود |
| تست E2E شکننده به viewport | پایین | breakpointها ثابت؛ تست با عرض‌های مشخص |

---

## §۷ مسیر E2E حیاتی

**E2E-DCL-01:** Super Admin → ویرایش → PC → جابجایی یک کارت → سوییچ موبایل → جابجایی متفاوت → پایان ویرایش → resize مرورگر به ۳۹۰px → چیدمان موبایل دیده شود، نه دسکتاپ.

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
