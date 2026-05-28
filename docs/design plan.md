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
    margin-inline-start: 0;
    margin-inline-end: auto;
}

thead th,
tbody td {
    text-align: right;
    vertical-align: top;
    padding: 0.35em 0.5em;
}

table td code,
table th code {
    direction: ltr;
    unicode-bidi: embed;
    text-align: left;
    display: inline-block;
}
</style>

# ModuleHub CMS – پروپزال جامع

## سامانه‌ی مدیریت محتوای ماژولار برای سایت نقاب (decoy) با قابلیت افزودن ماژول‌های مستقل بدون تغییر در کد هسته

---

## ۱. مقدمه و هدف

ModuleHub CMS پلتفرمی است که به شما امکان می‌دهد بدون دستکاری کد اصلی سایت، بخش‌های جدید (گالری، وبلاگ آموزشی، داشبورد زنده، فروشگاه کوچک و …) را به صورت ماژول‌های مستقل اضافه کنید.  
این سیستم به‌طور ویژه برای سرور **`ash@192.168.88.50`** طراحی شده که دارای دو کارت شبکه (`ens4` فیلترشده، `enp63s0` آزاد) و نقش **نقاب (decoy)** برای سرویس `3x-ui` (VLESS Reality) را ایفا می‌کند. ترافیک کاربران عادی و مدیریت سایت از مسیر `ens4` (اینترنت داخلی/فیلترشده) عبور می‌کند و هیچ تداخلی با خروجی Xray ندارد.

**اهداف کلیدی:**
- افزودن ماژول‌های جدید از طریق آپلود فایل ZIP و پاسخ به چند سؤال ساده (بدون نیاز به دستنویس `manifest.json`).
- مدیریت متمرکز ماژول‌ها (شروع، توقف، حذف، محدودیت منابع، نمایش لاگ، پشتیبان‌گیری).
- قابلیت **پوشه‌های مجازی** برای دسته‌بندی (فقط در JSON).
- **کش پکیج** برای کاهش حجم آپلود و نصب سریع‌تر.
- **لاگ متمرکز** برای عیب‌یابی.
- **پشتیبان‌گیری و بازیابی** کامل از تمام ماژول‌ها و تنظیمات.
- **نسخه‌گذاری ماژول‌ها** (semantic versioning).
- **تنظیمات سراسری ادمین** (`/admin/settings`) — محدودیت ZIP، پورت خودکار، رابط شبکه.
- **احراز هویت Session** — Super Admin از اینترنت/LAN با login؛ CSRF + rate limit.
- **Module Manager** — رمز جدا per-module برای مدیریت محدود همان ماژول.
- **محدودیت منابع** (CPU, RAM, Swap, Disk I/O, Network Bandwidth) با استفاده از قابلیت‌های بومی لینوکس (cgroups, systemd, Docker, tc).
- **عدم وجود API عمومی** – endpointهای مدیریت فقط با Session معتبر Super Admin یا Module Manager.

---

## ۲. معماری کلی

```
[کاربر اینترنت/LAN] ← (443) Nginx → reverse proxy → ModuleHub CMS (127.0.0.1:4000)
                                    │
                                    ├─ /              → صفحه عمومی (کارت‌ها)
                                    ├─ /admin/login   → Super Admin (Session)
                                    └─ /admin/*       → محافظت Session در CMS (نه IP در Nginx)
[Super Admin] ← login از اینترنت/LAN → session cookie → همه عملیات CMS
[Module Manager] ← رمز ماژول → session محدود moduleId → start/stop/log همان ماژول
[SSH] ← cli.js روی سرور
```

**مؤلفه‌ها:**

| جزء | فناوری | توضیح |
|------|--------|-------|
| هسته CMS | Node.js 20 + Express | صفحه اصلی، پنل مدیریت، پروکسی ماژول‌ها |
| ذخیره‌سازی | `site-layout.json` + `storage/system-settings.json` | بدون دیتابیس خارجی |
| اجرای ماژول‌ها | `systemd-run` (برای ماژول‌های غیر Docker) / `docker run` (برای ماژول‌های Dockerized) | محدودیت منابع توسط cgroups |
| وب سرور | Nginx 1.28 | reverse proxy؛ HTTPS اجباری؛ auth در لایه CMS |
| احراز هویت | express-session + bcrypt | Super Admin session؛ Module Manager scoped session |
| لاگ | Winston + فایل | هر ماژول لاگ جداگانه در `/var/log/modulehub/modules/` |
| کش پکیج | `hash‑based cache` در `/var/cache/modulehub/pkg/` | کاهش آپلود و نصب سریع |
| پشتیبان‌گیری | اسکریپت داخلی (ZIP از کل وضعیت) | قابلیت بازیابی یکپارچه |

