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

# چک‌لیست پیاده‌سازی و تست ModuleHub CMS

## فاز ۰: آماده‌سازی زیرساخت (۱ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 0.1 | ایجاد دایرکتوری‌ها | `mkdir -p /opt/modulehub-cms/{core,public,standalone-modules,storage/{logs,backups},thumbnails,scripts}`<br>`mkdir -p /var/log/modulehub/modules`<br>`mkdir -p /var/cache/modulehub/pkg` | دایرکتوری‌ها با مالکیت `ash:ash` ایجاد شوند | `ls -la /opt/modulehub-cms` و `ls /var/cache/modulehub/pkg` |
| 0.2 | کپی سرویس systemd | کپی `modulehub-cms.service` به `/etc/systemd/system/` | فایل با محتوای صحیح وجود داشته باشد | `cat /etc/systemd/system/modulehub-cms.service` |
| 0.3 | نصب وابستگی‌های Node.js | `npm init -y && npm install express multer adm-zip winston fs-extra` | فایل `package.json` و `node_modules` | `npm list --depth=0` |
| 0.4 | راه‌اندازی سرویس | `systemctl daemon-reload && systemctl enable modulehub-cms --now` | سرویس active (running) | `systemctl status modulehub-cms` |
| 0.5 | تنظیم Nginx | اضافه کردن `location /admin` با محدودیت IP به `haderbash.ir` | Nginx syntax ok, reload | `nginx -t && curl -I https://haderbash.ir/admin` از LAN و WAN |
| 0.6 | تست connectivity از ens4 و enp63s0 | اجرای `curl --interface ens4 https://google.com` و `curl --interface enp63s0 https://github.com` | هر دو پاسخ ۲۰۰ (ens4 محدودیت دارد ولی google کار می‌کند) | مشاهده خروجی curl |

---

## فاز ۱: هسته اولیه و صفحه اصلی (۲ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 1.1 | ایجاد `server.js` | Express server listening on `127.0.0.1:4000` | سرور بدون خطا بالا بیاید | `curl http://localhost:4000/health` → 200 |
| 1.2 | سرویس `site-layout.json` اولیه | ساختار درختی با root folder و ۲ ماژول نمونه | فایل در `/opt/modulehub-cms/storage/site-layout.json` با فرمت صحیح | `jq . storage/site-layout.json` |
| 1.3 | صفحه اصلی (frontend) | نمایش کارت‌ها از روی JSON با HTML/CSS ساده | صفحه در مرورگر با کارت‌های نمونه دیده شود | باز کردن `http://localhost:4000` |
| 1.4 | مسیریابی پوشه‌ها | کلیک روی کارت پوشه → تغییر view و breadcrumb | breadcrumb به‌روز شود، محتویات پوشه جدید نشان داده شود | تست با ۲ سطح پوشه |
| 1.5 | تست لاگ اولیه | ثبت درخواست‌ها در `storage/logs/cms.log` | فایل لاگ ایجاد شود و شامل رکوردهای درخواست باشد | `tail -f storage/logs/cms.log` |

---

## فاز ۲: Add wizard – آپلود ZIP و مراحل اولیه (۳ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 2.1 | فرم آپلود ZIP | endpoint POST `/admin/upload` با multer — حداکثر حجم از `system-settings.json` (پیش‌فرض ۲۰۰ MB) | فایل در `/tmp/modulehub-upload/` ذخیره شود؛ ZIP >200MB → 413 | ارسال zip کوچک و zip بزرگ‌تر از حد |
| 2.2 | استخراج ZIP | استخراج به `standalone-modules/<generated-id>/` | پوشه ماژول ایجاد شود، فایل‌ها در جای خود | `ls standalone-modules/<id>` |
| 2.3 | مرحله اول سوالات (Docker/Port/Permissions) | پورت خالی → تخصیص خودکار از ۴۱۰۰–۴۹۹۹ | پورت در `site-layout.json` ذخیره شود | بررسی network tab و `jq '.modules["<id>"].port'` |
| 2.4 | مرحله دوم (منابع و آیکون) | نمایش اسلایدرها، کتابخانه آیکون، آپلود تصویر | مقادیر دریافت و به `site-layout.json` اضافه شوند | `jq '.modules["<id>"]' storage/site-layout.json` |
| 2.5 | ذخیره نهایی ماژول | ثبت در `site-layout.json` و نمایش کارت | کارت جدید در صفحه اصلی ظاهر شود | باز کردن frontend |
| 2.6 | تست خطای آپلود | آپلود فایل غیر ZIP، آپلود بدون فایل | پیام خطای مناسب نمایش داده شود | تلاش با فایل متن ساده |

