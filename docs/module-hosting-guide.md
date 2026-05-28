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

# راهنمای میزبانی ماژول — انواع سایت و چالش‌های سرور

> مخاطب: توسعه‌دهنده / AI پیاده‌ساز  
> خلاصه روایی: `proposal.md` §«تفاوت ماژول‌ها»  
> این فایل **مرجع فنی** برای انتخاب نوع ماژول و اجتناب از خطاهای رایج سرور است.

---

## ۱. انواع ماژول (تصمیم سریع)

| نوع | مثال | پورت در wizard | پروسه جدا | مسیر کاربر |
|-----|------|----------------|-----------|------------|
| **Static** | HTML/CSS/JS آماده | **خالی** | خیر | CMS فایل را از `standalone-modules/<id>/` سرو می‌کند |
| **SPA بیلدشده** | React/Vue `dist/` | **خالی** | خیر | مثل Static + fallback به `index.html` |
| **Backend** | Express, Flask, PHP-FPM+nginx داخل ماژول | **عدد** (یا خالی → ۴۱۰۰–۴۹۹۹) | بله (`systemd-run`) | پروکسی CMS → `127.0.0.1:<port>` |
| **Docker** | docker-compose.yml | پورت کانتینر | بله (`docker run`) | پروکسی CMS → host port |
| **WebSocket / SSE** | چت زنده، داشبورد realtime | بله | **ترجیحاً Docker** | پروکسی + upgrade header |

> **قانون:** پورت خودکار (۴۱۰۰–۴۹۹۹) فقط وقتی **پروسه گوش‌دهنده** لازم است — نه برای Static/SPA.

---

## ۲. ساختار ZIP پیشنهادی

```
my-site.zip
├── index.html          # اجباری برای Static/SPA
├── assets/             # css, js, images — مسیر نسبی
├── package.json        # اختیاری — فقط اگر Backend یا build لازم است
├── requirements.txt    # Python backend
├── docker-compose.yml  # اگر Docker = بله
└── Dockerfile          # اختیاری
```

**اشتباه رایج:** ZIP شامل `node_modules/` یا `.git/` — حجم بالا، امنیت پایین. فقط سورس یا `dist/`.

**نصب وابستگی:** اگر `package.json` / `requirements.txt` / `composer.json` در **ریشه** ZIP باشد، CMS **بلافاصله بعد از upload** (قبل از wizard) از npm/pip/composer نصب می‌کند یا از کش symlink می‌زند — **`node_modules` لازم نیست داخل ZIP باشد.** جزئیات: [`developer-guide.md`](developer-guide.md) §۲.۱ · [`design plan.md`](design%20plan.md) §۸.

---

## ۳. چالش‌های سرور که باید بدانید

### ۳.۱ مسیر پایه (Base path) — مهم‌ترین چالش Static/SPA

ماژول زیر **`/modules/<module-id>/`** سرو می‌شود، نه ریشه `/`.

| مشکل | علامت | راه‌حل |
|------|--------|--------|
| لینک مطلق `/assets/style.css` | CSS/JS لود نمی‌شود | از مسیر **نسبی** `./assets/` یا `assets/` استفاده کنید |
| React/Vue build | صفحه سفید | `base` / `homepage` / `VITE_BASE_URL` = `/modules/<id>/` |
| API نسبی `/api` | 404 | آدرس API را `/modules/<id>/api` یا URL کامل backend تنظیم کنید |

### ۳.۲ پورت و سقف همزمانی

- محدوده خودکار: **۴۱۰۰–۴۹۹۹** ≈ حداکثر ~۹۰۰ ماژول با پروسه (در عمل RAM زودتر پر می‌شود).
- `maxConcurrentRunningModules` پیش‌فرض **۱۰** — سقف واقعی عملیاتی.
- `EADDRINUSE`: پورت تکراری — لاگ ماژول را ببینید.

### ۳.۳ RAM و crashed

- Static/SPA: مصرف ناچیز (فقط CMS).
- Node/Python با وابستگی: ۱۲۸–۵۱۲ MB+ — OOM → `crashed`.
- Docker: `--memory` + swap limit.

### ۳.۴ دیسک و داده پایدار