---

## ۳. ساختار دایرکتوری و فایل‌ها روی سرور

> **توجه (فاز ۰–۴):** کد واقعی هسته در `core/src/modules/` (TypeScript، compile → `dist/`) است. درخت زیر **نمای کلی** است؛ ماژول کش: `core/src/modules/package-cache/`.

```bash
/opt/modulehub-cms/
├── core/                     # کد هسته (Express، روتینگ، مدیریت ماژول)
│   ├── server.js
│   ├── module-manager.js
│   ├── resource-limiter.js
│   ├── cache-manager.js
│   ├── backup-restore.js
│   └── logger.js
├── public/                   # فایل‌های استاتیک فرانت‌اند (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   ├── dashboard.js
│   └── dialog.js
├── standalone-modules/       # پوشه هر ماژول نصب شده (محتوای ZIP استخراج شده)
│   └── <module-id>/
│       ├── module.json       # تنظیمات محلی ماژول (نسخه، وضعیت، منابع)
│       └── ... (فایل‌های پروژه)
├── storage/
│   ├── site-layout.json      # درخت پوشه‌ها + تنظیمات ماژول‌ها (+ managementPasswordHash)
│   ├── system-settings.json  # تنظیمات سراسری + auth (session TTL, rate limit)
│   ├── admin-users.json      # hash رمز Super Admin (یا env: ADMIN_PASSWORD_HASH)
│   ├── logs/                 # لاگ هسته CMS (cms.log)
│   └── backups/              # فایل‌های پشتیبان (ZIP)
├── thumbnails/               # تصاویر کارت ماژول‌ها
└── scripts/                  # ابزارهای خط فرمان و کمکی
    ├── cli.js
    ├── network-metric-toggler.py
    └── setup_net_limit.sh

/var/cache/modulehub/pkg/     # کش پکیج‌های هش‌شده (<hash>/)
/var/log/modulehub/modules/   # لاگ‌های جداگانه هر ماژول (<module-id>.log)
/etc/nginx/sites-available/haderbash.ir   # تنظیمات Nginx
/etc/systemd/system/modulehub-cms.service # سرویس هسته
```

---

## ۴. روند نصب و راه‌اندازی برای توسعه‌دهنده و ادمین

### ۴.۱ پیش‌نیازهای سرور (از قبل مهیا است)
- Ubuntu 22.04+ (کرنل 7.0+)
- Node.js 20, npm, Docker, Nginx, systemd, git, curl
- دسترسی به اینترنت آزاد (موقت) برای `docker pull` و `npm install` از طریق اسکریپت `network-metric-toggler`

### ۴.۲ نصب هسته CMS

راهنمای کامل deploy روزانه: **`docs/dev-workflow.md`**

```bash
git clone https://github.com/alishafiee1/ModuleHub-cms.git /opt/modulehub-cms
cd /opt/modulehub-cms
cp .env.example .env   # SESSION_SECRET و ADMIN_PASSWORD_HASH
chmod +x scripts/deploy-on-server.sh
./scripts/deploy-on-server.sh
```

### ۴.۳ تنظیم Nginx (فایل `haderbash.ir`)

> **تغییر:** محدودیت IP از Nginx حذف می‌شود — امنیت `/admin` در CMS با Session (سطح ۲).

```nginx
server {
    listen 443 ssl http2;
    server_name haderbash.ir;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ... SSL و decoy برای Reality روی 8443
}
```

### ۴.۴ ابزار خط فرمان (برای مدیریت مستقیم روی سرور)
```bash
cd /opt/modulehub-cms
node scripts/cli.js --help
# مثال: node scripts/cli.js list
# node scripts/cli.js backup --output /backups/full-$(date +%F).zip
```

---

## ۵. نحوه اضافه کردن ماژول توسط ادمین (بدون کدنویسی)