---

## فاز ۳: اجرای ماژول (systemd-run و Docker) (۳ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 3.1 | اجرای ماژول غیر Docker با systemd-run | دستور `systemd-run --user --scope -p CPUQuota=50% -p MemoryMax=512M -p IOWeight=50 bash -c "node index.js"` | پروسه در background اجرا شود، پورت ماژول (۴۱۰۰–۴۹۹۹ یا دستی) باز شود | `ps aux \| grep node` و `ss -tulpn \| grep <port>` |
| 3.2 | اجرای ماژول Dockerized | `docker run -d --cpus=0.5 --memory=512m --blkio-weight=500 --name module-<id> -p <host-port>:<container-port> ...` | کانتینر running | `docker ps --filter name=module-` |
| 3.3 | پروکسی معکوس توسط CMS | اضافه کردن route `/modules/<id>` به پورت ماژول در Express | درخواست به `/modules/<id>` به ماژول هدایت شود | `curl http://localhost:4000/modules/<id>/` |
| 3.4 | توقف ماژول | `systemctl --user stop scope-...` یا `docker stop` | ماژول از حالت running خارج شود | وضعیت در پنل ادمین «stopped» |
| 3.5 | تست محدودیت RAM | ماژول تستی که حافظه مصرف می‌کند (malloc loop) | ماژول پس از عبور از حد kill شود، وضعیت «crashed» | مشاهده لاگ و وضعیت |
| 3.6 | تست محدودیت CPU | ماژول با محاسبات فشرده (prime numbers) | مصرف CPU بالاتر از حد نرود (کندتر اجرا شود) | `top` در حین اجرا |

---

## فاز ۴: کش پکیج متمرکز (۲ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 4.1 | شناسایی فایل وابستگی | اسکن پوشه ماژول برای `package.json`, `requirements.txt`, `composer.json` | لیست فایل‌ها شناسایی شود | لاگ دیباگ |
| 4.2 | محاسبه هش SHA256 | از محتویات فایل(ها) | هش یکتا ایجاد شود | `sha256sum file` مقایسه شود |
| 4.3 | بررسی کش | وجود دایرکتوری `/var/cache/modulehub/pkg/<hash>` | در صورت وجود، symbolic link ایجاد شود | `ls -la standalone-modules/<id>/node_modules` |
| 4.4 | نصب در صورت عدم وجود کش | اجرای `npm install` یا `pip install` در دایرکتوری موقت با تغییر مسیر شبکه آزاد | خروجی نصب ذخیره و لینک شود | بررسی زمان نصب (کاهش در دفعات بعد) |
| 4.5 | تست با دو ماژول مشابه | آپلود دو ماژول با `package.json` یکسان | بار دوم بدون نصب مجدد، instantly لینک شود | مقایسه زمان آپلود دوم |

---

