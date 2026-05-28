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

table {
    direction: rtl;
    text-align: right;
    width: 100%;
    border-collapse: collapse;
}

thead th, tbody td {
    text-align: right;
    vertical-align: top;
    padding: 0.35em 0.5em;
}

table td code, table th code {
    direction: ltr;
    unicode-bidi: embed;
    text-align: left;
    display: inline-block;
}
</style>

## Context

ModuleHub CMS یک پلتفرم greenfield است که روی سرور `ash@192.168.88.50` (Ubuntu 22.04+، dual-WAN: `ens4` فیلترشده / `enp63s0` آزاد) به‌عنوان سایت نقاب برای `3x-ui` عمل می‌کند. Nginx روی `443` به CMS روی `127.0.0.1:4000` پروکسی می‌کند؛ `/admin` فقط از LAN.

**وضعیت فعلی:** مستندات کامل در `docs/`، UI دمو در `docs/Demo designe/`، config نمونه در `config/` — کد هسته هنوز پیاده‌سازی نشده.

**محدودیت‌ها:**
- بدون دیتابیس خارجی — فقط JSON (`site-layout.json`، `system-settings.json`)
- بدون API عمومی — مدیریت فقط LAN/SSH
- CMS روی `127.0.0.1` bind شود
- تغییر دائمی default route از پنل ممنوع — فقط metric موقت + restore
- TypeScript در core، ESLint Airbnb، فایل ≤۳۰۰ خط، تابع ≤۴۰ خط

## Goals / Non-Goals

**Goals:**
- صفحهٔ اصلی با کارت‌های ماژول و پوشه‌های مجازی (JSON-only)
- Add wizard سه‌مرحله‌ای برای ZIP بدون `manifest.json` دستی
- میزبانی Static/SPA/Backend/Docker با پروکسی یکپارچه
- محدودیت منابع per-module (CPU, RAM, Swap, I/O)
- کش پکیج، لاگ متمرکز، backup/restore، تنظیمات سراسری
- UI مطابق Demo designe (RTL، dark/light، SweetAlert2 dialogs)

**Non-Goals:**
- کتابخانه ماژول آماده (فاز بعد — فعلاً فقط ZIP)
- API REST عمومی
- multi-tenant / multi-user auth (فقط ادمین LAN)
- محدودیت Network Bandwidth برای non-Docker (فاز اول — فقط Docker + اطلاع‌رسانی)
- persistence DB مشترک بین ماژول‌ها

## Decisions

### 1. Stack: Node.js 20 + Express + TypeScript (core)

**انتخاب:** Express با TypeScript در `core/src/`  
**جایگزین:** Fastify — رد شد چون تیم با Express آشناتر و docs بر Express نوشته شده  
**ساختار:** feature-based — `core/src/modules/<feature>/`

### 2. ذخیره‌سازی: JSON files

**انتخاب:** `storage/site-layout.json` (درخت + modules map) + `storage/system-settings.json`  
**جایگزین:** SQLite — رد شد برای سادگی و مطابقت docs  
**Schema:** مرجع `docs/site-layout.json` و `docs/system-settings.example.json`

### 3. Frontend: Vanilla JS از Demo designe

**انتخاب:** HTML/CSS/JS در `public/` — port مستقیم از `docs/Demo designe/`  
**جایگزین:** React SPA — رد شد؛ دمو آماده و سبک‌تر برای decoy site  
**کتابخانه‌ها:** Font Awesome 6، SweetAlert2 (CDN)

### 4. اجرای ماژول

| نوع | تشخیص | اجرا |
|-----|--------|------|
| Static/SPA | پورت خالی + `index.html` | CMS مستقیم سرو `/modules/<id>/` |
| Backend | پورت عددی یا auto 4100–4999 | `systemd-run --scope` + Express proxy |
| Docker | wizard: docker=true | `docker run` با cgroups |

**پروکسی:** `http-proxy-middleware` در Express — `/modules/:id/*` → `127.0.0.1:<port>` یا static file handler

### 5. محدودیت منابع

- **Non-Docker:** `systemd-run -p CPUQuota= -p MemoryMax= -p IOWeight=`
- **Docker:** `--cpus`, `--memory`, `--memory-swap`, `--blkio-weight`
- **Network (Docker only):** `scripts/setup_net_limit.sh` + `tc`

### 6. کش پکیج

- Hash SHA256 از `package.json` / `requirements.txt` / `composer.json`
- مسیر: `/var/cache/modulehub/pkg/<hash>/`
- Hit → symlink به `node_modules` یا `venv` در ماژول
- Miss → نصب در temp dir با `network-metric-toggler` → ذخیره در cache

### 7. Dual-WAN برای نصب پکیج

- `scripts/network-metric-toggler.py` — موقت metric `enp63s0` → install → restore
- رابط از `system-settings.json` → `packageInstallInterface`
- runtime ماژول‌ها از `ens4` (پیش‌فرض سیستم)

### 8. Admin detection

- Nginx محدودیت IP برای `/admin/*`
- Frontend: flag `adminMode` از session/cookie یا header `X-Admin-Access` (LAN-only)
- کاربر عادی: بدون کارت + و بدون چرخ‌دنده

### 9. لاگ

- CMS: Winston → `storage/logs/cms.log` (rotate 14 روز)
- Module: stdout/stderr → `/var/log/modulehub/modules/<id>.log`
- Panel: آخرین N خط (پیش‌فرض 50 از `logViewerMaxLines`)

### 10. فازبندی پیاده‌سازی

| فاز | مدت | محتوا |
|-----|-----|-------|
| 0 | 1 روز | infra: dirs, systemd, nginx, network toggler |
| 1 | 2 روز | cms-core + home-layout + admin-frontend (read-only) |
| 2 | 3 روز | module-upload-wizard |
| 3 | 3 روز | module-runtime (static, backend, docker, proxy, limits) |
| 4 | 2 روز | package-cache |
| 5 | 3 روز | module-management (gear dialog) |
| 6 | 2 روز | backup-restore |
| 7 | 2 روز | versioning + log improvements |
| 7.5 | 2 روز | system-settings |
| 8 | 3 روز | integration tests + deploy |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| OOM Kill ماژول | status=crashed، لاگ، افزایش RAM در settings |
| Base path اشتباه Static/SPA | docs/developer-guide + wizard hint |
| dual-WAN metric گیر کند | timeout + force restore در toggler |
| RAM سرور (6.8 GB) | maxConcurrentRunningModules=10 |
| ZIP بزرگ | maxZipUploadMb=200، reject 413 |
| Docker escape | cap_drop ALL, read_only, no privileged |
| عدم CSRF در فاز اول | Nginx LAN-only برای /admin — CSRF در فاز بعد |

## Migration Plan

1. Clone به `/opt/modulehub-cms`
2. `npm ci --only=production`
3. ایجاد dirs: `/var/log/modulehub/modules`, `/var/cache/modulehub/pkg`
4. Deploy systemd unit + Nginx config از `config/`
5. `systemctl enable modulehub-cms --now`
6. Import `docs/site-layout.json` نمونه به `storage/`
7. Smoke test: health, home page, admin from LAN

**Rollback:** `systemctl stop modulehub-cms` + restore Nginx backup

## Open Questions

- [ ] Auth mechanism برای admin: Basic Auth در Nginx یا session داخلی؟
- [ ] CSRF token: فاز 8 یا بعد از MVP؟
- [ ] GitHub sync: SSH key روی سرور یا HTTPS token؟
