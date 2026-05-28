## Why

ModuleHub CMS باید به‌عنوان هستهٔ سایت نقاب `haderbash.ir` پیاده‌سازی شود تا بدون تغییر کد اصلی، ماژول‌های مستقل (Static، SPA، Backend، Docker) از طریق کارت‌های صفحهٔ اصلی اضافه، اجرا و مدیریت شوند. مستندات کامل (`docs/proposal.md`، `design plan.md`، `tasks.md`، `Demo designe/`) و دمو UI آماده است؛ اکنون نیاز به یک change ساختاریافته با فازبندی و specهای قابل اجرا داریم.

## What Changes

- راه‌اندازی OpenSpec change برای پیاده‌سازی کامل ModuleHub CMS v1
- ایجاد هسته Express روی `127.0.0.1:4000` با ذخیره‌سازی JSON (بدون DB خارجی)
- پیاده‌سازی UI بر اساس `docs/Demo designe/` (RTL، دارک/لایت، کارت‌ها، breadcrumb، دیالوگ‌ها)
- پوشه‌های مجازی و درخت `site-layout.json`
- Add wizard: آپلود ZIP + سه مرحله (Docker/Port/Permissions → آیکون/منابع → ذخیره)
- اجرای ماژول: Static/SPA (بدون پروسه)، Backend (`systemd-run`)، Docker (`docker run`) + پروکسی `/modules/<id>/`
- محدودیت منابع CPU/RAM/Swap/I/O با cgroups
- کش پکیج hash-based در `/var/cache/modulehub/pkg/`
- مدیریت ماژول (چرخ‌دنده): start/stop، لاگ، ویرایش، حذف، backup تکی، GitHub sync
- تنظیمات سراسری `/admin/settings` → `system-settings.json`
- پشتیبان‌گیری و بازیابی کامل
- نسخه‌گذاری ماژول و لاگ متمرکز
- یکپارچگی dual-WAN (`network-metric-toggler`) برای نصب وابستگی
- استقرار با Nginx + systemd روی `ash@192.168.88.50`

## Capabilities

### New Capabilities

- `cms-core`: هسته Express، health، لاگ Winston، ساختار دایرکتوری سرور، سرویس systemd
- `home-layout`: درخت پوشه‌های مجازی، `site-layout.json`، breadcrumb، رندر کارت‌ها
- `admin-frontend`: UI صفحهٔ اصلی و پنل ادمین بر اساس Demo designe (RTL، تم، کارت +، چرخ‌دنده)
- `module-upload-wizard`: آپلود ZIP، استخراج، wizard سه‌مرحله‌ای، تخصیص پورت خودکار
- `module-runtime`: میزبانی Static/SPA/Backend/Docker، پروکسی معکوس، محدودیت منابع
- `package-cache`: کش hash-based برای `package.json` / `requirements.txt` / `composer.json`
- `module-management`: دیالوگ چرخ‌دنده — start/stop/restart، لاگ، edit، delete، backup تکی، GitHub sync
- `system-settings`: صفحه `/admin/settings`، اعتبارسنجی schema، رادیو رابط شبکه
- `backup-restore`: پشتیبان‌گیری ZIP کامل و بازیابی با تأیید
- `network-install`: یکپارچگی `network-metric-toggler` برای npm/pip/docker/git

### Modified Capabilities

<!-- پروژه greenfield — spec موجودی ندارد -->

## Impact

- **کد جدید:** `core/`، `public/`، `scripts/`، `config/`
- **ذخیره‌سازی:** `storage/site-layout.json`، `storage/system-settings.json`
- **سرور:** `/opt/modulehub-cms/`، `/var/log/modulehub/modules/`، `/var/cache/modulehub/pkg/`
- **زیرساخت:** Nginx (`haderbash.ir`)، systemd unit، dual-WAN metric toggler
- **وابستگی‌ها:** Express، multer، adm-zip، winston، fs-extra
- **امنیت:** `/admin` فقط LAN؛ بدون API عمومی؛ Docker با `cap_drop: ALL`
- **مرجع UI:** `docs/Demo designe/index.html`، `script.js`، `dialog.js`، `style.css`
