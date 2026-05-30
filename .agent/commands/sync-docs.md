بروز رسانی داکیومنت ها پس از انجام تغییرات در کد
<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
  font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
  direction: rtl;
  text-align: right;
}
pre, code {
  direction: ltr;
  text-align: left;
}

/* جدول‌های markdown — RTL + راست‌چین همهٔ سلول‌ها (پیش‌نمایش VS Code / Cursor) */
.markdown-body table,
.markdown-preview-section table,
table {
  direction: rtl !important;
  text-align: right !important;
  width: 100%;
  border-collapse: collapse;
  margin-inline-start: 0;
  margin-inline-end: auto;
}
.markdown-body th,
.markdown-body td,
.markdown-preview-section th,
.markdown-preview-section td,
table thead th,
table tbody td,
table th,
table td {
  text-align: right !important;
  direction: rtl;
  vertical-align: top;
  padding: 0.35em 0.5em;
}
/* نام فایل داخل سلول — LTR ولی چسبیده به راست سلول */
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
</style>
---
description: پس از تغییر/رفع مشکل — walk-through، AI-common-mistakes، deploy-notes، docs پروژه
alwaysApply: false
---

# بروزرسانی مستندات 

وقتی کاربر **`/sync-docs`** زد، یا گفت «داکیومنت‌ها را بروز کن» / «ثبت کن» / «درست شد» — **بعد از اتمام کد** این چک‌لیست را انجام بده.

## ۱) Walk-through (اجباری)

فایل: `docs/session-walkthrough.md` — **یک بلوک جدید در ابتدای «آخرین جلسات»** (جدیدترین بالا).

| قاعده | مقدار |
|--------|--------|
| زبان | عامیانه، فارسی |
| خطوط | عادی ≤10 · تغییر بزرگ ≤۱۰ |
| زمان | `درخواست (YYYY-MM-DD HH:mm)` و `نتیجه (…)` — timezone سرور یا UTC ذکر کن |
| محتوا | چه خواست · چه شد · یک دستور کلیدی اگر هست |

**تغییر بزرگ:** فاز جدید، deploy شکست‌خورده→موفق، refactor گسترده.

## ۲) AI common mistakes (اگر خطا/اصلاح بود)

| نوع | مسیر |
|-----|------|
| پروژه | `docs/AI-common-mistakes/Composer 2.5.md` |
| عمومی | `AI learning docs/AI common mistakes/Composer 2.5.md` |

قالب: `readme.md` هر دو پوشه — پیشوند `DEPLOY-` / `OK-` / `DOC-` · حداکثر ۳ bullet · شماره ترتیبی · تکراری ننویس.

## ۳) مستندات خلاصه (فقط اگر عوض شد)

| فایل | چه زمانی |
|------|----------|
| `docs/deploy-notes-for-ai.md` | deploy، sudo broker، env، مسیرها |
| `docs/dev-workflow.md` | روتین pull/deploy/discard |
| `docs/developer-guide.md` | API/فاز جدید |
| `README.md` | فاز یا دستور جدید در یک خط |
| `openspec/.../tasks.md` | تیک کارهای تمام‌شده |

**نخوان:** `proposal.md` سنگین نکن · `design plan.md` فقط عدد/مسیر فنی.

مرجع نقش فایل‌ها: `docs/ai-doc-guide.md`.

## ۴) پرهیز

- کپی جدول بلند بین فایل‌ها
- walk-through قدیمی را حذف نکن — فقط prepend
- commit نکن مگر کاربر بخواهد

## ۵) پایان کار — یک خط به کاربر

«walk-through + [فایل‌های به‌روز] ثبت شد.»

---

## ۶) سه سند پیش از OpenSpec — `proposal.md` · `design plan.md` · `tasks.md`

> این سه فایل **قبل از OpenSpec** در `docs/` نوشته شده‌اند و نقش «معماری + روایت + چک‌لیست انسانی» را دارند.  
> **OpenSpec** (`openspec/changes/.../tasks.md` + specs) مرجع **پیاده‌ساز و Agent** است؛ ولی این سه فایل برای **مالک سایت، QA، و درک کلی پروژه** باقی می‌مانند.  
> مرجع نقش و سبک: [`docs/ai-doc-guide.md`](docs/ai-doc-guide.md)

### اصل مهم: «کد حقیقت است، docs باید هم‌راستا شود»

در کدنویسی گاهی بعد از اتمام کار **اصلاح، میان‌بر، یا بهبود** نسبت به متن اولیه docs رخ می‌دهد (مثلاً مسیر npm تحت systemd، symlink به‌جای کپی، env جدید).  
**اشتباه:** docs قدیمی را نگه داشتن و فقط openspec را تیک زدن.  
**درست:** اگر رفتار واقعی عوض شد → **حداقل** `design plan.md` + (در صورت نیاز) یک جمله در `proposal.md` + تیک فاز در `tasks.md`.

