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

# طراحی فنی استاندارد `module.json`

## معرفی کوتاه

این سند مشخص می‌کند فایل `module.json` در ماژول‌های ModuleHub-CMS چه نقشی دارد، چه اطلاعاتی باید در آن باشد، چه بخش‌هایی اجباری هستند، و سیستم در زمان نصب، اجرا و به‌روزرسانی چطور از آن استفاده می‌کند.

هدف این فایل این است که هر ماژول یک شناسنامه فنی یکدست داشته باشد؛ یعنی توسعه‌دهنده بداند چه اطلاعاتی باید تحویل بدهد و پنل هم بتواند بدون حدس زدن، ماژول را بررسی و ثبت کند.

---

## هدف‌ها

- یک قالب مشترک برای معرفی ماژول‌ها ایجاد شود.
- نصب و ثبت ماژول‌ها قابل پیش‌بینی و قابل اعتبارسنجی شود.
- مسیر نصب برای انواع مختلف ماژول از هم جدا ولی یکدست باشد.
- اطلاعات لازم برای اجرا، آپدیت و بررسی سلامت ماژول در یک فایل متمرکز شود.
- وابستگی به توضیح شفاهی یا بررسی دستی کد کاهش پیدا کند.

## خارج از محدوده این سند

- تعریف UI پنل نصب
- تعریف APIهای پنل
- تعریف ساختار داخلی سورس هر ماژول
- تعریف جزئیات Docker برای ماژول‌هایی که بعداً کانتینری می‌شوند
- جایگزینی کامل `package.json`، `requirements.txt` یا فایل‌های بومی هر زبان

---

## نقش `module.json`

`module.json` فایل شناسنامه ماژول است، نه فایل build و نه جایگزین مستندات پروژه.

این فایل باید پاسخ این سؤال‌ها را بدهد:

- این ماژول چیست؟
- چه نوعی دارد؟
- چگونه باید نصب شود؟
- چگونه باید اجرا شود؟
- به چه متغیرهای محیطی نیاز دارد؟
- آیا پورت لازم دارد یا نه؟
- سیستم برای health check چه چیزی را بررسی کند؟
- نسخه فعلی این ماژول چیست؟

---

## محل قرارگیری فایل

فایل `module.json` باید در ریشه پروژه یا ریشه بسته نصب قرار بگیرد.

نمونه:

```text
my-module/
  module.json
  package.json
  server.js
  README.md
```

---

## نسخه‌بندی خود استاندارد

برای اینکه بعداً بتوان این فرمت را بدون شکستن سازگاری گسترش داد، خود فایل باید نسخه استاندارد را هم مشخص کند.

فیلد پیشنهادی:

```json
"specVersion": "1.0"
```

---

## ساختار کلی پیشنهادی

```json
{
  "specVersion": "1.0",
  "id": "chat-service",
  "name": "Chat Service",
  "version": "1.2.0",
  "description": "Service for internal chat features",
  "category": "service",
  "type": "backend",
  "runtime": {
    "kind": "node",
    "version": ">=20"
  },
  "entry": {
    "install": "npm install",
    "build": "npm run build",
    "start": "node server.js"
  },
  "network": {
    "mode": "port",
    "port": 3200,
    "healthcheck": "/health"
  },
  "env": {
    "required": ["DB_URL", "JWT_SECRET"],
    "optional": ["LOG_LEVEL"]
  },
  "compatibility": {
    "moduleHub": ">=1.0.0"
  },
  "update": {
    "strategy": "package-replace"
  }
}
```

---

## بخش‌های اصلی فایل

### 1. هویت ماژول

این بخش برای شناسایی ماژول است.

| فیلد | اجباری | توضیح |
|---|---|---|
| `id` | بله | شناسه یکتا، کوچک، بدون فاصله، مناسب استفاده سیستمی |
| `name` | بله | نام نمایشی برای پنل |
| `version` | بله | نسخه ماژول، بهتر است SemVer باشد |
| `description` | خیر | توضیح کوتاه قابل نمایش برای ادمین |
| `category` | خیر | دسته‌بندی مثل `service`, `integration`, `tool`, `dashboard` |

### 2. نوع ماژول

این بخش مشخص می‌کند سیستم با ماژول چطور رفتار کند.

| فیلد | اجباری | مقدارهای پیشنهادی |
|---|---|---|
| `type` | بله | `static`, `spa`, `backend`, `worker`, `hybrid` |

توضیح:
- `static`: فایل‌های ساده بدون پروسه
- `spa`: فرانت‌اند build شده بدون پروسه جدا
- `backend`: سرویس دارای پروسه و معمولاً پورت
- `worker`: سرویس پس‌زمینه بدون پورت عمومی
- `hybrid`: ماژولی که هم UI دارد هم سرویس اجرایی