## فاز ۵: مدیریت ماژول (چرخ‌دنده) (۳ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 5.1 | نمایش دیالوگ چرخ‌دنده | کلیک روی ⚙ → modal با گزینه‌های Start/Stop، Log، Edit، Delete، Backup، GitHub Sync | modal با دکمه‌های صحیح ظاهر شود | تست در مرورگر |
| 5.2 | Start/Stop | فراخوانی `POST /admin/module/:id/start` و `:id/stop` | وضعیت `running` / `stopped` در کارت و JSON | مشاهده badge و بررسی پروسه |
| 5.3 | نمایش badge وضعیت | `running` سبز، `stopped` خاکستری، `crashed` قرمز | سه حالت در UI و `site-layout.json` | kill پروسه → `crashed` |
| 5.4 | نمایش لاگ | خواندن آخرین N خط (پیش‌فرض ۵۰) از `/var/log/modulehub/modules/<id>.log` | لاگ در modal نمایش داده شود | تولید خطای تستی در ماژول و مشاهده |
| 5.5 | ویرایش تنظیمات | بارگذاری مقادیر فعلی در دیالوگ منابع و ذخیره مجدد | تنظیمات جدید در `site-layout.json` ذخیره شود و در صورت نیاز ماژول ری‌استارت شود | مقایسه قبل و بعد |
| 5.6 | حذف ماژول | توقف، حذف پوشه `standalone-modules/<id>`، حذف از JSON، حذف لاگ | ماژول ناپدید شود، منوها به‌روز شوند | بررسی فایل سیستم و JSON |
| 5.7 | پشتیبان از یک ماژول | دانلود ZIP از پوشه ماژول + تنظیمات آن | فایل ZIP قابل دانلود باشد | باز کردن ZIP و بررسی محتوا |
| 5.8 | همگام‌سازی GitHub | اجرای `git pull` در پوشه ماژول (اگر `gitRepo` تنظیم شده) | تغییرات کشیده شود، لاگ ثبت شود | تست با یک مخزن تستی |

---

## فاز ۶: پشتیبان‌گیری و بازیابی کامل (۲ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 6.1 | ایجاد backup کامل | فشرده‌سازی `site-layout.json`, `system-settings.json`, `standalone-modules`, `thumbnails` در یک ZIP | فایل با timestamp در `storage/backups/` | `ls storage/backups/` |
| 6.2 | بازیابی از backup | آپلود ZIP، استخراج در دایرکتوری موقت، بازنویسی فایل‌ها، ری‌استارت سرویس | همه ماژول‌ها و تنظیمات به حالت قبل برگردند | مقایسه قبل و بعد |
| 6.3 | تست بازیابی پس از حذف | یک ماژول را حذف کنید، سپس backup را restore | ماژول حذف شده برگردد و قابل اجرا باشد | بررسی لیست ماژول‌ها |

---

## فاز ۷: نسخه‌گذاری و بهبود لاگ (۲ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 7.1 | افزودن فیلد version به `site-layout.json` | هنگام ایجاد ماژول، version=1.0.0 | فیلد وجود داشته باشد | `jq '.modules["<id>"].version'` |
| 7.2 | قابلیت به‌روزرسانی نسخه | در دیالوگ چرخ‌دنده، امکان تغییر نسخه و وارد کردن changelog | نسخه در JSON تغییر کند | بررسی بعد از ذخیره |
| 7.3 | چرخش لاگ خودکار | cron daily برای `logrotate` با نگهداری ۱۴ روز | فایل‌های قدیمی حذف/فشرده شوند | `logrotate -d /etc/logrotate.d/modulehub` |
| 7.4 | نمایش لاگ با سطح (info, error, debug) | هر رویداد مهم با سطح مناسب ثبت شود | فیلتر در نمایش لاگ امکان‌پذیر است | تست با خطای عمدی |

---

## فاز ۷.۵: تنظیمات سراسری ادمین (۲ روز)

