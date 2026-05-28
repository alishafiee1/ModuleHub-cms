> **پایان هر فاز:** unit test + `npm run lint` + JSDoc — [`design.md` §۱۲](design.md) · [`docs/code-rolls.md`](../../../docs/code-rolls.md)

## 1. فاز ۰ — زیرساخت (cms-core)

- [x] 1.1 ایجاد ساختار دایرکتوری پروژه: `core/src/`, `public/`, `standalone-modules/`, `storage/{logs,backups}/`, `thumbnails/`, `scripts/`, `tests/{unit,integration,fixtures}/`
- [x] 1.2 راه‌اندازی `package.json` — Express، TypeScript، Jest، ts-jest، ESLint، express-session، bcrypt، express-rate-limit، multer، adm-zip، winston، fs-extra
- [x] 1.3 پیاده‌سازی `core/src/server/index.ts` — listen `127.0.0.1:4000` + `GET /health`
- [x] 1.4 پیاده‌سازی `core/src/modules/logger/` — Winston با rotate روزانه ۱۴ روز
- [x] 1.5 کپی `config/systemd/modulehub-cms.service` و تست `systemctl enable --now` — `scripts/install-systemd.sh` (اجرا روی سرور)
- [x] 1.6 تنظیم Nginx — proxy `/` و `/admin` **بدون** محدودیت IP (auth در CMS) — `config/nginx/modulehub-cms.conf.example`
- [x] 1.7 ایجاد `scripts/network-metric-toggler.py` — toggle موقت metric + restore
- [x] 1.8 ایجاد dirs سرور: `/var/log/modulehub/modules`, `/var/cache/modulehub/pkg` — `scripts/setup-server-dirs.sh`
- [x] 1.9 **Unit:** `tests/unit/cms-core/health.test.ts` — `GET /health` → 200 و `{ status: "ok" }`
- [x] 1.10 **Unit:** `tests/unit/cms-core/startup-dirs.test.ts` — ایجاد/بررسی `storage/logs/`، `storage/backups/`، `standalone-modules/`
- [x] 1.11 **Unit:** `tests/unit/logger/logger.test.ts` — فرمت log entry (method، path، status)
- [x] 1.12 تست دستی: `curl http://127.0.0.1:4000/health` → 200
- [x] 1.13 **بستن فاز:** `npm run lint` + JSDoc برای `server/index.ts` و `logger/`

## 2. فاز ۱ — صفحه اصلی و layout (home-layout + admin-frontend)

- [x] 2.1 Port فایل‌های `docs/Demo designe/` به `public/` (index.html, style.css)
- [x] 2.1.1 بازنویسی `script.js` و `dialog.js` — fetch از `/api/layout` و endpointهای admin
- [x] 2.1.2 ماژول API client: `loadLayout()`, `createFolder()`, `startModule()`, `stopModule()`, ...
- [x] 2.2 API `GET /api/layout` — خواندن `storage/site-layout.json`
- [x] 2.3 Seed اولیه `storage/site-layout.json` از `docs/site-layout.json`
- [x] 2.4 Frontend: رندر کارت‌ها از API
- [x] 2.5 Frontend: breadcrumb navigation
- [x] 2.6 Frontend: dark/light theme toggle + localStorage
- [x] 2.7 Frontend: کارت + مخفی تا Super Admin login — ⚙ visible با auth flow
- [x] 2.8 **Unit:** `tests/unit/home-layout/layout-parser.test.ts` — parse معتبر، JSON نامعتبر، فیلدهای اجباری، breadcrumb path
- [x] 2.9 **Unit:** `tests/unit/home-layout/layout-tree.test.ts` — traverse پوشه مجازی، یافتن children، module vs folder
- [x] 2.10 **Unit:** `tests/unit/home-layout/layout-api.test.ts` — `GET /api/layout` با fixture (supertest)
- [x] 2.11 تست دستی: `/` — کارت‌ها + breadcrumb (داده از API)
- [x] 2.12 **بستن فاز:** `npm run lint` + JSDoc برای `home-layout/` و API client

## 3. فاز ۲ — Add wizard (module-upload-wizard + virtual-folder)

- [x] 3.1 Endpoint `POST /admin/upload` — multer با limit از system-settings
- [x] 3.2 استخراج ZIP به `standalone-modules/<generated-id>/`
- [x] 3.3 Wizard مرحله ۱: Docker/Port/Permissions
- [x] 3.4 Wizard مرحله ۲: آیکون، thumbnail، sliders منابع
- [x] 3.5 Wizard مرحله ۳: ذخیره در site-layout (version=1.0.0, status=stopped)
- [x] 3.6 Port allocator — 4100–4999
- [x] 3.7 Frontend: کارت + → «پوشه جدید» / «آپلود ZIP»
- [x] 3.7.1 API `POST /admin/folder` — پوشه مجازی
- [x] 3.7.2 Frontend: فرم نام پوشه + refresh layout
- [x] 3.8 **Unit:** `tests/unit/module-upload-wizard/port-allocator.test.ts` — تخصیص پورت آزاد، محدوده، تداخل، پورت دستی نامعتبر
- [x] 3.9 **Unit:** `tests/unit/module-upload-wizard/upload-validator.test.ts` — رد non-ZIP، mock حجم > limit → 413
- [x] 3.10 **Unit:** `tests/unit/module-upload-wizard/wizard-save.test.ts` — ثبت ماژول با version=1.0.0 و status=stopped
- [x] 3.11 **Unit:** `tests/unit/virtual-folder/folder-creator.test.ts` — افزودن پوشه مجازی به layout بدون پوشه فیزیکی
- [ ] 3.12 تست دستی: ZIP کوچک | ZIP >200MB → 413 | فایل غیر ZIP → خطا
- [x] 3.13 **بستن فاز:** `npm run lint` + JSDoc برای `port-allocator`، `upload`، `virtual-folder`