> در فاز فعلی تمرکز اصلی این سند روی `backend` و `worker` است.

### 3. محیط اجرا

این بخش می‌گوید ماژول با چه فناوری اصلی اجرا می‌شود.

| فیلد | اجباری | توضیح |
|---|---|---|
| `runtime.kind` | بله | مثل `node`, `python`, `php`, `dotnet`, `binary` |
| `runtime.version` | خیر | نسخه یا بازه نسخه پیشنهادی |

نکته: این بخش برای تصمیم‌گیری نصب و بررسی سازگاری مهم است، نه برای جایگزینی فایل‌های بومی هر زبان.

### 4. دستورهای اجرا

این بخش مهم‌ترین بخش برای نصب و راه‌اندازی است.

| فیلد | اجباری | توضیح |
|---|---|---|
| `entry.install` | خیر | دستور نصب وابستگی‌ها |
| `entry.build` | خیر | دستور build در صورت نیاز |
| `entry.start` | بله برای ماژول‌های پروسه‌دار | دستور start |

قانون ساده:
- برای `static` و `spa` معمولاً `start` لازم نیست.
- برای `backend`, `worker`, `hybrid` وجود `start` الزامی است.

### 5. شبکه و پورت

این بخش مشخص می‌کند آیا ماژول نیاز به پورت دارد یا نه.

| فیلد | اجباری | توضیح |
|---|---|---|
| `network.mode` | خیر | `none`, `port`, `internal` |
| `network.port` | شرطی | وقتی `mode=port` باشد لازم است |
| `network.healthcheck` | خیر | مسیر یا روش ساده بررسی سلامت |

قانون‌ها:
- `static` و `spa` باید `network.mode = "none"` داشته باشند یا اصلاً این بخش را نداشته باشند.
- `backend` معمولاً `mode = "port"` دارد.
- `worker` معمولاً `mode = "internal"` یا `none` دارد.

### 6. متغیرهای محیطی

این بخش برای شفاف‌سازی تنظیمات لازم است.

| فیلد | اجباری | توضیح |
|---|---|---|
| `env.required` | خیر | لیست متغیرهای لازم |
| `env.optional` | خیر | لیست متغیرهای اختیاری |

قانون:
- مقدار واقعی secretها داخل `module.json` قرار نمی‌گیرد.
- فقط نام متغیرها در این فایل نوشته می‌شود.

### 7. سازگاری

این بخش مشخص می‌کند ماژول با چه نسخه‌ای از CMS کار می‌کند.

| فیلد | اجباری | توضیح |
|---|---|---|
| `compatibility.moduleHub` | خیر | حداقل نسخه پشتیبانی شده CMS |

### 8. سیاست آپدیت

این بخش کمک می‌کند سیستم بداند در زمان آپدیت چه رفتاری داشته باشد.

| فیلد | اجباری | توضیح |
|---|---|---|
| `update.strategy` | خیر | مثل `package-replace`, `in-place`, `manual-review` |

---

## حداقل نسخه قابل قبول فایل

برای اینکه یک ماژول در فاز اول معتبر شناخته شود، این فیلدها باید وجود داشته باشند:

```json
{
  "specVersion": "1.0",
  "id": "example-module",
  "name": "Example Module",
  "version": "1.0.0",
  "type": "backend",
  "runtime": { "kind": "node" },
  "entry": { "start": "node server.js" }
}
```

---

## قوانین اعتبارسنجی

### اعتبارسنجی عمومی

- `id` باید یکتا باشد.
- `id` فقط شامل حروف کوچک انگلیسی، عدد و `-` باشد.
- `name` نباید خالی باشد.
- `version` نباید خالی باشد.
- `specVersion` باید نسخه‌ای شناخته‌شده باشد.

### اعتبارسنجی نوع ماژول

- اگر `type = backend` باشد، باید `entry.start` وجود داشته باشد.
- اگر `type = worker` باشد، باید `entry.start` وجود داشته باشد.
- اگر `type = static` یا `spa` باشد، نباید `network.port` اجباری شود.
- اگر `network.mode = port` باشد، مقدار `network.port` باید عدد معتبر و آزاد باشد.

### اعتبارسنجی امنیتی اولیه

- فایل نباید secret واقعی داخل خودش داشته باشد.
- دستورهای install/build/start نباید خالی و مبهم باشند.
- مسیرهای حساس سیستم نباید در این فایل hardcode شوند.

---

## رفتار سیستم در زمان نصب