| # | وظیفه | جزئیات | خروجی مورد انتظار | روش تست |
|---|-------|--------|------------------|----------|
| 7.5.1 | صفحه `/admin/settings` | فرم تنظیمات با ذخیره در `storage/system-settings.json` | مقادیر پیش‌فرض بارگذاری و ذخیره شوند | تغییر حد ZIP و reload |
| 7.5.2 | محدودیت ZIP | multer از `maxZipUploadMb` (پیش‌فرض ۲۰۰) بخواند | ZIP بزرگ → 413 | آپلود 201MB |
| 7.5.3 | رادیو رابط شبکه | لیست NIC از سرور؛ فقط ≥۲ کارت → نمایش radio | `packageInstallInterface` ذخیره شود | npm install + بررسی metric |
| 7.5.4 | تخصیص پورت خودکار | allocator در محدوده `portRangeStart`–`portRangeEnd` | پورت آزاد بدون تداخل | نصب ۲ ماژول بدون پورت دستی |
| 7.5.5 | restore metric | پس از npm/docker/git حتماً restore | لاگ toggler موفق | قطع وسط install → restore |

---

## فاز ۸: تست یکپارچگی و استقرار نهایی (۳ روز)

| # | سناریو تست | روش تست | معیار قبولی |
|---|------------|---------|-------------|
| 8.1 | سناریوی کامل نصب ماژول | از کارت + تا نمایش کارت جدید و کلیک روی آن | ماژول اجرا شود و محتوا نمایش یابد |
| 8.2 | تست dual‑WAN برای npm install | در حین نصب ماژول با `package.json`، بررسی شود که از `enp63s0` خارج می‌شود | لاگ‌های `network-metric-toggler` تغییر metric را نشان دهند |
| 8.3 | تست محدودیت Disk I/O | ماژولی که فایل ۱۰۰MB می‌نویسد | سرعت نوشتن کمتر از حالت بدون محدودیت (با `dd` قابل مشاهده) |
| 8.4 | تست محدودیت Network | ماژول Dockerized با محدودیت 1 Mbps، دانلود فایل 5MB | زمان دانلود حدود 40 ثانیه (نه 2 ثانیه) |
| 8.5 | تست امنیت `/admin` | تلاش از IP خارج از LAN (مثلاً از VPN) | خطای 403 یا redirect |
| 8.6 | تست پشتیبان و بازیابی | backup بگیرید، کل سیستم را حذف کنید، restore کنید | همه چیز به حالت اول برگردد |
| 8.7 | تست همزمان ۵ ماژول active | راه‌اندازی ۵ ماژول با محدودیت‌های مختلف | سرور پایدار بماند، CPU و RAM در محدوده |
| 8.9 | تست تنظیمات سراسری | تغییر رابط شبکه در `/admin/settings` و نصب ماژول | npm از رابط انتخاب‌شده خارج شود، metric restore شود | لاگ network-metric-toggler |

---

## مستندات تحویل‌شده در انتهای فازها

- [ ] `README.md` – نصب و راه‌اندازی سریع
- [ ] `docs/ai-doc-guide.md` – قواعد نقش هر سند برای AI
- [ ] `docs/system-settings.example.json` – نمونه تنظیمات سراسری
- [ ] `docs/admin-guide.md` – راهنمای تصویری برای ادمین
- [ ] `docs/developer-guide.md` – ساختار ZIP، وابستگی‌ها
- [ ] `docs/backup-restore.md` – روش پشتیبان‌گیری
- [ ] `docs/network-config.md` – نحوه مدیریت dual‑WAN
- [ ] `CHANGELOG.md` – تاریخچه تغییرات هسته
- [ ] `.eslintrc.json` و `.prettierrc`
- [ ] نتایج تست‌های فاز ۸ در یک فایل `test-results.log`

---

**نکات پایانی:**
- هر تسک پس از انجام، در این چک‌لیست تیک بخورد.
- در صورت بروز خطا در تست، تسک به مرحله قبل بازگردانده شود.
- تمام تغییرات در مخزن Git با پیام استاندارد (`feat:`, `fix:`, `test:`) ثبت شود.