1. وارد شوید: `https://haderbash.ir/admin/login` (از اینترنت یا LAN).
2. در صفحه اصلی (بعد از login)، کارت **➕** را ببینید.
3. گزینه **«آپلود ZIP»** را انتخاب کنید.
4. فایل ZIP پروژه خود را آپلود کنید (می‌تواند شامل هر نوع محتوای وب یا اپلیکیشن باشد).
5. در سه مرحله ساده اطلاعات را وارد کنید:

   | مرحله | پرسش‌ها |
   |-------|----------|
   | 1 | اجرا در Docker؟ (بله/خیر) – **پورت داخلی** (یا خالی → تخصیص خودکار ۴۱۰۰–۴۹۹۹) – دسترسی‌های شبکه/حجم |
   | 2 | انتخاب آیکون (کتابخانه ۱۲ تایی یا سفارشی) – آپلود تصویر کارت |
   | 3 | تعیین محدودیت منابع: CPU (۰.۱ تا ۲ هسته)، RAM (۱۲۸ تا ۴۰۹۶ MB)، Swap، Disk IOPS، Network Mbps |

   > **پورت داخلی:** Static/SPA → خالی (بدون پروسه). Backend/Docker → عدد یا خالی برای تخصیص ۴۱۰۰–۴۹۹۹. مرجع: `module-hosting-guide.md` §۱.

6. سیستم به‌طور خودکار:
   - فایل‌ها را در `standalone-modules/<new-id>/` استخراج می‌کند.
   - فایل‌های وابستگی (`package.json`, `requirements.txt`) را تشخیص می‌دهد.
   - با استفاده از کش پکیج (اگر هش مشابه وجود داشته باشد) وابستگی‌ها را نصب می‌کند.
   - بر اساس نوع اجرا (Docker یا systemd-run) ماژول را راه‌اندازی می‌کند.
   - کارت جدید را در صفحه اصلی (در پوشه جاری) نمایش می‌دهد.

---

## ۵.۵ انواع ماژول و چالش‌های میزبانی

مرجع کامل: **`docs/module-hosting-guide.md`**

خلاصه:
- **Static / SPA (`dist/`)** — بدون پروسه، بدون پورت؛ CMS از `standalone-modules/<id>/` با prefix `/modules/<id>/` سرو می‌کند.
- **Backend** — `systemd-run` + پروکسی به پورت؛ وابستگی via کش.
- **Docker** — `docker run` + محدودیت cgroups.
- چالش‌های اصلی سرور: **base path**، RAM/OOM، سقف پورت، persistence/DB (فاز بعد)، bind CMS روی `127.0.0.1`.

> «کتابخانه ماژول» در proposal — **فاز بعد**؛ فعلاً فقط ZIP.

---

## ۶. مدیریت روزمره ماژول‌ها (چرخ‌دنده ⚙)

با کلیک روی چرخ‌دنده هر کارت (فقط ادمین) امکانات زیر در یک دیالوو مدرن ارائه می‌شود:

**وضعیت ماژول** (`status` در `site-layout.json`):

| وضعیت | معنی | اقدام پیشنهادی |
|-------|------|----------------|
| `running` | ماژول در حال اجراست | — |
| `stopped` | توسط ادمین متوقف شده | Start |
| `crashed` | OOM Kill یا خطای داخلی | مشاهده لاگ، افزایش RAM، Start مجدد |

- **Start / Stop / Restart** ماژول
- **مشاهده لاگ** (آخرین ۵۰ خط، دانلود فایل کامل)
- **ویرایش تنظیمات** (منابع، آیکون، تصویر، پورت، دسترسی‌ها)
- **همگام‌سازی از GitHub** (اگر مخزن ثبت شده باشد: `git pull` و نصب وابستگی‌های جدید)
- **به‌روزرسانی نسخه** (شماره نسخه ماژول را تغییر می‌دهد)
- **پشتیبان‌گیری از ماژول** (دانلود ZIP از پوشه ماژول + تنظیمات)
- **حذف ماژول** (توقف فرآیند، حذف پوشه و رکورد از JSON) — **فقط Super Admin**

---

## ۶.۵ احراز هویت و سطوح دسترسی (Session + Module Manager)

**سطح انتخاب‌شده:** سطح ۲ — Session Login در CMS (پایه production).

### نقش‌ها

