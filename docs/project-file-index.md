<div dir="rtl" style="text-align:right;">

# فهرست فایل‌های مهم — یک خط

> فقط مسیر + یک جمله. توضیح عمیق‌تر → [`architecture-and-structure.md`](architecture-and-structure.md)

---

## هسته و تنظیمات

| مسیر | یک خط |
|------|--------|
| `core/src/server/index.ts` | نقطهٔ ورود Express — routeها و middleware |
| `core/src/config/paths.ts` | مسیرهای storage، modules، cache |
| `core/src/bootstrap/ensure-directories.ts` | ساخت پوشه‌های لازم هنگام بالا آمدن |
| `.env` / `.env.example` | secret و hash ادمین |
| `storage/site-layout.json` | کارت‌ها، پوشه‌ها، ماژول‌ها (runtime) |
| `storage/system-settings.json` | تنظیمات سراسری (runtime) |
| `docs/system-settings.example.json` | پیش‌فرض عددی تنظیمات |
| `docs/site-layout.json` | نمونه schema layout |

---

## ماژول‌های بک‌اند (`core/src/modules/`)

| مسیر | یک خط |
|------|--------|
| `admin-auth/` | login، session، CSRF، Module Manager |
| `home-layout/` | cardGrid، PATCH کارت‌ها، پس‌زمینه کارت |
| `module-upload-wizard/` | آپلود ZIP و wizard |
| `module-manager/` | start/stop، serve `/modules/<id>/` |
| `module-management/` | edit، delete، log، backup تکی |
| `package-cache/` | کش npm/pip/composer با SHA256 |
| `system-settings/` | `/admin/settings` API |
| `backup-restore/` | بکاپ/ریستور کامل |
| `virtual-folder/` | ساخت پوشهٔ مجازی |
| `resource-limiter/` | محدودیت CPU/RAM (cgroups) |
| `logger/` | middleware لاگ درخواست |

---

## فرانت (`public/`)

| مسیر | یک خط |
|------|--------|
| `index.html` | صفحهٔ اصلی — کارت‌ها |
| `script.js` | منطق اصلی UI خانه و admin toolbar |
| `dialog.js` | دیالوگ‌های SweetAlert-style |
| `theme.js` | تم روشن/تاریک مشترک |
| `admin-menu.js` | منوی Super Admin (settings، logout) |
| `card-layout-editor.js` | ویرایشگر چیدمان و پس‌زمینه کارت |
| `home-floating-background.js` | آیکون‌های شناور پس‌زمینه |
| `js/card-canvas/` | بوم drag/resize کارت‌ها |
| `admin/login.html` + `login.js` | صفحهٔ ورود |
| `admin/settings.html` + `settings.js` | تنظیمات سراسری |

---

## اسکریپت‌ها

| مسیر | یک خط |
|------|--------|
| `scripts/deploy-full.sh` | **تنها** نقطهٔ ورود deploy سرور |
| `scripts/deploy-on-server.sh` | build در `/opt` |
| `scripts/install-to-opt.sh` | rsync home → `/opt` |
| `scripts/run-with-free-wan.sh` | wrap با dual-NIC |
| `scripts/network-metric-toggler.py` | موقت کردن metric اینترنت آزاد |
| `scripts/sudo_broker.py` | broker sudo برای deploy |
| `scripts/cli.js` | بکاپ CLI از ترمینال |
| `scripts/smoke/test-package-cache.sh` | smoke تست کش پکیج |

---

## تست

| مسیر | یک خط |
|------|--------|
| `tests/unit/` | Jest unit tests |
| `tests/e2e/` | Playwright E2E |
| `tests/smoke/card-canvas-checklist.md` | چک‌لیست دستی بوم کارت |

---

## داک و OpenSpec

| مسیر | یک خط |
|------|--------|
| `docs/readme.md` | نقشهٔ داک برای انسان |
| `docs-for-ai/map.md` | نقطهٔ ورود AI |
| `openspec/changes/modulehub-cms-v1/` | spec رسمی OpenSpec |

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
