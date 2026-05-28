<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
    font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
    direction: rtl;
    text-align: right;
}
pre, code { direction: ltr; text-align: left; }
table { direction: rtl; text-align: right; width: 100%; border-collapse: collapse; }
thead th, tbody td { text-align: right; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: left; display: inline-block; }
</style>

# راهنمای توسعه‌دهنده — ModuleHub CMS

> **وضعیت:** نسخه **v0 (spec)** — بر اساس `design plan.md` و `tasks.md`  
> **هسته CMS هنوز پیاده‌سازی نشده** (`core/`، `package.json` در repo نیست).  
> این راهنما برای **ساخت ZIP ماژول** همین الان قابل استفاده است؛ بخش API دقیق بعد از کد نهایی به‌روز می‌شود.

---

## این راهنما برای کیست؟

| مخاطب | الان بخوان | بعد از پیاده‌سازی هسته |
|--------|------------|-------------------------|
| **سازنده ماژول** (HTML، React، Node، …) | §۲–§۵ | §۶ (endpointها) |
| **توسعه‌دهنده هسته CMS** | `design plan.md` + `tasks.md` | همین فایل §۶–§۷ |

---

## ۱. خلاصه: چطور ماژول اضافه می‌شود؟

```
ZIP → آپلود در پنل → wizard (Docker / پورت / منابع) → standalone-modules/<id>/ → کارت در سایت
```

- **نیازی به `manifest.json` دستی نیست** — تنظیمات در `site-layout.json` ذخیره می‌شود.
- مسیر عمومی ماژول: **`/modules/<module-id>/`**

---

## ۲. آماده‌سازی ZIP

### حداقل (Static)

```
my-portfolio.zip
├── index.html
├── css/
├── js/
└── images/
```

### Backend (Node)

```
my-api.zip
├── package.json      # scripts.start مشخص باشد
├── index.js
└── ...
```

### Docker

```
my-app.zip
├── docker-compose.yml
├── Dockerfile
└── ...
```

**ممنوع در ZIP:** `node_modules/`، `.git/`، فایل `.env` با secret.

**حد حجم:** پیش‌فرض ۲۰۰ MB (`system-settings.example.json`).

---

## ۳. پاسخ wizard (Add module)

| سؤال | Static / SPA | Backend | Docker |
|------|--------------|---------|--------|
| Docker؟ | خیر | معمولاً خیر | **بله** |
| پورت داخلی | **خالی** | مثلاً `3000` یا خالی (→ ۴۱۰۰–۴۹۹۹) | پورت کانتینر |
| دسترسی | معمولاً «شبکه» اگر API دارد | شبکه | شبکه + volume در صورت نیاز |

جزئیات انواع: **`module-hosting-guide.md`**.

---

## ۴. Base path — اجباری برای Static/SPA

ماژول زیر `/modules/<module-id>/` سرو می‌شود.

```html
<!-- درست -->
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="./css/style.css">

<!-- غلط -->
<link rel="stylesheet" href="/css/style.css">
```

**React (Vite):** `base: '/modules/MODULE_ID/'`  
**Create React App:** `"homepage": "/modules/MODULE_ID"` در `package.json`

---

## ۵. وابستگی‌ها

| فایل | سیستم چه می‌کند |
|------|------------------|
| `package.json` | `npm install` + کش در `/var/cache/modulehub/pkg/<hash>/` |
| `requirements.txt` | `pip install -r requirements.txt` |
| `composer.json` | `composer install` |

- ZIP فقط **سورس** یا **`dist/`** — نه `node_modules`.
- نصب پکیج ممکن است **اینترنت آزاد** بخواهد (dual-WAN — `design plan.md` §۱۰).

---

## ۶. API و رفتار هسته — 🔜 پس از پیاده‌سازی

> **این بخش draft است.** مقادیر از spec فعلی؛ ممکن است با کد واقعی کمی فرق کند.

| endpoint (planned) | کار | نقش |
|----------------------|-----|-----|
| `GET/POST /admin/login` | ورود Super Admin | Super Admin |
| `POST /admin/logout` | خروج | Super Admin |
| `POST /admin/upload` | آپلود ZIP | Super Admin |
| `POST /admin/folder` | پوشه مجازی | Super Admin |
| `POST /admin/module/:id/auth` | ورود با رمز ماژول | Module Manager |
| `POST /admin/module/:id/start` | Start | Super Admin یا Module Manager |
| `POST /admin/module/:id/stop` | Stop | Super Admin یا Module Manager |
| `GET /modules/:id/*` | سرو Static یا پروکسی Backend | عمومی |

**Module Manager:** Super Admin می‌تواند در edit ماژول `managementPasswordHash` تنظیم کند. توسعه‌دهنده با همان رمز — از اینترنت — فقط start/stop/log/edit **همان** ماژول را دارد. جزئیات: `design plan.md` §۶.۵.

**پس از merge فاز ۱–۳ و ۸:** این جدول از کد واقعی استخراج و این § به‌روز شود.

> **تناقض فعلی config:** `modulehub-cms.service` → `dist/core/src/server/index.js` — `design plan.md` → `core/server.js`. هنگام پیاده‌سازی یکی انتخاب و هر دو doc هماهنگ شوند.

---

## ۷. تست محلی (قبل از آپلود)

1. ZIP را local باز کنید — `index.html` در ریشه باشد.
2. با یک static server مسیر base را شبیه‌سازی کنید:

```bash
npx serve . -l 8080
# در مرورگر: http://localhost:8080/  — لینک‌های نسبی را چک کنید
```

3. برای SPA: build بگیرید و همان `dist/` را ZIP کنید — **بدون** `npm start` روی سرور.

4. Backend: `node index.js` local — پورت و env را یادداشت کنید برای wizard.

---

## ۸. عیب‌یابی بعد از نصب

| علامت | احتمال | کار |
|--------|--------|-----|
| CSS/JS لود نمی‌شود | base path | §۴ |
| `crashed` | RAM کم | RAM در چرخ‌دنده ↑ |
| `ModuleNotFoundError` | وابستگی | `package.json` در ریشه ZIP |
| npm timeout | اینترنت فیلتر | رابط شبکه در `/admin/settings` |

لاگ: `/var/log/modulehub/modules/<module-id>.log`

---

## ۹. ارجاع

| موضوع | فایل |
|--------|------|
| انواع ماژول و چالش سرور | `module-hosting-guide.md` |
| معماری و تنظیمات | `design plan.md` |
| چک‌لیست پیاده‌سازی | `tasks.md` |
| نمونه JSON ماژول | `site-layout.json` |
| معرفی ساده | `proposal.md` |

---

**نگهداری:** با اتمام هر فاز در `tasks.md`، §۶ و endpointها را به‌روز کنید.
