## Why

ModuleHub CMS باید به‌عنوان هستهٔ CMS ماژولار روی `example.com` (یا دامنهٔ شما) پیاده‌سازی شود تا بدون تغییر کد اصلی، ماژول‌های مستقل (Static، SPA، Backend، Docker) از طریق کارت‌های صفحهٔ اصلی اضافه، اجرا و مدیریت شوند.

## What Changes

- راه‌اندازی OpenSpec change برای پیاده‌سازی کامل ModuleHub CMS v1
- ایجاد هسته Express روی `127.0.0.1:4000` با ذخیره‌سازی JSON (بدون DB خارجی)
- پیاده‌سازی UI بر اساس `docs/Demo designe/` (RTL، دارک/لایت، کارت‌ها، breadcrumb، دیالوگ‌ها)
- **Super Admin:** Session login از اینترنت/LAN — `/admin/login` + CSRF + rate limit
- **Module Manager:** رمز جدا per-module — مدیریت محدود همان ماژول بدون Super Admin
- پوشه‌های مجازی و درخت `site-layout.json`
- Add wizard: آپلود ZIP + سه مرحله (Docker/Port/Permissions → آیکون/منابع → ذخیره)
- اجرای ماژول: Static/SPA (بدون پروسه)، Backend (`systemd-run`)، Docker (`docker run`) + پروکسی `/modules/<id>/`
- محدودیت منابع CPU/RAM/Swap/I/O/Network (Docker) با cgroups و `tc`
- سقف همزمانی ماژول running (`maxConcurrentRunningModules`)
- auto-restart اختیاری پس از crash (از system-settings)
- کش پکیج hash-based در `/var/cache/modulehub/pkg/`
- مدیریت ماژول (چرخ‌دنده): start/stop، لاگ، ویرایش، حذف، backup تکی، GitHub sync
- تنظیمات سراسری `/admin/settings` → `system-settings.json`
- پشتیبان‌گیری و بازیابی کامل
- نسخه‌گذاری ماژول و لاگ متمرکز
- یکپارچگی dual-WAN (`network-metric-toggler`) برای نصب وابستگی
- استقرار با Nginx + systemd روی Ubuntu (`deploy@203.0.113.1` در docs — IP نمونه RFC5737)

## Capabilities

### New Capabilities

- `cms-core`: هسته Express، health، لاگ Winston، ساختار دایرکتوری سرور، سرویس systemd
- `home-layout`: درخت پوشه‌های مجازی، `site-layout.json`، breadcrumb، رندر کارت‌ها
- `virtual-folder`: ایجاد پوشه مجازی از منوی کارت + (بدون پوشه فیزیکی)
- `admin-frontend`: UI صفحهٔ اصلی و پنل — login، gear flow، fetch API
- `super-admin-auth`: Session login Super Admin — bcrypt، CSRF، rate limit، logout
- `module-manager-auth`: رمز per-module — scoped session، lockout، permissions
- `module-upload-wizard`: آپلود ZIP، استخراج، wizard سه‌مرحله‌ای، تخصیص پورت خودکار
- `module-runtime`: میزبانی Static/SPA/Backend/Docker، پروکسی معکوس، محدودیت منابع
- `package-cache`: کش hash-based برای `package.json` / `requirements.txt` / `composer.json`
- `module-management`: دیالوگ چرخ‌دنده — start/stop/restart، لاگ، edit، delete، backup تکی، GitHub sync
- `system-settings`: صفحه `/admin/settings`، اعتبارسنجی schema، رادیو رابط شبکه، auth TTL
- `backup-restore`: پشتیبان‌گیری ZIP کامل و بازیابی با تأیید
- `network-install`: یکپارچگی `network-metric-toggler` برای npm/pip/docker/git

### Modified Capabilities

<!-- پروژه greenfield — spec موجودی ندارد -->

## Impact

- **کد جدید:** `core/`، `public/`، `scripts/`، `config/`
- **ذخیره‌سازی:** `storage/site-layout.json`، `storage/system-settings.json`، `storage/admin-users.json`
- **سرور:** `/opt/modulehub-cms/`، `/var/log/modulehub/modules/`، `/var/cache/modulehub/pkg/`
- **زیرساخت:** Nginx (`example.com`) — proxy بدون IP restrict؛ auth در CMS
- **وابستگی‌ها:** Express، TypeScript، Jest، ESLint، express-session، bcrypt، express-rate-limit، multer، adm-zip، winston، fs-extra
- **استاندارد کد:** TypeScript + JSDoc — `design.md` §۱۲، `docs/code-rolls.md`
- **امنیت:** HTTPS + Session + CSRF؛ Super Admin از اینترنت؛ Module Manager scoped؛ Docker `cap_drop: ALL`
- **env:** `SESSION_SECRET`، `ADMIN_PASSWORD_HASH`
- **مرجع UI:** `docs/Demo designe/index.html`، `script.js`، `dialog.js`، `style.css`
- **مرجع auth:** `docs/design plan.md` §۶.۵