| نقش | ورود | محدوده | ذخیره |
|-----|------|--------|-------|
| **Super Admin** | `POST /admin/login` — username + password | همه `/admin/*` | `storage/admin-users.json` یا `ADMIN_PASSWORD_HASH` در env |
| **Module Manager** | `POST /admin/module/:id/auth` — رمز ماژول | فقط `moduleId` مشخص | `managementPasswordHash` در `site-layout.json` |
| **کاربر عادی** | بدون login | `/` و `/modules/<id>/` | — |

### Super Admin — Session

| مورد | مقدار / روش |
|------|-------------|
| Hash رمز | bcrypt cost ≥ 12 |
| Session | `express-session` — cookie `HttpOnly`, `Secure`, `SameSite=Strict` |
| TTL | `sessionTtlHours` از system-settings (پیش‌فرض ۸) |
| Rate limit login | `loginRateLimitPerMinute` (پیش‌فرض ۵) — express-rate-limit |
| CSRF | token در همه فرم‌های POST admin |
| Logout | `POST /admin/logout` — invalidate session |

**Endpointهای Super Admin-only:**

| مسیر | عمل |
|------|-----|
| `POST /admin/upload` | آپلود ZIP |
| `POST /admin/folder` | پوشه مجازی |
| `GET/POST /admin/settings` | تنظیمات سراسری |
| `POST /admin/backup`, `POST /admin/restore` | backup/restore کامل |
| `DELETE /admin/module/:id` | حذف ماژول |
| تنظیم/reset `managementPasswordHash` | در edit ماژول |

### Module Manager — رمز per-module

**فیلدهای schema در `site-layout.json` → `modules.<id>`:**

| فیلد | نوع | توضیح |
|------|-----|-------|
| `managementPasswordHash` | string | bcrypt hash؛ خالی = فقط Super Admin |
| `managementPermissions` | string[] | پیش‌فرض: `["start","stop","logs","edit"]` |

**جریان:**

1. کلیک ⚙ → اگر Super Admin session فعال → دیالوگ کامل.
2. اگر session نیست و `managementPasswordHash` تنظیم شده → SweetAlert رمز.
3. `POST /admin/module/:id/auth` → session scoped با `scope: "module-manager"`, `moduleId`.
4. TTL: `moduleManagerSessionTtlHours` (پیش‌فرض ۴).
5. Rate limit: `modulePasswordMaxAttempts` (۵) → lockout `modulePasswordLockoutMinutes` (۱۵).

**Module Manager مجاز / ممنوع:**

| عمل | Module Manager | Super Admin |
|-----|----------------|-------------|
| Start / Stop / Restart | ✅ | ✅ |
| View logs | ✅ | ✅ |
| Edit resources (نه رمز) | ✅ | ✅ |
| Module backup (تکی) | ✅ | ✅ |
| Delete module | ❌ | ✅ |
| `/admin/settings` | ❌ | ✅ |
| Add wizard / پوشه | ❌ | ✅ |
| تغییر `managementPasswordHash` | ❌ | ✅ |

### Middleware

```
request → session parser
       → if path starts /admin (except /admin/login, /admin/module/:id/auth)
       →   require superAdminSession OR moduleManagerSession matching :id
       → CSRF check on POST/PUT/DELETE
       → handler
```

### امنیت

- HTTPS اجباری (Nginx TLS)
- هرگز plaintext password در JSON یا log
- `managementPasswordHash` در backup ZIP — محافظت backup مثل secret
- Session secret از `SESSION_SECRET` env

---

## ۷. محدودیت منابع (Resource Limiting) – جزئیات پیاده‌سازی

| منبع | روش اعمال | ابزار | حد مجاز مثال |
|-------|-----------|-------|---------------|
| CPU | سهم نسبی | `systemd-run --scope -p CPUQuota=50%` / `docker run --cpus=0.5` | ۰.۵ هسته |
| RAM | حد سخت (hard limit) | `-p MemoryMax=512M` / `--memory=512m` | ۵۱۲ MB |
| Swap | محدودیت مجموع | `-p MemorySwapMax=128M` / `--memory-swap=640m` | ۱۲۸ MB |
| Disk I/O | اولویت (weight) | `-p IOWeight=50` / `--blkio-weight=500` | وزن ۵۰ (نسبی) |
| Network Bandwidth | توکن بکت با `tc` | اسکریپت `setup_net_limit.sh` (برای هر کانتینر) | ۱۰ Mbps |

