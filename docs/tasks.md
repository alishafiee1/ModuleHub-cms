<div dir="rtl" style="text-align:right;">

# چک‌لیست پیاده‌سازی و تست ModuleHub CMS

> **پایان هر فاز:** unit test + `npm run lint` + JSDoc توابع public — [`code-rolls.md`](code-rolls.md)  
> **TypeScript:** همهٔ `core/src/` — type برای IO ماژول‌ها، بدون `any`.  
> **وضعیت (2026-06-13):** فاز **۰–۷.۵** ✅ · فاز **۸** ⏳ جزئی (login، logout، change-password، منوی Super Admin — 2026-06-12) · **Home UI** ✅ (card canvas، folder nav، ظاهر، theme.js — 2026-06-12)

| فاز | موضوع | وضعیت |
|-----|--------|--------|
| ۰–۱ | زیرساخت + صفحه اصلی | ✅ |
| ۲ | wizard + ZIP | ✅ |
| ۳ | runtime Start/Stop + `/modules/` | ✅ |
| ۴ | کش پکیج | ✅ 2026-05-28 |
| ۵ | ⚙ مدیریت ماژول (gear) | ✅ 2026-05-28 |
| ۶ | backup کامل + UI settings | ✅ 2026-06-12 |
| ۷ | versioning + log levels | ✅ 2026-05-29 |
| ۷.۵ | تنظیمات سراسری `/admin/settings` (کارتی) | ✅ 2026-06-12 |
| ۷.۶ | بوم cardGrid + ویرایش چیدمان + cardBackground | ✅ 2026-06-13 |
| ۷.۷ | چیدمان per-device (موبایل / تبلت / PC) | ✅ 2026-06-13 — [change/1405-03-23-device-card-layout](./change/1405-03-23-device-card-layout/proposal.md) |
| ۷.۸ | استاندارد به‌روزرسانی کد روی سرور | ✅ 2026-06-13 — [change/1405-03-23-server-code-update-standard](./change/1405-03-23-server-code-update-standard/proposal.md) |
| ۷.۹ | مدیریت کارت پوشه (⚙، توضیح، جابجایی، حذف) + دیزاین استاتیک | 🔄 فاز ۱–۳ پیاده — [change/folder-card-management](./change/folder-card-management/proposal.md) · فاز ۴ استاتیک ⏳ |
| ۷.۱۰ | سفارشی‌سازی زندهٔ کارت (کد پویا + realtime) | ⏳ — [change/card-live-customization](./change/card-live-customization/proposal.md) |
| ۸ | auth کامل (CSRF، Module Manager WAN، …) | ⏳ جزئی |
| ۸+ | integration · … | ⏳ |

## فاز ۰: آماده‌سازی زیرساخت (۱ روز) — ✅

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 0.1 | ایجاد دایرکتوری‌ها | `mkdir -p /opt/modulehub-cms/{core,public,standalone-modules,storage/{logs,backups},thumbnails,scripts}`<br>`mkdir -p /var/log/modulehub/modules`<br>`mkdir -p /var/cache/modulehub/pkg` | دایرکتوری‌ها با مالکیت deploy user ایجاد شوند | `ls -la /opt/modulehub-cms` و `ls /var/cache/modulehub/pkg` |
| 0.2 | کپی سرویس systemd | کپی `modulehub-cms.service` به `/etc/systemd/system/` | فایل با محتوای صحیح وجود داشته باشد | `cat /etc/systemd/system/modulehub-cms.service` |
| 0.3 | نصب وابستگی‌های Node.js | `npm init -y && npm install express multer adm-zip winston fs-extra` | فایل `package.json` و `node_modules` | `npm list --depth=0` |
| 0.4 | راه‌اندازی سرویس | `systemctl daemon-reload && systemctl enable modulehub-cms --now` | سرویس active (running) | `systemctl status modulehub-cms` |
| 0.5 | تنظیم Nginx | proxy `/` و `/admin` بدون محدودیت IP — auth در CMS | Nginx syntax ok, reload | `nginx -t && curl -I https://example.com/admin/login` |
| 0.6 | تست connectivity از ens4 و enp63s0 | اجرای `curl --interface ens4 https://google.com` و `curl --interface enp63s0 https://github.com` | هر دو پاسخ ۲۰۰ (ens4 محدودیت دارد ولی google کار می‌کند) | مشاهده خروجی curl |

