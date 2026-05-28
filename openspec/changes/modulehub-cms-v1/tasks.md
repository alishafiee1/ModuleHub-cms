## 1. فاز ۰ — زیرساخت (cms-core)

- [ ] 1.1 ایجاد ساختار دایرکتوری پروژه: `core/src/`, `public/`, `standalone-modules/`, `storage/{logs,backups}/`, `thumbnails/`, `scripts/`, `tests/`
- [ ] 1.2 راه‌اندازی `package.json` با Express، TypeScript، multer، adm-zip، winston، fs-extra
- [ ] 1.3 پیاده‌سازی `core/src/server.ts` — listen `127.0.0.1:4000` + `GET /health`
- [ ] 1.4 پیاده‌سازی `core/src/modules/logger/` — Winston با rotate روزانه ۱۴ روز
- [ ] 1.5 کپی `config/systemd/modulehub-cms.service` و تست `systemctl enable --now`
- [ ] 1.6 تنظیم Nginx `config/nginx/haderbash-modulehub.conf` — proxy + محدودیت `/admin` به LAN
- [ ] 1.7 ایجاد `scripts/network-metric-toggler.py` — toggle موقت metric + restore
- [ ] 1.8 ایجاد dirs سرور: `/var/log/modulehub/modules`, `/var/cache/modulehub/pkg`
- [ ] 1.9 تست: `curl http://127.0.0.1:4000/health` → 200

## 2. فاز ۱ — صفحه اصلی و layout (home-layout + admin-frontend)

- [ ] 2.1 Port فایل‌های `docs/Demo designe/` به `public/` (index.html, style.css) — CSS/HTML بدون تغییر ساختار
- [ ] 2.1.1 بازنویسی `script.js` و `dialog.js`: حذف `Map` محلی — fetch از `/api/layout` و endpointهای admin
- [ ] 2.1.2 ماژول API client در frontend: `loadLayout()`, `createFolder()`, `startModule()`, `stopModule()`, ...
- [ ] 2.2 API `GET /api/layout` — خواندن `storage/site-layout.json`
- [ ] 2.3 Seed اولیه `storage/site-layout.json` از `docs/site-layout.json`
- [ ] 2.4 Frontend: رندر کارت‌ها از API — نام، آیکون، thumbnail، badge وضعیت
- [ ] 2.5 Frontend: breadcrumb navigation برای پوشه‌های مجازی
- [ ] 2.6 Frontend: dark/light theme toggle + localStorage
- [ ] 2.7 Frontend: adminMode — مخفی کردن + و ⚙ برای کاربر عادی (بر اساس دسترسی LAN/Nginx)
- [ ] 2.8 تست: باز کردن `/` — کارت‌های نمونه + breadcrumb با ۲ سطح پوشه (داده از API، نه Map محلی)

## 3. فاز ۲ — Add wizard (module-upload-wizard)

- [ ] 3.1 Endpoint `POST /admin/upload` — multer با limit از `system-settings.json`
- [ ] 3.2 استخراج ZIP به `standalone-modules/<generated-id>/`
- [ ] 3.3 Wizard مرحله ۱: Docker/Port/Permissions — UI SweetAlert2
- [ ] 3.4 Wizard مرحله ۲: آیکون (کتابخانه ۱۲تایی)، thumbnail، sliders منابع
- [ ] 3.5 Wizard مرحله ۳: تأیید + ذخیره در `site-layout.json` (version=1.0.0, status=stopped)
- [ ] 3.6 Port allocator — محدوده 4100–4999 از system-settings
- [ ] 3.7 Frontend: کارت + → منوی «پوشه جدید» / «آپلود ZIP»
- [ ] 3.7.1 API `POST /admin/folder` — ایجاد پوشه مجازی در `site-layout.json` (virtual-folder)
- [ ] 3.7.2 Frontend: فرم نام پوشه + فراخوانی API + refresh layout
- [ ] 3.8 تست: ZIP کوچک → کارت جدید | ZIP >200MB → 413 | فایل غیر ZIP → خطا

## 4. فاز ۳ — اجرای ماژول (module-runtime)

- [ ] 4.1 `core/src/modules/module-manager/` — start/stop/status interface
- [ ] 4.2 Static/SPA handler — serve `/modules/<id>/` بدون پروسه + SPA fallback
- [ ] 4.3 Backend runner — `systemd-run --scope` با CPUQuota/MemoryMax/IOWeight
- [ ] 4.4 Docker runner — `docker run` با resource flags + cap_drop ALL
- [ ] 4.4.1 `scripts/setup_net_limit.sh` — اعمال `tc` token bucket برای `net_mbps` روی اینترفیس کانتینر
- [ ] 4.5 Reverse proxy — `http-proxy-middleware` برای `/modules/<id>/`
- [ ] 4.6 OOM detection — watch process exit → status=crashed
- [ ] 4.6.1 بررسی `maxConcurrentRunningModules` قبل از start — reject با 409
- [ ] 4.6.2 Auto-restart handler — `autoRestartOnCrash` + counter ساعتی per module
- [ ] 4.7 `core/src/modules/resource-limiter/` — اعمال محدودیت‌ها از JSON
- [ ] 4.8 Module logging — stdout/stderr → `/var/log/modulehub/modules/<id>.log`
- [ ] 4.9 تست: Static module بدون پورت | Backend روی 4100 | Docker container running
- [ ] 4.10 تست: Docker با `net_mbps: 10` — egress shaped (~40s برای 5MB)
- [ ] 4.11 تست: start یازدهمین ماژول → reject 409 | auto-restart پس از crash