## 4. فاز ۳ — اجرای ماژول (module-runtime)

- [x] 4.1 `core/src/modules/module-manager/` — start/stop/status
- [x] 4.2 Static/SPA handler + SPA fallback
- [x] 4.3 Backend runner — systemd-run با CPUQuota/MemoryMax/IOWeight
- [x] 4.4 Docker runner — cap_drop ALL
- [x] 4.4.1 `scripts/setup_net_limit.sh` — `tc` برای `net_mbps`
- [x] 4.5 Reverse proxy — http-proxy-middleware
- [x] 4.6 OOM detection → status=crashed
- [x] 4.6.1 `maxConcurrentRunningModules` قبل از start → 409
- [x] 4.6.2 Auto-restart handler
- [x] 4.7 resource-limiter
- [x] 4.8 Module logging → `/var/log/modulehub/modules/<id>.log` (یا `storage/logs/modules` لوکال)
- [x] 4.9 **Unit:** `tests/unit/module-runtime/concurrent-limit.test.ts` — رد start وقتی running ≥ max
- [x] 4.10 **Unit:** `tests/unit/module-runtime/status-tracker.test.ts` — running → stopped → crashed
- [x] 4.11 **Unit:** `tests/unit/module-runtime/spa-fallback.test.ts` — مسیر deep بدون فایل → index.html
- [x] 4.12 **Unit:** `tests/unit/module-runtime/auto-restart.test.ts` — شمارنده تلاش در پنجره یک ساعته
- [x] 4.13 **Unit:** `tests/unit/module-runtime/resource-limiter.test.ts` — ساخت args systemd-run/docker از resources
- [ ] 4.14 تست دستی: Static | Backend | Docker | net limit | concurrent limit
- [x] 4.15 **بستن فاز:** `npm run lint` + JSDoc برای `module-manager/` و `resource-limiter`

## 5. فاز ۴ — کش پکیج (package-cache)

- [x] 5.1 cache-manager — scan manifests
- [x] 5.2 SHA256 hash
- [x] 5.3 Cache lookup `/var/cache/modulehub/pkg/<hash>/`
- [x] 5.4 Cache miss — install + symlink
- [x] 5.5 network-install toggler
- [x] 5.6 LRU eviction
- [x] 5.7 **Unit:** `tests/unit/package-cache/hash.test.ts` — SHA256 یکسان برای manifest یکسان
- [x] 5.8 **Unit:** `tests/unit/package-cache/cache-lookup.test.ts` — hit → symlink، miss → install
- [x] 5.9 **Unit:** `tests/unit/package-cache/manifest-scanner.test.ts` — شناسایی package.json / requirements.txt / composer.json
- [x] 5.10 **Unit:** `tests/unit/package-cache/lru-eviction.test.ts` — حذف قدیمی‌ترین وقتی > maxPackageCacheGb
- [x] 5.11 تست دستی: دو ماژول یکسان — بار دوم instant
- [x] 5.12 **بستن فاز:** `npm run lint` + JSDoc برای `cache-manager`

## 6. فاز ۵ — مدیریت ماژول (module-management)

- [x] 6.1 Gear dialog — Start/Stop/Restart/Logs/Edit/Backup/GitHub/Delete
- [x] 6.2 API start/stop/restart
- [x] 6.3 Log viewer + download
- [x] 6.4 Edit settings + set/reset `managementPasswordHash` (Super Admin)
- [x] 6.5 Delete — Super Admin only
- [x] 6.6 Per-module backup
- [x] 6.7 GitHub sync
- [x] 6.8 Status badges (UI موجود از فاز ۱–۳)
- [x] 6.9 **Unit:** `tests/unit/module-management/log-viewer.test.ts`
- [x] 6.10 **Unit:** `tests/unit/module-management/module-edit.test.ts`
- [x] 6.11 **Unit:** `tests/unit/module-management/module-delete.test.ts`
- [ ] 6.12 تست دستی: start→stop→logs→edit→delete
- [x] 6.13 **بستن فاز:** `npm run lint` + JSDoc — 2026-05-28

## 7. فاز ۶ — پشتیبان‌گیری (backup-restore)