> **نکته:** محدودیت شبکه برای ماژول‌های غیر Docker در فاز اول به دلیل پیچیدگی بیشتر پیاده‌سازی نشده و فقط از طریق اطلاع‌رسانی به ادمین رعایت می‌شود. برای Dockerized با استفاده از `tc` روی اینترفیس مجازی کانتینر اعمال می‌گردد.

---

## ۸. کش پکیج متمرکز (Package Cache)

**هدف:** جلوگیری از نصب تکراری وابستگی‌های حجیم بین ماژول‌های مختلف.

**پیاده‌سازی (فاز ۴ — `core/src/modules/package-cache/`):**

| مرحله | رفتار |
|--------|--------|
| trigger | بلافاصله بعد از استخراج ZIP در `POST /admin/upload` — قبل از wizard |
| بدون manifest | هیچ نصب/لینکی — فقط extract (Static/HTML) |
| scan | `package.json` · `requirements.txt` · `composer.json` در **ریشه** پوشه ماژول (فایل داخل زیرپوشه zip شناسایی نمی‌شود) |
| hash | SHA256 از محتوای manifestها (ترتیب ثابت بر اساس نام فایل) |
| cache hit | symlink در ماژول: `node_modules` · `venv` · `vendor` → `/var/cache/modulehub/pkg/<hash>/` |
| cache miss | نصب داخل `<hash>/` با `network-metric-toggler.py` (رابط `packageInstallInterface`، پیش‌فرض `enp63s0`) سپس symlink |
| LRU | وقتی مجموع > `maxPackageCacheGb` (۵ GB) — حذف قدیمی‌ترین entry (`.cache-meta.json`) |
| پاسخ API | فیلد `dependencies` در JSON آپلود: `hash` · `installed` · `linkedTargets` · `message` |

**مسیرها:**

| محیط | کش |
|------|-----|
| سرور Linux | `/var/cache/modulehub/pkg/<hash>/` |
| لوکال Windows | `storage/cache/pkg/` (یا `MODULEHUB_PACKAGE_CACHE_DIR`) |
| لاگ ماژول (لوکال dev) | `storage/logs/modules/` اگر `MODULEHUB_MODULE_LOG_DIR` unset |

**npm تحت systemd:** سرویس CMS معمولاً nvm در PATH ندارد — `resolveNpmExecutablePath()` از `~/.nvm/versions/node/v*/bin/npm` یا env `MODULEHUB_NPM_PATH`.

**اسکریپت smoke:** `scripts/test-package-cache-manual.sh` — ZIP باید manifest در ریشه archive باشد (`cd mod && zip ..` نه `zip mod/`).

---

## ۹. لاگ متمرکز (Centralized Logging)

- **لاگ هسته CMS:** در `/opt/modulehub-cms/storage/logs/cms.log` با چرخش روزانه (نگهداری ۱۴ روز).
- **لاگ هر ماژول:** در `/var/log/modulehub/modules/<module-id>.log`.  
  خروجی `stdout` و `stderr` ماژول به این فایل هدایت می‌شود (از طریق `StandardOutput=append:` در systemd یا `--log-driver=local` در Docker).
- در پنل ادمین، آخرین ۵۰ خط هر ماژول قابل مشاهده است و می‌توان کل فایل را دانلود کرد.

---

## ۱۰. تنظیمات سراسری (پنل ادمین)

صفحه **`/admin/settings`** — فقط ادمین اصلی — مقادیر در `storage/system-settings.json` ذخیره می‌شوند. نمونه: `docs/system-settings.example.json`.

| تنظیم | پیش‌فرض | توضیح |
|-------|---------|-------|
| **حداکثر حجم ZIP آپلود** | ۲۰۰ MB | فایل بزرگ‌تر → خطای 413 |
| **محدوده پورت خودکار** | ۴۱۰۰–۴۹۹۹ | وقتی پورت داخلی خالی است |
| **منابع پیش‌فرض ماژول جدید** | CPU ۰.۵ / RAM ۵۱۲ MB | مقدار اولیه Add wizard |
| **حداکثر ماژول running همزمان** | ۱۰ | جلوگیری از اشباع RAM |
| **نگهداری لاگ (روز)** | ۱۴ | logrotate |
| **حداکثر حجم کش پکیج** | ۵ GB | LRU |
| **مهلت نصب وابستگی (ثانیه)** | ۶۰۰ | timeout npm/pip |
| **ری‌استارت خودکار پس از crash** | خاموش | حداکثر ۳ بار/ساعت |
| **پاک‌سازی ZIP موقت** | ۲۴ ساعت | `/tmp/modulehub-upload/` |
| **رابط شبکه برای نصب پکیج** | `enp63s0` | موقت — npm/docker/git |
| **حداکثر خطوط لاگ در پنل** | ۵۰ | دیالوگ چرخ‌دنده |
| **مدت Session Super Admin (ساعت)** | ۸ | `sessionTtlHours` |
| **حداکثر تلاش login در دقیقه** | ۵ | `loginRateLimitPerMinute` |
| **مدت Session Module Manager (ساعت)** | ۴ | `moduleManagerSessionTtlHours` |
| **حداکثر تلاش رمز ماژول** | ۵ | قبل از lockout |
| **مدت lockout رمز ماژول (دقیقه)** | ۱۵ | `modulePasswordLockoutMinutes` |