## 5. فاز ۴ — کش پکیج (package-cache)

- [ ] 5.1 `core/src/modules/cache-manager/` — scan `package.json`, `requirements.txt`, `composer.json`
- [ ] 5.2 SHA256 hash از محتوای manifest
- [ ] 5.3 Cache lookup در `/var/cache/modulehub/pkg/<hash>/`
- [ ] 5.4 Cache miss — install در temp + store + symlink
- [ ] 5.5 یکپارچگی با network-install — toggler قبل/بعد install
- [ ] 5.6 LRU eviction — `maxPackageCacheGb` از settings
- [ ] 5.7 تست: دو ماژول با `package.json` یکسان — بار دوم instant

## 6. فاز ۵ — مدیریت ماژول (module-management)

- [ ] 6.1 Gear dialog — Start/Stop/Restart/Logs/Edit/Backup/GitHub/Delete
- [ ] 6.2 API `POST /admin/module/:id/start` و `:id/stop`
- [ ] 6.3 Log viewer — آخرین N خط از `/var/log/modulehub/modules/<id>.log`
- [ ] 6.4 Edit settings — بروزرسانی resources/icon/thumbnail در JSON + restart if needed
- [ ] 6.5 Delete module — stop + حذف پوشه + JSON + log
- [ ] 6.6 Per-module backup — ZIP download
- [ ] 6.7 GitHub sync — `git pull` + reinstall deps (اگر gitRepo تنظیم شده)
- [ ] 6.8 Status badges — running=سبز, stopped=خاکستری, crashed=قرمز
- [ ] 6.9 تست: start→stop→view logs→edit→delete cycle

## 7. فاز ۶ — پشتیبان‌گیری (backup-restore)

- [ ] 7.1 `core/src/modules/backup-restore/` — ZIP از layout + settings + modules + thumbnails
- [ ] 7.2 Backup endpoint + download از پنل
- [ ] 7.3 Restore — upload ZIP + confirm + pre-restore auto-backup
- [ ] 7.4 CLI: `node scripts/cli.js backup --output <path>`
- [ ] 7.5 تست: backup → حذف ماژول → restore → ماژول برگردد

## 8. فاز ۷ — نسخه‌گذاری و لاگ

- [ ] 8.1 فیلد `version` و `changelog` در site-layout (semantic versioning)
- [ ] 8.2 UI ویرایش version/changelog در gear dialog
- [ ] 8.3 logrotate config برای `storage/logs/cms.log` و module logs
- [ ] 8.4 Log levels — info/error/debug در Winston
- [ ] 8.5 تست: تغییر version → JSON updated

## 9. فاز ۷.۵ — تنظیمات سراسری (system-settings)

- [ ] 9.1 Seed `storage/system-settings.json` از `docs/system-settings.example.json`
- [ ] 9.2 صفحه `/admin/settings` — فرم تمام فیلدها
- [ ] 9.3 Schema validation برای settings
- [ ] 9.4 Radio NIC — لیست از `ip -o link show up` (فقط ≥۲ کارت)
- [ ] 9.5 اتصال settings به upload limit, port range, default resources
- [ ] 9.6 تست: تغییر maxZipUploadMb → upload reject | تغییر NIC → npm از interface جدید

## 10. فاز ۸ — تست یکپارچگی و استقرار

- [ ] 10.1 تست سناریوی کامل: + → ZIP → wizard → start → کلیک کارت → محتوا
- [ ] 10.2 تست dual-WAN: npm install با metric toggler
- [ ] 10.3 تست OOM: ماژول malloc → crashed badge
- [ ] 10.4 تست امنیت: `/admin` از WAN → 403
- [ ] 10.5 تست ۵ ماژول همزمان running (زیر سقف ۱۰)
- [ ] 10.5.1 تست سقف `maxConcurrentRunningModules` — start یازدهم → خطا
- [ ] 10.6 Deploy به `/opt/modulehub-cms` روی `ash@192.168.88.50`
- [ ] 10.7 بروزرسانی README.md
- [ ] 10.8 نوشتن نتایج تست در `tests/test-results.log`

## 11. تست‌های واحد (موازی با فازها)

- [ ] 11.1 Unit test: layout JSON parser/validator
- [ ] 11.2 Unit test: port allocator (range, collision)
- [ ] 11.3 Unit test: hash computation for package cache
- [ ] 11.4 Unit test: system-settings schema validation
- [ ] 11.5 Integration test: upload → extract → register in layout