---

## فاز ۱: هسته اولیه و صفحه اصلی (۲ روز) — ✅

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 1.1 | ایجاد `server.js` | Express server listening on `127.0.0.1:4000` | سرور بدون خطا بالا بیاید | `curl http://localhost:4000/health` → 200 |
| 1.2 | سرویس `site-layout.json` اولیه | ساختار درختی با root folder و ۲ ماژول نمونه | فایل در `/opt/modulehub-cms/storage/site-layout.json` با فرمت صحیح | `jq . storage/site-layout.json` |
| 1.3 | صفحه اصلی (frontend) | نمایش کارت‌ها از روی JSON با HTML/CSS ساده | صفحه در مرورگر با کارت‌های نمونه دیده شود | باز کردن `http://localhost:4000` |
| 1.4 | مسیریابی پوشه‌ها | کلیک روی کارت پوشه → تغییر view و breadcrumb | breadcrumb به‌روز شود، محتویات پوشه جدید نشان داده شود | تست با ۲ سطح پوشه |
| 1.5 | تست لاگ اولیه | ثبت درخواست‌ها در `storage/logs/cms.log` | فایل لاگ ایجاد شود و شامل رکوردهای درخواست باشد | `tail -f storage/logs/cms.log` |

---

## فاز ۲: Add wizard – آپلود ZIP و مراحل اولیه (۳ روز) — ✅

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 2.1 | فرم آپلود ZIP | endpoint POST `/admin/upload` با multer — حداکثر حجم از `system-settings.json` (پیش‌فرض ۲۰۰ MB) | فایل در `/tmp/modulehub-upload/` ذخیره شود؛ ZIP >200MB → 413 | ارسال zip کوچک و zip بزرگ‌تر از حد |
| 2.2 | استخراج ZIP | استخراج به `standalone-modules/<generated-id>/` | پوشه ماژول ایجاد شود، فایل‌ها در جای خود | `ls standalone-modules/<id>` |
| 2.3 | مرحله اول سوالات (Docker/Port/Permissions) | پورت خالی → تخصیص خودکار از ۴۱۰۰–۴۹۹۹ | پورت در `site-layout.json` ذخیره شود | بررسی network tab و `jq '.modules["<id>"].port'` |
| 2.4 | مرحله دوم (منابع و آیکون) | نمایش اسلایدرها، کتابخانه آیکون، آپلود تصویر | مقادیر دریافت و به `site-layout.json` اضافه شوند | `jq '.modules["<id>"]' storage/site-layout.json` |
| 2.5 | ذخیره نهایی ماژول | ثبت در `site-layout.json` و نمایش کارت | کارت جدید در صفحه اصلی ظاهر شود | باز کردن frontend |
| 2.6 | تست خطای آپلود | آپلود فایل غیر ZIP، آپلود بدون فایل | پیام خطای مناسب نمایش داده شود | تلاش با فایل متن ساده |

---

