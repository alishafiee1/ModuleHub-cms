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

<div dir="rtl" style="text-align:right;">

# راهنمای ماژول Standalone — ModuleHub CMS

این سند برای **کسی است که می‌خواهد یک ماژول جدید بسازد و از پنل مدیریت (`/admin`) به‌صورت فایل ZIP نصب کند.**

> **Standalone** یعنی: برنامه شما داخل **Docker** اجرا می‌شود، ولی یک **صفحه معرفی (`index.html`)** روی خود سایت نمایش داده می‌شود.

---

## ۱. ماژول Standalone چیست؟

| بخش | توضیح ساده |
|-----|------------|
| **صفحه کاربر** | فایل `index.html` — مثل یک صفحه وب ساده |
| **برنامه واقعی** | داخل کانتینر Docker (Node، Python، …) |
| **نصب** | یک فایل ZIP از پنل admin |
| **اجرا** | مدیر باید دسترسی‌ها را تأیید کند و دکمه **Start** بزند |

صفحات ساده مثل «گالری» یا «مارکدان» **از ZIP نصب نمی‌شوند** — آن‌ها داخل خود پروژه (built-in) هستند.  
**فقط ماژول‌های Standalone** از پنل قابل آپلود‌اند.

---

## ۲. چه فایل‌هایی داخل ZIP لازم است؟

### اجباری (بدون این‌ها نصب رد می‌شود)

| فایل | کاربرد |
|------|--------|
| `manifest.json` | نام، نسخه، پورت‌ها، مسیر سایت |
| `index.html` | صفحه‌ای که کاربر عادی می‌بیند |
| `docker-compose.yml` | راه‌اندازی Docker (یا نام دیگری که در manifest گفته‌اید) |

### معمولاً لازم

| فایل | کاربرد |
|------|--------|
| `Dockerfile` | ساخت image برنامه |
| کد برنامه (`server.js`, `app.py`, …) | منطق اصلی ماژول |
| CSS / JS / تصاویر | ظاهر `index.html` |

### نمونه واقعی در پروژه

مسیر: `standalone-modules/demo-api/`

---

## ۳. ساختار پوشه (قبل از ZIP کردن)

```
my-module/
├── manifest.json          ← اطلاعات ماژول
├── index.html             ← صفحه landing برای کاربر
├── landing.css            ← اختیاری — استایل landing
├── docker-compose.yml     ← Docker
├── Dockerfile             ← ساخت image
├── server.js              ← برنامه داخل کانتینر
└── package.json           ← اختیاری
```

### نکته ZIP

- فایل‌ها **مستقیم در ریشه ZIP** باشند (نه داخل یک پوشه اضافه مثل `my-module/my-module/...`).
- از مسیرهای خطرناک مثل `../` استفاده نکنید.

**درست:**

```
archive.zip
├── manifest.json
├── index.html
└── docker-compose.yml
```

**غلط:**

```
archive.zip
└── my-module/
    └── manifest.json    ← هسته manifest را در ریشه ZIP پیدا نمی‌کند
```

---

## ۴. فایل `manifest.json` — به زبان ساده

```json
{
  "name": "نمایشگر دما",
  "type": "standalone",
  "version": "1.0.0",
  "icon": "thermometer.png",
  "description": "نمایش لحظه‌ای دما از سنسور",
  "author": "نام شما",
  "docker": {
    "composeFile": "docker-compose.yml",
    "ports": [3000],
    "resources": {
      "memory": "256M",
      "cpus": "0.2"
    }
  },
  "proxy": {
    "prefix": "/modules/temp-display/",
    "internalPort": 3000,
    "paths": ["api"]
  }
}
```

### توضیح فیلدها