- [x] 7.1 backup-restore module — ZIP کامل
- [x] 7.2 Backup endpoint + download — `POST /admin/backup`, `GET /admin/backup/list`, `GET /admin/backup/download/:fileName`
- [x] 7.3 Restore + pre-restore backup — `POST /admin/restore` + `confirm=true`
- [x] 7.4 CLI backup — `node scripts/cli.js backup --output <path>`
- [x] 7.5 **Unit:** `tests/unit/backup-restore/backup-manifest.test.ts` — لیست فایل‌های اجباری داخل ZIP
- [x] 7.6 **Unit:** `tests/unit/backup-restore/restore-validator.test.ts` — رد ZIP ناقص یا corrupt
- [ ] 7.7 تست دستی: backup → حذف → restore
- [x] 7.8 **بستن فاز:** `npm run lint` + JSDoc برای `backup-restore` — 2026-05-28

## 8. فاز ۷ — نسخه‌گذاری و لاگ

- [ ] 8.1 version + changelog در site-layout
- [ ] 8.2 UI edit version
- [ ] 8.3 logrotate
- [ ] 8.4 Log levels Winston
- [ ] 8.5 **Unit:** `tests/unit/home-layout/version-validator.test.ts` — semver معتبر/نامعتبر، changelog اختیاری
- [ ] 8.6 تست دستی: version update
- [ ] 8.7 **بستن فاز:** `npm run lint` + JSDoc برای version handler

## 9. فاز ۷.۵ — تنظیمات سراسری (system-settings)

- [ ] 9.1 Seed system-settings از example JSON (شامل auth fields)
- [ ] 9.2 صفحه `/admin/settings` — Super Admin only
- [ ] 9.3 Schema validation
- [ ] 9.4 Radio NIC
- [ ] 9.5 اتصال settings به upload/port/resources/auth TTL
- [ ] 9.6 **Unit:** `tests/unit/system-settings/schema-validator.test.ts` — valid/invalid نسبت به `system-settings.example.json`
- [ ] 9.7 **Unit:** `tests/unit/system-settings/settings-merge.test.ts` — merge پیش‌فرض + partial update
- [ ] 9.8 **Unit:** `tests/unit/system-settings/nic-validator.test.ts` — رد interface ناموجود
- [ ] 9.9 تست دستی: maxZipUploadMb | NIC | sessionTtlHours
- [ ] 9.10 **بستن فاز:** `npm run lint` + JSDoc برای `system-settings`

## 10. فاز ۸ — احراز هویت (super-admin-auth + module-manager-auth)

- [ ] 10.1 `GET/POST /admin/login` — bcrypt + express-session
- [ ] 10.2 Auth middleware — Super Admin یا Module Manager scoped
- [ ] 10.3 Rate limit login — `loginRateLimitPerMinute`
- [ ] 10.4 CSRF token — همه POST admin
- [ ] 10.5 `POST /admin/logout`
- [ ] 10.6 Seed Super Admin — `ADMIN_PASSWORD_HASH` یا admin-users.json
- [ ] 10.7 `POST /admin/module/:id/auth` — Module Manager
- [ ] 10.8 Module Manager limits — delete/settings/add → 403
- [ ] 10.9 Lockout — `modulePasswordMaxAttempts` + `modulePasswordLockoutMinutes`
- [ ] 10.10 UI: login page + SweetAlert رمز ⚙ + مخفی +
- [ ] 10.11 **Unit:** `tests/unit/super-admin-auth/bcrypt-verify.test.ts` — hash صحیح/غلط، cost ≥ 12
- [ ] 10.12 **Unit:** `tests/unit/super-admin-auth/session-middleware.test.ts` — بدون session → 401، با session → pass
- [ ] 10.13 **Unit:** `tests/unit/super-admin-auth/csrf.test.ts` — POST بدون token → 403
- [ ] 10.14 **Unit:** `tests/unit/super-admin-auth/rate-limit.test.ts` — بیش از N تلاش → 429
- [ ] 10.15 **Unit:** `tests/unit/module-manager-auth/scope-check.test.ts` — Module Manager فقط moduleId خودش
- [ ] 10.16 **Unit:** `tests/unit/module-manager-auth/lockout.test.ts` — N تلاش اشتباه → block تا lockoutMinutes
- [ ] 10.17 تست دستی: login از WAN | Module Manager از WAN | brute-force lockout
- [ ] 10.18 **بستن فاز:** `npm run lint` + JSDoc برای auth middleware و handlers

## 11. فاز ۹ — تست یکپارچگی و استقرار

- [ ] 11.1 **Gate:** `npm run test` — همه unit testها سبز
- [ ] 11.2 **Gate:** `npm run lint` — بدون خطا
- [ ] 11.3 E2E: login → + → ZIP → wizard → start → کلیک کارت
- [ ] 11.4 dual-WAN npm install
- [ ] 11.5 OOM → crashed
- [ ] 11.6 auth از اینترنت — Super Admin
- [ ] 11.7 Module Manager از WAN
- [ ] 11.8 backup/restore
- [ ] 11.9 ۵ ماژول همزمان
- [ ] 11.10 Deploy `/opt/modulehub-cms` — [`docs/dev-workflow.md`](../../../docs/dev-workflow.md) + `./scripts/deploy-on-server.sh`
- [ ] 11.11 README + `test-results.log`