## فاز ۳: اجرای ماژول (systemd-run و Docker) (۳ روز) — ✅

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 3.1 | اجرای ماژول غیر Docker با systemd-run | دستور `systemd-run --user --scope -p CPUQuota=50% -p MemoryMax=512M -p IOWeight=50 bash -c "node index.js"` | پروسه در background اجرا شود، پورت ماژول (۴۱۰۰–۴۹۹۹ یا دستی) باز شود | `ps aux \| grep node` و `ss -tulpn \| grep <port>` |
| 3.2 | اجرای ماژول Dockerized | `docker run -d --cpus=0.5 --memory=512m --blkio-weight=500 --name module-<id> -p <host-port>:<container-port> ...` | کانتینر running | `docker ps --filter name=module-` |
| 3.3 | پروکسی معکوس توسط CMS | اضافه کردن route `/modules/<id>` به پورت ماژول در Express | درخواست به `/modules/<id>` به ماژول هدایت شود | `curl http://localhost:4000/modules/<id>/` |
| 3.4 | توقف ماژول | `systemctl --user stop scope-...` یا `docker stop` | ماژول از حالت running خارج شود | وضعیت در پنل ادمین «stopped» |
| 3.5 | تست محدودیت RAM | ماژول تستی که حافظه مصرف می‌کند (malloc loop) | ماژول پس از عبور از حد kill شود، وضعیت «crashed» | مشاهده لاگ و وضعیت |
| 3.6 | تست محدودیت CPU | ماژول با محاسبات فشرده (prime numbers) | مصرف CPU بالاتر از حد نرود (کندتر اجرا شود) | `top` در حین اجرا |

---

## فاز ۴: کش پکیج متمرکز (۲ روز) — ✅ انجام شد 2026-05-28

> smoke سرور: `bash scripts/smoke/test-package-cache.sh` · fixture: `tests/fixtures/modules/package-cache-test/` · verify: `bash scripts/verify-package-cache.sh <module-id>`  
> **وابستگی‌ها:** `node_modules` در ZIP نه — manifest در **ریشه** ZIP · [`developer-guide.md` §۲.۱](developer-guide.md)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 4.1 | شناسایی فایل وابستگی | اسکن پوشه ماژول برای `package.json`, `requirements.txt`, `composer.json` | لیست فایل‌ها شناسایی شود | unit manifest-scanner |
| 4.2 | محاسبه هش SHA256 | از محتوای فایل(ها) | هش یکتا ایجاد شود | unit hash.test |
| 4.3 | بررسی کش | وجود دایرکتوری `/var/cache/modulehub/pkg/<hash>` | در صورت وجود، symbolic link ایجاد شود | `ls -la standalone-modules/<id>/node_modules` |
| 4.4 | نصب در صورت عدم وجود کش | `npm`/`pip`/`composer` مستقیم | خروجی در کش + symlink | upload اول ~چند ثانیه |
| 4.5 | تست با دو ماژول مشابه | fixture ZIP `package-cache-test` — Backend + diagnostics | بار دوم `installed:false` · diagnostics PASS | `build-package-cache-fixture-zip.sh` + `smoke/test-package-cache.sh` + `verify-package-cache.sh` |
| 4.6 | LRU eviction | وقتی کش > `maxPackageCacheGb` (۵ GB) | قدیمی‌ترین entry حذف شود | unit lru-eviction |
| 4.7 | npm تحت systemd | سرویس CMS بدون nvm در PATH | مسیر npm از `~/.nvm/versions/node/` یا `MODULEHUB_NPM_PATH` | لاگ upload بدون `npm: not found` |

---

## فاز ۵: مدیریت ماژول (چرخ‌دنده) (۳ روز) — ✅ انجام شد 2026-05-28

