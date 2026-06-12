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

> **وضعیت:** هسته در `core/` — فاز ۰–۷.۵ (layout + wizard + runtime + package-cache + backup-restore + settings).  
> ماژول بعد از wizard با `status: stopped` ثبت می‌شود؛ از ⚙ **Start** سپس `/modules/<id>/` باز می‌شود.  
> deploy و توسعه: [`deploy-guide.md`](deploy-guide.md) · چک‌لیست: [`openspec/.../tasks.md`](../openspec/changes/modulehub-cms-v1/tasks.md)

---

## این راهنما برای کیست؟

| مخاطب | الان بخوان | بعد از پیاده‌سازی هسته |
|--------|------------|-------------------------|
| **سازنده ماژول** (HTML، React، Node، …) | §۲–§۲.۱ · §۳–§۵ | §۹ (endpointها) |
| **توسعه‌دهنده هسته CMS** | `design plan.md` + `tasks.md` | همین فایل §۶–§۷ |

---

## ۱. خلاصه: چطور ماژول اضافه می‌شود؟

```
ZIP → آپلود در پنل → (اگر package.json/requirements.txt/composer.json باشد: نصب/لینک از کش) → wizard → standalone-modules/<id>/ → کارت در سایت
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

**ممنوع در ZIP:** `node_modules/`، `venv/`، `vendor/`، `.git/`، فایل `.env` با secret — سرور خودش نصب می‌کند (§۲.۱).

**حد حجم:** پیش‌فرض ۲۰۰ MB (`system-settings.example.json`).

---

## ۲.۱ وابستگی‌ها — کی دانلود می‌شوند؟

> روایت ساده: [`proposal.md`](proposal.md) §کش پکیج · فنی: [`design plan.md`](design%20plan.md) §۸

### یک جمله

**ZIP = سورس + دستور پخت** (`package.json` / `requirements.txt` / `composer.json`). **`node_modules` نفرست** — سرور بعد از آپلود خودش نصب می‌کند یا از کش **لینک** می‌زند.

### جریان

```
ZIP آپلود → extract → CMS manifest را در ریشه پوشه می‌گردد
  ├─ نیست → هیچ npm/pip/composer اجرا نمی‌شود (Static کافی است)
  └─ هست →
        ├─ کش hit (همان hash قبلی) → symlink — بدون دانلود
        └─ کش miss → npm/pip/composer از اینترنت (enp63s0 موقت) → ذخیره در /var/cache/... → symlink