| فیلد | اجباری | معنی |
|------|--------|------|
| `name` | بله | نام نمایشی ماژول (فارسی یا انگلیسی) |
| `type` | بله | همیشه `"standalone"` برای ZIP |
| `version` | بله | مثلاً `"1.0.0"` |
| `icon` | بله | نام فایل آیکون (یا هر رشته معتبر) |
| `description` | بله | یک خط توضیح — در کارت صفحه اصلی هم دیده می‌شود |
| `author` | خیر | نام سازنده |
| `admin_role` | خیر | فقط مدیر با این نقش می‌تواند Start/Stop بزند |
| `docker.ports` | بله | پورت‌هایی که برنامه داخل کانتینر استفاده می‌کند |
| `docker.resources` | توصیه | سقف RAM و CPU |
| `proxy.prefix` | بله | آدرس عمومی ماژول روی سایت |
| `proxy.internalPort` | بله | همان پورت داخل کانتینر (معمولاً 3000) |
| `proxy.paths` | خیر | پیش‌فرض: `["api"]` |

### شناسه ماژول (`id`) چطور ساخته می‌شود؟

از روی `name` به‌صورت خودکار ساخته می‌شود:

- `"Demo API"` → `demo-api`
- `"نمایشگر دما"` → بر اساس حروف مجاز

**پیشنهاد:** نام انگلیسی کوتاه بگذارید تا `id` و مسیر URL قابل پیش‌بینی باشد.

### مسیر `proxy.prefix`

باید شبیه این باشد:

```
/modules/<module-id>/
```

مثال: اگر id شما `demo-api` است:

```json
"prefix": "/modules/demo-api/"
```

---

## ۵. نقش `index.html` و Docker

این دو **جدا** کار می‌کنند:

```
کاربر عادی
    │
    ├─► /modules/my-module/          → index.html (روی سرور، بدون Docker)
    │
    └─► /modules/my-module/api/...   → برنامه داخل Docker (وقتی Start شده)
```

| وضعیت Docker | `index.html` | API (مثلاً `/api/health`) |
|--------------|--------------|---------------------------|
| **متوقف (Stop)** | ✅ نمایش داده می‌شود | ❌ خطای «ماژول در دسترس نیست» |
| **در حال اجرا (Start)** | ✅ | ✅ |

**پس:** در `index.html` می‌توانید بنویسید «سرویس الان خاموش است» یا دکمه «تست API» بگذارید.

### مهم — مسیر API داخل کانتینر

پیش‌فرض فقط مسیر **`api`** به Docker وصل می‌شود:

- درخواست سایت: `/modules/demo-api/api/health`
- داخل کانتینر: `/api/health`

اگر برنامه شما مسیر دیگری دارد، در manifest بنویسید:

```json
"paths": ["api", "ws"]
```

---

## ۶. فایل `docker-compose.yml` — حداقل امنیت

ModuleHub ماژول ناشناس را اجرا می‌کند؛ این تنظیمات **توصیه و اغلب اجباری** هستند:

```yaml
services:
  app:
    build: .
    ports:
      - "3000"          # فقط عدد — Docker خودش پورت host را انتخاب می‌کند
    deploy:
      resources:
        limits:
          memory: 256M
    read_only: true
    cap_drop:
      - ALL
    tmpfs:
      - /tmp
```

| تنظیم | چرا |
|-------|-----|
| `read_only: true` | کانتینر نتواند فایل سیستم را تغییر دهد |
| `cap_drop: ALL` | دسترسی‌های خطرناک Linux حذف شود |
| `ports: "3000"` | پورت تصادفی روی host — امن‌تر از bind مستقیم |
| `memory limit` | ماژول کل سرور را نخورد |

اگر `cap_drop` یا `read_only` نباشد، **هشدار** می‌گیرید (گاهی نصب ادامه پیدا می‌کند).

---

## ۷. جریان کار از دید مدیر سایت

```
۱. ZIP را در /admin آپلود کنید
        ↓
۲. هسته manifest و docker-compose را می‌خواند
        ↓
۳. پنل می‌پرسد: پورت‌ها و منابع را تأیید می‌کنید؟
   (تیک «تأیید دسترسی‌های standalone»)
        ↓
۴. ماژول نصب می‌شود — وضعیت: stopped
        ↓
۵. دکمه Approve (در صورت نیاز) → Start
        ↓
۶. Docker بالا می‌آید — دایره سبز روی homepage
        ↓
۷. پیام فایروال: «پورت X روی host باز شده — در صورت نیاز UFW را باز کنید»
```