> dev: `MODULEHUB_DEV_SUPER_ADMIN=1` · API زیر `/admin/module/:id/*`

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 5.1 | نمایش دیالوگ چرخ‌دنده | کلیک روی ⚙ → modal با گزینه‌های Start/Stop، Log، Edit، Delete، Backup، GitHub Sync | modal با دکمه‌های صحیح ظاهر شود | تست در مرورگر |
| 5.2 | Start/Stop | فراخوانی `POST /admin/module/:id/start` و `:id/stop` | وضعیت `running` / `stopped` در کارت و JSON | مشاهده badge و بررسی پروسه |
| 5.3 | نمایش badge وضعیت | `running` سبز، `stopped` خاکستری، `crashed` قرمز | سه حالت در UI و `site-layout.json` | kill پروسه → `crashed` |
| 5.4 | نمایش لاگ | خواندن آخرین N خط (پیش‌فرض ۵۰) از `/var/log/modulehub/modules/<id>.log` | لاگ در modal نمایش داده شود | تولید خطای تستی در ماژول و مشاهده |
| 5.5 | ویرایش تنظیمات | بارگذاری مقادیر فعلی در دیالوگ منابع و ذخیره مجدد — شامل set/reset رمز Module Manager (Super Admin) | تنظیمات جدید در `site-layout.json` ذخیره شود | مقایسه قبل و بعد |
| 5.6 | حذف ماژول | توقف، حذف پوشه `standalone-modules/<id>`، حذف از JSON، حذف لاگ | ماژول ناپدید شود، منوها به‌روز شوند | بررسی فایل سیستم و JSON |
| 5.7 | پشتیبان از یک ماژول | دانلود ZIP از پوشه ماژول + تنظیمات آن | فایل ZIP قابل دانلود باشد | باز کردن ZIP و بررسی محتوا |
| 5.8 | همگام‌سازی GitHub | اجرای `git pull` در پوشه ماژول (اگر `gitRepo` تنظیم شده) | تغییرات کشیده شود، لاگ ثبت شود | تست با یک مخزن تستی |

---

## فاز ۶: پشتیبان‌گیری و بازیابی کامل (۲ روز) — ✅ انجام شد 2026-05-29

> **UI:** کارت بکاپ کل در `/admin/settings`. بکاپ **تکی** ماژول: ⚙ → «پشتیبان ZIP».  
> dev: `MODULEHUB_DEV_SUPER_ADMIN=1` · مسیر بکاپ روی سرور: `/opt/modulehub-cms/storage/backups/`

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 6.1 | ایجاد backup کامل | `POST /admin/backup` یا CLI | `modulehub-full-<timestamp>.zip` | `curl -X POST …/admin/backup` · `backup/list` |
| 6.2 | بازیابی از backup | pre-restore خودکار · `confirm=true` | وضعیت قبل از restore برگردد | `curl -F backup=@… -F confirm=true …/admin/restore` |
| 6.3 | تست بازیابی پس از حذف | — | ماژول/تنظیمات برگردد | ✅ تست دستی سرور (ash) |

---

## فاز ۷: نسخه‌گذاری و بهبود لاگ (۲ روز) — ✅ کد 2026-05-29

> SemVer در edit/parse · فیلتر سطح لاگ در ⚙ → «مشاهده لاگ» · logrotate: `bash scripts/install-logrotate.sh`

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 7.1 | افزودن فیلد version به `site-layout.json` | هنگام ایجاد ماژول، version=1.0.0 | فیلد وجود داشته باشد | `jq '.modules["<id>"].version'` |
| 7.2 | قابلیت به‌روزرسانی نسخه | در دیالوگ چرخ‌دنده، امکان تغییر نسخه و وارد کردن changelog | نسخه در JSON تغییر کند · SemVer نامعتبر → خطا | ⚙ → ویرایش → `2.0.0` |
| 7.3 | چرخش لاگ خودکار | `config/logrotate/modulehub-cms` + install script | فایل‌های قدیمی حذف/فشرده شوند | `sudo logrotate -d /etc/logrotate.d/modulehub-cms` |
| 7.4 | نمایش لاگ با سطح (info, error, debug) | `?level=` در API + picker در UI | فیلتر در نمایش لاگ | ⚙ → لاگ → انتخاب سطح |

---

## فاز ۷.۵: تنظیمات سراسری ادمین (۲ روز) — ✅ کد 2026-05-29

