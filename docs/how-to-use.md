<div dir="rtl" style="text-align:right;">

# چطور ModuleHub رو روی کامپیوتر خودم اجرا کنم؟

این فایل فقط **نصب و اجرای محلی** است. استقرار روی سرور → [`deploy-guide.md`](deploy-guide.md) · ساخت ماژول ZIP → [`developer-guide.md`](developer-guide.md)

---

## پیش‌نیاز

- **Node.js 20** (روی ویندوز با nvm-windows یا نصب مستقیم)
- **Git** برای clone
- ترجیحاً **Chrome** برای تست E2E

---

## قدم‌به‌قدم

### ۱. clone و نصب

```bash
git clone <repo-url> ModuleHub-cms
cd ModuleHub-cms
npm install
```

### ۲. تنظیم env

```bash
cp .env.example .env
```

داخل `.env` حداقل این‌ها را پر کن:

| متغیر | یعنی چی |
|--------|---------|
| `SESSION_SECRET` | یه رشتهٔ تصادفی بلند برای session |
| `ADMIN_PASSWORD_HASH` | hash bcrypt رمز ادمین (نه plain text) |

برای تولید hash می‌تونی از اسکریپت پروژه یا `bcrypt` آنلاین/CLI استفاده کنی.

### ۳. build

```bash
npm run build
```

TypeScript کامپایل می‌شه به پوشهٔ `dist/`.

### ۴. اجرای dev

**ویندوز (CMD):**

```cmd
set MODULEHUB_DEV_SUPER_ADMIN=1
npm run dev
```

**لینوکس/macOS:**

```bash
export MODULEHUB_DEV_SUPER_ADMIN=1
npm run dev
```

مرورگر: `http://127.0.0.1:4000`  
سلامت سرور: `http://127.0.0.1:4000/health`

> `MODULEHUB_DEV_SUPER_ADMIN=1` فقط برای توسعهٔ محلی — روی سرور production خاموش باشه.

---

## دستورات مفید

| دستور | کار |
|--------|-----|
| `npm run dev` | سرور با reload خودکار |
| `npm start` | اجرای production از `dist/` |
| `npm test` | تست واحد Jest |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (پورت `4010`) |
| `bash scripts/run-checks.sh` | lint + unit یکجا |

---

## اولین بار چی ببینم؟

1. صفحهٔ اصلی با کارت‌ها (`/`)
2. با dev flag، دکمهٔ **+** برای آپلود ZIP
3. `/admin/login` — ورود Super Admin (با hash در `.env`)
4. `/admin/settings` — تنظیمات سراسری (بعد از login)

رفتار دقیق UI → [`ui-behavior.md`](ui-behavior.md)

---

## اگه خطا گرفتی

| مشکل | احتمال |
|------|--------|
| `tsc: not found` | اول `npm install` کامل (با devDependencies) |
| 401 روی `/admin/*` | login کن یا `MODULEHUB_DEV_SUPER_ADMIN=1` |
| پورت اشغال | پورت پیش‌فرض `4000` — env یا kill process قبلی |

جزئیات بیشتر → [`docs/readme.md`](readme.md)

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