همین کارها روی **صفحه اصلی `/`** هم (بعد از login) برای مدیر دیده می‌شود.

---

## ۸. بعد از نصب — کاربر چه می‌بیند؟

1. **صفحه اصلی `/`** — کارت ماژول با عنوان و توضیح (از `site-layout.json` + manifest)
2. **کلیک روی کارت** — رفتن به `/modules/<id>/` → `index.html`
3. **استفاده از API** — فقط وقتی مدیر ماژول را Start کرده باشد

---

## ۹. چک‌لیست قبل از آپلود

- [ ] `type` برابر `"standalone"` است
- [ ] `manifest.json` در **ریشه ZIP** است
- [ ] `index.html` در **ریشه ZIP** است
- [ ] `docker-compose.yml` وجود دارد
- [ ] `proxy.prefix` با `/modules/<id>/` هماهنگ است
- [ ] API داخل کانتینر زیر `/api/...` است (یا `paths` درست تنظیم شده)
- [ ] `cap_drop` و `read_only` در compose هست
- [ ] `ports` در manifest با پورت داخل کانتینر یکی است
- [ ] ZIP را local تست کرده‌اید: `docker compose up --build`

---

## ۱۰. خطاهای رایج

| پیام | علت | راه‌حل |
|------|-----|--------|
| `manifest.json not found` | JSON داخل زیرپوشه ZIP است | فایل‌ها را در ریشه ZIP بگذارید |
| `standalone ZIP must include index.html` | landing نیست | `index.html` اضافه کنید |
| `static module uploads are deprecated` | `type: static` | فقط `standalone` |
| `missing docker compose file` | نام فایل با manifest یکی نیست | `composeFile` را درست کنید |
| `path traversal detected` | مسیر `../` در ZIP | ZIP را تمیز کنید |
| API جواب نمی‌دهد | Docker Stop است | از admin **Start** بزنید |
| API 404 | مسیر داخل کانتینر `/health` است نه `/api/health` | مسیر را اصلاح کنید یا `paths` را عوض کنید |

---

## ۱۱. نمونه minimal (کپی و شروع)

### `manifest.json`

```json
{
  "name": "My Tool",
  "type": "standalone",
  "version": "1.0.0",
  "icon": "tool.png",
  "description": "ابزار نمونه من",
  "author": "Ali",
  "docker": {
    "composeFile": "docker-compose.yml",
    "ports": [3000],
    "resources": { "memory": "128M", "cpus": "0.2" }
  },
  "proxy": {
    "prefix": "/modules/my-tool/",
    "internalPort": 3000
  }
}
```

### `index.html` (خلاصه)

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="UTF-8" /><title>My Tool</title></head>
<body>
  <h1>My Tool</h1>
  <p><a href="/">بازگشت</a></p>
  <button onclick="fetch('/modules/my-tool/api/health').then(r=>r.json()).then(alert)">
    تست API
  </button>
</body>
</html>
```

### `server.js` (داخل Docker)

```javascript
const express = require('express');
const app = express();
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.listen(3000);
```

---

## ۱۲. مستندات مرتبط

| فایل | محتوا |
|------|--------|
| `docs/module-spec.md` | مرجع فشرده فیلدهای manifest |
| `docs/standalone-module-ai-guide.md` | قرارداد و prompt برای AI |
| `docs/public-homepage.md` | کارت‌ها در صفحه اصلی |
| `standalone-modules/demo-api/` | نمونه کامل آماده |

---

## خلاصه یک خطی

> **Standalone = ZIP شامل `manifest.json` + `index.html` + Docker؛ landing روی سایت، API داخل کانتینر؛ مدیر باید Approve و Start کند.**

</div>