> **UI:** `https://example.com/admin/settings` (یا لینک «Super Admin» در هدر) · تا فاز ۸: `MODULEHUB_DEV_SUPER_ADMIN=1`  
> **API:** `GET /admin/settings/data` · `POST /admin/settings` · ماژول `core/src/modules/system-settings/`

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 7.5.1 | صفحه `/admin/settings` | فرم تنظیمات با ذخیره در `storage/system-settings.json` | مقادیر پیش‌فرض بارگذاری و ذخیره شوند | تغییر حد ZIP و reload |
| 7.5.2 | محدودیت ZIP | multer از `maxZipUploadMb` (پیش‌فرض ۲۰۰) بخواند | ZIP بزرگ → 413 | آپلود 201MB |
| 7.5.3 | ~~رادیو رابط شبکه~~ | حذف شد — سرور روی اینترنت آزاد | — | — |
| 7.5.4 | تخصیص پورت خودکار | allocator در محدوده `portRangeStart`–`portRangeEnd` | پورت آزاد بدون تداخل | نصب ۲ ماژول بدون پورت دستی |
| 7.5.5 | restore metric | پس از npm/docker/git حتماً restore | لاگ toggler موفق | قطع وسط install → restore |

---

## فاز ۸: احراز هویت — Session + Module Manager (۳ روز) — ✅ 2026-06-13

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست | وضعیت |
|---|-------|--------|------------------|----------|--------|
| 8.1 | Super Admin login | `GET/POST /admin/login` — bcrypt verify، express-session | session cookie پس از login موفق | login از اینترنت → redirect به `/` | ✅ |
| 8.2 | Auth middleware | محافظت `/admin/*` — Super Admin یا Module Manager scoped | بدون session → 401/redirect login | `curl /admin/settings` بدون cookie → 401 | ✅ |
| 8.3 | Rate limit login | `loginRateLimitPerMinute` از system-settings | ۶ تلاش در ۱ دقیقه → 429 | `rate-limit.test.ts` | ✅ |
| 8.4 | CSRF token | token در فرم‌های POST admin | POST بدون token → 403 | upload بدون token رد شود | ✅ |
| 8.5 | Logout | `POST /admin/logout` | session invalidate | بعد logout دسترسی admin قطع | ✅ 2026-06-12 |
| 8.5b | Change password | `POST /admin/change-password` + UI در منو/settings | hash در admin-users.json | تغییر رمز → redirect login | ✅ 2026-06-12 |
| 8.6 | Seed Super Admin | `ADMIN_PASSWORD_HASH` env یا `storage/admin-users.json` | اولین login کار کند | login با رمز seed | ✅ |
| 8.7 | Module Manager auth | `POST /admin/module/:id/auth` — verify `managementPasswordHash` | session scoped به moduleId | `module-auth-routes.test.ts` | ✅ |
| 8.8 | Module Manager limits | Module Manager نتواند delete/settings/add | delete → 403 | `module-auth-routes.test.ts` | ✅ |
| 8.9 | Lockout رمز ماژول | پس از `modulePasswordMaxAttempts` → lockout | ۵ تلاش اشتباه → ۱۵ دقیقه block | `module-auth-routes.test.ts` | ✅ |
| 8.10 | UI login + gear flow | صفحه login، SweetAlert رمز ⚙، منوی Super Admin | UX کامل | `module-manager-flow.spec.ts` (E2E) | ✅ |
| 8.11 | Set module password | Super Admin در edit ماژول — set/reset hash | hash در site-layout.json | `module-password-patch.test.ts` | ✅ |

---

## فاز ۷.۶: بوم کارت و چیدمان (Card Canvas) — ✅ 2026-06-13

| # | وظیفه | جزئیات | خروجی | تست |
|---|-------|--------|-------|-----|
| 7.6.1 | migrate cardSpan → cardGrid | `migrate-card-grid.ts` on read | JSON با `cardGrid` | unit migrate-card-grid |
| 7.6.2 | embedded canvas | `public/js/card-canvas/` drag/resize/snap | کارت روی گرید ۳۰×N | UI manual |
| 7.6.3 | PATCH folder cards | `PATCH /admin/folder/:id/cards` debounce 500ms | layout ذخیره | unit folder-cards-update |
| 7.6.4 | cardBackground | upload + inline style + editor dialog | `storage/card-backgrounds/` | unit + UI |
| 7.6.5 | folderCanvas rows | دستگیره ارتفاع بوم، `grid-slot.ts` | `folderCanvas.gridRows` | unit grid-slot |
| 7.6.6 | folder navigation | history.pushState، back-card، breadcrumb | `/?folder=` | UI manual |
| 7.6.7 | home appearance | floating Lucide icons + settings card | `system-settings.json` | UI + unit schema |
| 7.6.8 | shared theme | `public/theme.js` — home + admin | لایت/دارک یکپارچه | visual |