| لایه | فایل | نقش | چه موقع sync-docs |
|------|------|-----|-------------------|
| روایت | `docs/proposal.md` | چرا و چه حسّی برای کاربر | فقط اگر **تجربه کاربر** یا **قابلیت قابل لمس** عوض شد |
| فنی | `docs/design plan.md` | چگونه — مسیر، جدول، محدودیت | اگر **مسیر، عدد، endpoint، معماری** با کد فرق گرفت |
| چک‌لیست انسانی | `docs/tasks.md` | فاز + تست دستی سطح بالا | پایان هر فاز: وضعیت فاز را ✅ کن؛ تسک جدید → یک **ردیف** |
| پیاده‌سازی Agent | `openspec/.../tasks.md` | تیک دقیق unit/integration | همیشه با sync-docs هم‌زمان (§۳) |

**ترتیب به‌روزرسانی وقتی drift داری:**  
`openspec/tasks` (تیک) → `design plan` (دلتا فنی) → `docs/tasks` (فاز) → `proposal` (یک پارagraph روایی اگر لازم) → `session-walkthrough` (چه شد واقعاً)

---

### قواعد سبک — حفظ ادبیات هر فایل

#### `proposal.md` — روایی، ساده، عامیانه
- مخاطب: ادمین / مالک — **بدون** فرض دانش فنی
- ساختار هر بخش: **چالش → پاسخ → تجربه کاربر (۲–۴ bullet) → ارجاع یک خطی** به design plan
- دوم شخص («شما»)، تشبیه کوتاه مجاز (کارت روی میز، پوشه روی کاغذ)
- **اصطلاحات:** اول بار در همان بخش **یک جمله ساده** توضیح بده؛ مثلاً: «کش پکیج یعنی وابستگی‌های npm یک‌بار نصب می‌شوند و دفعه بعد فقط لینک می‌شوند — سریع‌تر»
- **ممنوع:** جدول فنی بلند، endpoint، مسیر absolute، دستور shell، تکرار design plan
- **تغییر کوچک فنی** (مثل env یا مسیر nvm): در proposal **ننویس** — فقط در design plan

#### `design plan.md` — فنی، بدون داستان
- جدول، مسیر فایل، دستور shell، محدودیت cgroups
- **ممنوع:** «مثل این می‌ماند که…»، تکرار مقدمه proposal، پارagraph بلند انگیزشی
- عدد پیش‌فرض → فقط اینجا + `system-settings.example.json` (هر دو با هم)
- drift را **patch کوچک** بزن (یک bullet یا یک ردیف جدول)، نه بازنویسی کل §

#### `tasks.md` — چک‌لیست QA، نه spec
- ستون‌ها: وظیفه | جزئیات | خروجی | روش تست — **بدون** چرایی محصول
- پایان فاز: در سرفصل فاز یا یادداشت کوتاه «✅ انجام شد (تاریخ)» — جزئیات unit test در openspec
- تسکی که در openspec اضافه شد ولی در docs/tasks نبود → **یک ردیف** اضافه کن، نه فاز جدید کامل

---

### چه زمانی هر سه فایل را **نادیده** بگیر (sync-docs سبک)

| موضوع | فقط کافی است |
|--------|----------------|
| باگ deploy، SCP اشتباه، CRLF | walk-through + AI-common-mistakes + deploy-notes |
| refactor داخلی بدون تغییر رفتار | openspec تیک + walk-through |
| تست دستی موفق همان فاز | openspec 5.11 + walk-through؛ `docs/tasks` فقط ✅ فاز |

---

### چک‌لیست §۶ قبل از پایان sync-docs

- [ ] آیا **رفتار واقعی** با `design plan.md` فرق دارد؟ → دلتا در design plan
- [ ] آیا **کاربر/ادمین** چیز جدیدی می‌بیند یا می‌فهمد؟ → یک بلوک کوتاه در proposal
- [ ] فاز در `docs/tasks.md` ✅ یا ردیف جدید اضافه شد؟
- [ ] `openspec/.../tasks.md` با docs/tasks **هم‌فاز** است (شماره فاز یکی باشد)
- [ ] proposal هنوز **غیرفنی** و خواندنی است؟
- [ ] تکرار جدول بین proposal و design **حذف/ارجاع** شده؟
- [ ] اصطلاح جدید در proposal **یک خط** توضیح خورد؟

**پرهیز:** کپی `openspec/specs` به design plan · بازنویسی proposal مثل design plan · حذف تاریخچه فازهای ✅ از tasks

**مرجع کامل:** [`docs/ai-doc-guide.md`](docs/ai-doc-guide.md) § «نقش هر فایل» و «قواعد نوشتن»

This command will be available in chat with /sync-docs