```

**زمان نصب:** همان **لحظه upload** — نه wizard، نه Start.

### جدول سریع

| سؤال | جواب |
|------|------|
| `node_modules` داخل ZIP؟ | **نه** — حجم زیاد و اشتباه |
| بدون `package.json`؟ | CMS دانلود نمی‌کند |
| اینترنت لازم است؟ | **بله** — اولین بار (cache miss) |
| manifest کجا باشد؟ | **ریشه ZIP** — نه داخل `mod/` |
| ZIP flat چطور؟ | `build-phase4-test-zip.ps1` یا داخل پوشه انتخاب همه → ZIP |

### تست

fixture: [`tests/fixtures/modules/phase4-cache-test/`](../tests/fixtures/modules/phase4-cache-test/) — `package.json` بدون `node_modules`.

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

جزئیات کامل: **§۲.۱** · جدول manifest:

| فایل | سیستم چه می‌کند |
|------|------------------|
| `package.json` | `npm install` + کش در `/var/cache/modulehub/pkg/<hash>/` |
| `requirements.txt` | `pip install -r requirements.txt` |
| `composer.json` | `composer install` |

- نصب پکیج ممکن است **اینترنت آزاد** بخواهد (dual-WAN — `design plan.md` §۱۰).

---

## ۶. API و رفتار هسته — 🔜 پس از پیاده‌سازی

> **این بخش draft است.** مقادیر از spec فعلی؛ ممکن است با کد واقعی کمی فرق کند.

| endpoint (planned) | کار | نقش |
|----------------------|-----|-----|
| `GET/POST /admin/login` | ورود Super Admin | عمومی / Super Admin |
| `POST /admin/logout` | خروج (CSRF + rate limit) | Super Admin / Module Manager |
| `POST /admin/change-password` | تغییر رمز (`currentPassword`, `newPassword`, `confirmPassword`) | Super Admin |
| `POST /admin/upload` | آپلود ZIP | Super Admin |
| `POST /admin/folder` | پوشه مجازی | Super Admin |
| `POST /admin/module/:id/auth` | ورود با رمز ماژول | Module Manager |
| `POST /admin/module/:id/start` | Start | Super Admin (فاز ۸: Module Manager) |
| `POST /admin/module/:id/stop` | Stop | Super Admin (فاز ۸: Module Manager) |
| `GET /modules/:id/*` | سرو Static یا پروکسی Backend | عمومی (وقتی `running`) |

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
| npm timeout | رابط شبکه ثانویه | رابط شبکه در `/admin/settings` |

لاگ: `/var/log/modulehub/modules/<module-id>.log`

---

## ۹. APIهای فعلی

| متد | مسیر | توضیح |
|-----|------|--------|
| GET | `/api/layout` | درخت + ماژول‌ها |
| GET | `/api/auth/status` | وضعیت session (فاز ۸ کامل می‌شود) |
| POST | `/admin/upload` | ZIP → `standalone-modules/<id>/` |
| POST | `/admin/wizard/save` | ثبت در `site-layout.json` |
| POST | `/admin/folder` | پوشه مجازی |
| POST | `/admin/module/:id/start` | استارت (Static/Backend/Docker) |
| POST | `/admin/module/:id/stop` | توقف |
| GET | `/admin/module/:id/backup` | ZIP تکی ماژول (⚙ در UI) |
| GET | `/modules/:id/*` | محتوای ماژول (بعد از Start) |
| GET | `/admin/settings` | صفحه تنظیمات سراسری (HTML) |
| GET | `/admin/settings/data` | JSON تنظیمات + لیست NIC |
| POST | `/admin/settings` | ذخیره partial settings (validation) |

تا فاز ۸: `MODULEHUB_DEV_SUPER_ADMIN=1` در `.env` برای تست admin — [`deploy-guide.md`](deploy-guide.md)

### ۹.۱ بکاپ و restore کامل

**UI:** `/admin/settings` → کارت «پشتیبان‌گیری و بازیابی» — `public/admin/backup-settings-dialog.js` + متدهای `ModuleHubApi` در `api-client.js`.

| متد | مسیر | توضیح |
|-----|------|--------|
| POST | `/admin/backup` | ایجاد ZIP کامل |
| GET | `/admin/backup/list` | `{ backups: [{ fileName, sizeBytes, createdAt }] }` |
| GET | `/admin/backup/download/:fileName` | دانلود |
| POST | `/admin/backup/restore/:fileName` | بازیابی از فایل روی سرور + `{ confirm: true }` |
| DELETE | `/admin/backup/:fileName` | حذف ZIP + `{ adminPassword }` |
| POST | `/admin/restore` | multipart آپلود + `confirm=true` |

روی سرور (`/opt/modulehub-cms`):

```bash
curl -X POST http://127.0.0.1:4000/admin/backup -H "X-CSRF-Token: ..." --cookie "modulehub.sid=..."
curl -s http://127.0.0.1:4000/admin/backup/list --cookie "modulehub.sid=..."
curl -X POST "http://127.0.0.1:4000/admin/backup/restore/modulehub-full-....zip" \
  -H "Content-Type: application/json" -H "X-CSRF-Token: ..." \
  --cookie "modulehub.sid=..." -d '{"confirm":true}'
```

CLI: `node scripts/cli.js backup --output /tmp/full.zip` · راهنمای کامل: [`backup-restore.md`](backup-restore.md)

---

## ۱۰. تست فاز ۴ — ماژول fixture (کش پکیج)

**مسیر:** [`tests/fixtures/modules/phase4-cache-test/`](../tests/fixtures/modules/phase4-cache-test/)

| مرحله | دستور / انتظار |
|--------|----------------|
| ساخت ZIP | `bash scripts/build-phase4-test-zip.sh` (ویندوز: `build-phase4-test-zip.ps1`) |
| آپلود ×۲ | `bash scripts/test-package-cache-manual.sh` — upload2: `installed:false` · hash یکسان |
| wizard | Docker خیر · پورت **4100** · needsProcess بله → **Start** |
| UI | `/modules/<module-id>/` — diagnostics باید **PASS** |
| verify | `bash scripts/verify-phase4-cache.sh <module-id> [module-id-2]` |

hash ثابت fixture در README همان ماژول — unit: `tests/unit/package-cache/phase4-fixture-hash.test.ts`

---

## ۱۱. ارجاع

| موضوع | فایل |
|--------|------|
| **وابستگی‌ها — کی دانلود می‌شود** | §۲.۱ همین فایل |
| انواع ماژول و چالش سرور | `module-hosting-guide.md` |
| معماری و تنظیمات | `design plan.md` |
| چک‌لیست پیاده‌سازی | `openspec/changes/modulehub-cms-v1/tasks.md` |
| نمونه JSON ماژول | `site-layout.json` |
| deploy | `deploy-guide.md` |
| معرفی ساده | `proposal.md` |