---

## فاز ۷.۷: چیدمان کارت per-device — ✅ 2026-06-13

> پلن کامل: [`docs/change/1405-03-23-device-card-layout/`](./change/1405-03-23-device-card-layout/proposal.md) (proposal · design · tasks)

| # | وظیفه | جزئیات | خروجی | تست |
|---|-------|--------|-------|-----|
| 7.7.1 | schema + PATCH | `cardGridTablet`, `cardGridMobile`, gridRows per device | `site-layout.json` | unit |
| 7.7.2 | derive layout | مشتق یک‌بار از desktop + ذخیره | بدون derive تکراری | unit derive-breakpoint-layout |
| 7.7.3 | toolbar device buttons | PC / تبلت / موبایل در حالت ویرایش | `card-layout-editor.js` | UI manual |
| 7.7.4 | fixed cell display | breakpoint از viewport؛ بدون resize روان کارت | `card-canvas-app.js` | E2E-DCL-01 |
| 7.7.5 | UI-behavior | به‌روزرسانی §۱.۱ و §۸.۴ | `docs/ui-behavior.md` | بعد از پیاده‌سازی |

---

## فاز ۹: تست یکپارچگی و استقرار نهایی (۳ روز)

| # | سناریو تست | روش تست | معیار قبولی |
|---|------------|---------|-------------|
| 9.1 | سناریوی کامل نصب ماژول | login Super Admin → + → ZIP → wizard → start → کلیک کارت | ماژول اجرا شود و محتوا نمایش یابد |
| 9.2 | تست نصب npm پس از upload | نصب ماژول با `package.json` | کش hit/miss در لاگ |
| 9.3 | تست محدودیت Disk I/O | ماژول ۱۰۰MB write | سرعت کمتر با `dd` |
| 9.4 | تست محدودیت Network | Docker `net_mbps: 1`، دانلود 5MB | ~40 ثانیه |
| 9.5 | تست auth از اینترنت | login Super Admin از WAN | session + admin UI |
| 9.6 | تست Module Manager از WAN | رمز ماژول → start/stop بدون Super Admin | فقط همان moduleId |
| 9.7 | تست پشتیبان و بازیابی | backup → حذف → restore | همه برگردد |
| 9.8 | تست ۵ ماژول همزمان | ۵ running | سرور پایدار |
| 9.9 | تست تنظیمات سراسری | تغییر NIC + نصب ماژول | npm از interface انتخاب‌شده |

---

## مستندات تحویل‌شده در انتهای فازها

- [x] `docs/how-to-use.md` – نصب و اجرای محلی
- [x] `docs-for-ai/map.md` – قواعد نقش هر سند برای AI
- [x] `docs/system-settings.example.json` – نمونه تنظیمات سراسری
- [ ] `docs/admin-guide.md` – راهنمای تصویری برای ادمین
- [x] `docs/developer-guide.md` – ساخت ZIP ماژول
- [x] `docs/backup-restore.md` – روش پشتیبان‌گیری (UI + curl + CLI)
- [ ] `docs/network-config.md` – نحوه مدیریت dual‑WAN
- [ ] `CHANGELOG.md` – تاریخچه تغییرات هسته
- [ ] `.eslintrc.json` و `.prettierrc`
- [ ] نتایج تست‌های فاز ۹ در یک فایل `test-results.log`

---

**نکات پایانی:**
- هر تسک پس از انجام، در این چک‌لیست تیک بخورد.
- در صورت بروز خطا در تست، تسک به مرحله قبل بازگردانده شود.
- تمام تغییرات در مخزن Git با پیام استاندارد (`feat:`, `fix:`, `test:`) ثبت شود.

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