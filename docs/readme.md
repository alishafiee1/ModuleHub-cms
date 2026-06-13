<div dir="rtl" style="text-align:right;">

# داکیومنت ModuleHub CMS — از کجا شروع کنم؟

یه نقشهٔ ساده برای خودت و هم‌تیمی. اگه فنی نیستی، از **proposal** شروع کن؛ اگه می‌خوای کد بزنی، **design** و **tasks**.

---

## هسته — همیشه اینجا

| فایل | یک جمله |
|------|---------|
| [proposal.md](proposal.md) | چرا ModuleHub ساختیم و برای کیه |
| [design.md](design.md) | معماری، مسیر فایل‌ها، endpointها، اعداد |
| [tasks.md](tasks.md) | چک‌لیست فازها — الان کجاییم؟ |
| [how-to-use.md](how-to-use.md) | نصب و اجرای محلی (`npm install`، `npm run dev`) |
| [ui-behavior.md](ui-behavior.md) | روی صفحه دقیقاً چی می‌شه |
| [project-file-index.md](project-file-index.md) | هر فایل مهم یک خط چیه |
| [architecture-and-structure.md](architecture-and-structure.md) | توضیح عمیق‌تر فایل‌های کلیدی |

---

## راهنماهای تخصصی

| موضوع | فایل |
|--------|------|
| ساخت ZIP ماژول | [developer-guide.md](developer-guide.md) |
| استقرار روی Ubuntu | [deploy-guide.md](deploy-guide.md) |
| Static / Backend / Docker | [module-hosting-guide.md](module-hosting-guide.md) |
| پشتیبان و بازیابی | [backup-restore.md](backup-restore.md) |
| اسکریپت‌های سرور | [server-scripts.md](server-scripts.md) |

---

## فیچر جدید یا تموم‌شده

پوشهٔ [`change/`](change/) — هر ایدهٔ بزرگ یه پوشه جدا داره (`proposal` · `design` · `tasks`).

- **باز:** `add manifest` · `spa-module` · `docker-module`
- **تموم‌شده (تاریخ شمسی):** `1405-03-23-server-code-update-standard` · `1405-03-23-device-card-layout`

ایده‌های ردشده یا قدیمی → [`archive/`](archive/)

---

## برای AI

انسان‌ها همین `docs/` رو می‌خونن. AI از [`docs-for-ai/map.md`](../docs-for-ai/map.md) شروع می‌کنه — انگلیسی و فشرده.

یادداشت شخصی و walkthrough → `docs-personal/` (توی git نیست)

---

## دادهٔ نمونه

- [`system-settings.example.json`](system-settings.example.json) — پیش‌فرض تنظیمات سرور
- [`site-layout.json`](site-layout.json) — نمونهٔ schema کارت‌ها و ماژول‌ها

</div>

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
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
.task-list-item input[type="checkbox"],
input.task-list-item-checkbox {
  margin: 0 0.5em 0 0 !important;
}
</style>