**رادیو باکس رابط شبکه** (فقط ≥۲ NIC فعال): لیست از `ip -o link show up` — انتخاب رابط برای عملیات نصب. CMS با `network-metric-toggler` موقتاً metric را عوض و **restore** می‌کند. مسیر دائمی Ubuntu از پنل وب عوض **نمی‌شود** (ریسک dual-WAN / Xray).

---

## ۱۱. پشتیبان‌گیری و بازیابی (Backup & Restore) — ✅ فاز ۶

**بکاپ کامل (کل CMS):** API + CLI — **بدون دکمه در UI** (تا فاز بعدی). بکاپ **تکی ماژول:** `GET /admin/module/:id/backup` از دیالوگ ⚙.

| متد | مسیر | توضیح |
|-----|------|--------|
| POST | `/admin/backup` | ZIP در `storage/backups/modulehub-full-<timestamp>.zip` |
| GET | `/admin/backup/list` | لیست نام فایل‌ها (جدیدترین اول) |
| GET | `/admin/backup/download/:fileName` | دانلود |
| POST | `/admin/restore` | multipart `backup` + `confirm=true` · قبلش `modulehub-pre-restore-*.zip` |
| CLI | `node scripts/cli.js backup --output <path>` | همان ZIP کامل |

**محتوای ZIP کامل:** `backup-manifest.json` · `site-layout.json` · `system-settings.json` · `standalone-modules/` · `thumbnails/` (لاگ‌ها داخل ZIP نیستند).

**restore:** ماژول‌های `running` قبل از overwrite متوقف می‌شوند · سپس extract و جایگزینی · در صورت نیاز `systemctl restart modulehub-cms`.

---

## ۱۲. نسخه‌گذاری ماژول‌ها (Versioning)

- هر ماژول در `site-layout.json` دارای فیلد `version` (مطابق Semantic Versioning 2.0.0) و `changelog` اختیاری است.
- در زمان ایجاد ماژول، نسخه `1.0.0` اختصاص می‌یابد.
- ادمین از طریق دیالوگ چرخ‌دنده می‌تواند نسخه را به‌روز کند (مثلاً 1.1.0) و علت را در `changelog` وارد کند.
- همگام‌سازی از GitHub اگر مخزن تگ‌های نسخه داشته باشد، می‌تواند به‌طور خودکار نسخه را به‌روز کند.

---

## ۱۳. قوانین کدنویسی و مستندسازی (Code Standards & Documentation)

### ۱۳.۱ قوانین کدنویسی برای هسته CMS (Node.js + TypeScript)

**TypeScript + JSDoc** — جدول کامل: `docs/code-rolls.md`

| قانون | جزئیات |
|--------|--------|
| TypeScript | `core/src/` — بدون `any` |
| JSDoc | هر `export function` — `@param` + `@returns` |
| ESLint | Airbnb — `npm run lint` پایان هر فاز |
| نام‌گذاری | فایل `kebab-case`، متغیر/تابع `camelCase` |
| حجم | فایل ≤۳۰۰ خط، تابع ≤۴۰ خط |
| async | `async/await` به‌جای callback |
| خطا | `try/catch` + logger |

### ۱۳.۲ قوانین برای فرانت‌اند (HTML/CSS/JS)
- استفاده از **BEM** برای نام‌گذاری کلاس‌های CSS.
- رعایت تضاد رنگ‌ها (قابل استفاده در دارک/لایت مود).
- تمام فرم‌های admin با **CSRF token** محافظت می‌شوند (فاز ۸ — auth).