| نیاز | وضعیت در docs فعلی | توصیه |
|------|---------------------|--------|
| SQLite/MySQL داخل ماژول | **توضیح داده نشده** | فایل DB داخل `standalone-modules/<id>/data/` — در backup ماژول بیاید |
| آپلود فایل کاربر | permissions «volume» مبهم | پوشه `uploads/` داخل ماژول؛ سقف دیسک کل سرور |
| لاگ و کش | `/var/log` و `/var/cache` | جدا از پوشه ماژول |

> **کمبود doc:** persistence و DB هنوز در `tasks.md` تست نشده — فاز بعدی.

### ۳.۵ شبکه dual-WAN (نصب vs اجرا)

| فاز | رابط | توضیح |
|-----|------|--------|
| **نinstall** (`npm`, `docker pull`) | `enp63s0` موقت | `network-metric-toggler` + restore |
| **سرو Static به کاربر** | از nginx/CMS | ترافیک عادی سایت |
| **Runtime outbound** (ماژول به API خارجی) | **تعریف نشده کامل** | اگر ماژول در runtime به GitHub نیاز دارد → Docker + egress یا proxy داخلی |

> **تناقض جزئی:** `proposal.md` می‌گوید «در تنظیمات هر ماژول رابط شبکه» — در `design plan` و `system-settings` فقط **نصب پکیج** global است. **رفع پیشنهادی:** runtime egress = فاز ۲ یا فقط Docker.

### ۳.۶ امنیت

- CMS روی `:4000` روی همه interfaceها (طبق `server condition.md`) — nginx LAN محدودیت `/admin` را دارد، نه کل CMS.
- ماژول PHP/Node با `eval`/shell خطرناک — محدودیت cgroups جایگزین sandbox نیست.
- Docker: `cap_drop: ALL`, `read_only` where possible (`code-rolls.md`).

### ۳.۷ موارد خاص

| تکنولوژی | پشتیبانی | نکته |
|----------|----------|------|
| WordPress / PHP | نیمه‌تعریف | نیاز PHP-FPM یا Docker؛ `composer.json` در کش |
| Next.js SSR | **مستند نشده** | نیاز Node همیشه‌روشن — Backend |
| فقط `dist/` React | Static | بدون `npm start` |
| WebSocket | Docker توصیه | پروکسی باید Upgrade را forward کند |
| Cron داخل ماژول | **مستند نشده** | systemd timer جدا یا cron سرور — خارج از scope فاز ۱ |

---

## ۴. تناقض‌های doc — وضعیت رفع

| # | تناقض | رفع |
|---|--------|-----|
| 1 | Static «بدون پورت» vs «پورت ۴۱۰۰–۴۹۹۹» | پورت خودکار **فقط Backend/Docker** — Static پورت `null` |
| 2 | `manifest.json` در archive vs «بدون manifest» | ZIP جدید: فقط wizard → `site-layout.json`؛ archive قدیمی است |
| 3 | `module.json` در پوشه vs `site-layout.json` | **منبع حقیقت:** `site-layout.json`؛ `module.json` اختیاری/کش محلی |
| 4 | «از کتابخانه» در proposal | **هنوز طراحی نشده** — فاز بعد؛ فعلاً فقط ZIP |
| 5 | TypeScript در `code-rolls` vs JS در design | هدف TypeScript؛ فاز ۰ فعلاً JS مجاز تا migrate |
| 6 | bind `127.0.0.1:4000` در tasks vs `:4000` روی سرور | **باید** 127.0.0.1 — ریسک امنیتی (تست 8.5) |

---

## ۵. چک قبل از آپلود سایت طراحی‌شده

- [ ] `index.html` در ریشه ZIP
- [ ] مسیر asset نسبی (نه `/css/...` مطلق)
- [ ] SPA: base path تنظیم شده
- [ ] Backend: `package.json` / `requirements.txt` در ریشه
- [ ] بدون `node_modules` داخل ZIP
- [ ] حجم < `maxZipUploadMb` (۲۰۰ MB)
- [ ] اگر API خارجی در runtime → Docker یا مستندسازی egress

---

## ۶. ارجاع

- پروکسی: `design plan.md` §۲، `tasks.md` فاز ۳.۳
- کش: §۸ design plan
- تنظیمات: `system-settings.example.json`