### مرحله 1: خواندن فایل

سیستم ابتدا `module.json` را از ریشه بسته نصب یا پروژه می‌خواند.

### مرحله 2: اعتبارسنجی

اگر فیلدهای پایه ناقص باشند، نصب باید متوقف شود و خطا به‌صورت واضح نمایش داده شود.

### مرحله 3: تطبیق با نوع ماژول

سیستم از روی `type` تصمیم می‌گیرد ماژول:
- فقط ثبت شود،
- نصب وابستگی بگیرد،
- build شود،
- start شود،
- یا نیازمند تنظیمات بیشتر باشد.

### مرحله 4: بررسی env

اگر `env.required` وجود داشته باشد، پنل باید قبل از start کردن ماژول این موارد را از کاربر بگیرد یا از تنظیمات سراسری بخواند.

### مرحله 5: ثبت نهایی

بعد از نصب موفق، اطلاعات ماژول در فایل مرجع سیستم یا دیتابیس مرکزی ثبت می‌شود.

نکته مهم:
`module.json` فایل شناسنامه داخل خود ماژول است؛ اما سیستم می‌تواند بعد از نصب، نسخه نهایی و یکدست‌شده اطلاعات را در مرجع داخلی خودش ذخیره کند.

---

## رفتار سیستم در زمان آپدیت

در زمان آپدیت، سیستم باید این موارد را از `module.json` جدید بخواند:

- آیا `id` همان ماژول قبلی است؟
- آیا نسخه جدیدتر است؟
- آیا نوع اجرا عوض شده است؟
- آیا envهای لازم تغییر کرده‌اند؟
- آیا پورت یا healthcheck عوض شده است؟

اگر تغییر حساس وجود داشته باشد، سیستم باید آپدیت را به‌صورت review-required علامت بزند.

نمونه تغییر حساس:
- تغییر `type`
- تغییر `runtime.kind`
- حذف env مهم
- تغییر پورت

---

## نمونه‌ها

### نمونه ماژول Backend

```json
{
  "specVersion": "1.0",
  "id": "report-service",
  "name": "Report Service",
  "version": "1.0.0",
  "description": "Creates internal reports",
  "type": "backend",
  "runtime": {
    "kind": "python",
    "version": ">=3.11"
  },
  "entry": {
    "install": "pip install -r requirements.txt",
    "start": "python app.py"
  },
  "network": {
    "mode": "port",
    "port": 3400,
    "healthcheck": "/health"
  },
  "env": {
    "required": ["DB_URL"],
    "optional": ["LOG_LEVEL"]
  }
}
```

### نمونه ماژول Worker

```json
{
  "specVersion": "1.0",
  "id": "queue-worker",
  "name": "Queue Worker",
  "version": "1.0.0",
  "type": "worker",
  "runtime": {
    "kind": "node"
  },
  "entry": {
    "install": "npm install",
    "start": "node worker.js"
  },
  "network": {
    "mode": "internal"
  },
  "env": {
    "required": ["REDIS_URL"]
  }
}
```

### نمونه ماژول SPA

```json
{
  "specVersion": "1.0",
  "id": "sales-dashboard",
  "name": "Sales Dashboard",
  "version": "1.0.0",
  "type": "spa",
  "runtime": {
    "kind": "static"
  }
}
```

---

## پیشنهاد برای فازبندی

### فاز 1

- تعریف فیلدهای پایه
- اعتبارسنجی ساده
- پشتیبانی از `backend`, `worker`, `spa`, `static`
- ثبت اطلاعات در پنل

### فاز 2

- اضافه شدن ruleهای پیشرفته‌تر
- پشتیبانی از `hybrid`
- تشخیص بهتر سازگاری نسخه
- UI بهتر برای env و healthcheck

### فاز 3

- اتصال به flow آپدیت خودکار
- اتصال به ماژول‌کتابخانه یا release source
- ruleهای امنیتی و policy-based review

---

## تصمیم نهایی این سند

این سند پیشنهاد می‌کند `module.json` به‌عنوان فایل شناسنامه فنی ماژول‌ها استفاده شود. این فایل باید کوچک، روشن و قابل اعتبارسنجی بماند.

اصل مهم این است که این فایل:
- برای توسعه‌دهنده سخت و سنگین نباشد،
- برای سیستم قابل استفاده باشد،
- و برای ادمین قابل فهم بماند.

اگر بعدها نیاز به جزئیات بیشتر باشد، بهتر است بخش‌های پیشرفته در فایل‌های مکمل اضافه شوند، نه اینکه `module.json` از همان ابتدا بیش از حد شلوغ شود.