### ۱۳.۳ نقش فایل‌های docs (برای AI)

قواعد کامل: **`docs/ai-doc-guide.md`**

| فایل | نقش |
|------|-----|
| `proposal.md` | روایی — چالش و راه‌حل برای انسان |
| `design plan.md` | فنی — جدول، مسیر، API داخلی |
| `tasks.md` | چک‌لیست — فقط تسک و تست |
| `system-settings.example.json` | پیش‌فرض‌های واقعی — منبع عدد |
| `site-layout.json` | نمونه schema ماژول |
| `server condition.md` | وضعیت زنده سرور — به‌روز دستی |
| `module-hosting-guide.md` | Static vs Backend vs Docker — چالش سرور |
| `developer-guide.md` | ZIP ماژول، wizard، base path — v0 spec |
| `dev-workflow.md` | لوکال → git push → deploy روی سرور |
| `code-rolls.md` | قواعد کد برای AI |

**AI معمولاً این‌ها را رعایت نمی‌کند — ممنوع:**
- جدول/عدد فنی در `proposal.md` (→ `design plan.md`)
- مسیر کش/لاگ زیر `storage/` (→ `/var/cache/modulehub/` و `/var/log/modulehub/`)
- تغییر دائمی `default route` از پنل (→ فقط metric موقت + restore)
- حدس زدن پیش‌فرض تنظیمات (→ `system-settings.example.json`)
- داستان و تشبیه در `design plan.md` / `tasks.md`

### ۱۳.۴ ساختار مخزن Git (اصلی)
```
modulehub-cms/
├── .github/            (قالب issue, PR)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── package.json
├── README.md
├── docs/               (همه مستندات)
├── core/               (کد هسته)
├── public/             (frontend)
├── scripts/            (ابزارهای کمکی)
├── tests/              (تست‌های واحد و یکپارچگی)
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── Dockerfile (اختیاری برای توسعه)
```

---

## ۱۴. برنامه زمان‌بندی پیشنهادی پیاده‌سازی (۷ هفته)

| هفته | فعالیت |
|-------|--------|
| ۱ | آماده‌سازی زیرساخت، دایرکتوری‌ها، سرویس systemd، Nginx، اسکریپت network‑metric‑toggler |
| ۲ | پیاده‌سازی درخت پوشه‌های مجازی (JSON, breadcrumb, frontend) |
| ۳ | Add wizard (آپلود، سه سؤال، دیالوگ منابع/آیکون، ذخیره در JSON) |
| ۴ | مدیریت ماژول (چرخ‌دنده: start/stop, log viewer, edit, delete) + پشتیبان اولیه |
| ۴.۵ | صفحه تنظیمات سراسری، `system-settings.json`، رادیو رابط شبکه |
| ۴.۶ | **احراز هویت:** Session Super Admin + Module Manager password |
| ۵ | کش پکیج، محدودیت منابع کامل (CPU, RAM, Disk I/O, Network) |
| ۶ | نسخه‌گذاری، همگام‌سازی GitHub، بهبود لاگ متمرکز |
| ۷ | تست (سناریوهای جدول‌شده)، نوشتن مستندات، استقرار نهایی روی سرور |

---

## ۱۵. جمع‌بندی

ModuleHub CMS پلتفرمی است که **امنیت، جداسازی، و سهولت توسعه** را با هم ترکیب می‌کند. با حذف API خارجی و استفاده از مکانیزم‌های بومی لینوکس، هم به عنوان یک سایت نقاب مطمئن برای 3x-ui عمل می‌کند و هم به شما قدرت افزودن هر نوع محتوای وب را بدون دخالت در کد اصلی می‌دهد.

**مزایای کلیدی:**
- ✓ بدون تغییر در کد هسته
- ✓ پشتیبانی از انواع ماژول‌ها (Static, SPA, Backend, Dockerized)
- ✓ محدودیت دقیق منابع (CPU, RAM, I/O, Network)
- ✓ کش پکیج برای نصب سریع
- ✓ پشتیبان‌گیری و بازیابی یکپارچه
- ✓ مستندات کامل و قوانین کدنویسی شفاف
- ✓ احراز هویت Session — Super Admin از اینترنت + Module Manager per-module
- ✓ عدم API عمومی بدون session — مدیریت با login یا رمز ماژول

**آماده برای پیاده‌سازی فاز صفر.**