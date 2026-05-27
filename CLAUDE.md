
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

/* RTL tables --- Persian layout: right-aligned cells and logical column order for RTL readers */
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

/* Keep CLI/command snippets in table cells readable (LTR) */
table td code,
table th code {
    direction: ltr;
    unicode-bidi: embed;
    text-align: left;
    display: inline-block;
}
</style>

---

## 📄 فایل `CLAUDE.md` (دستورالعمل‌های اختصاصی برای Claude)

```markdown
# CLAUDE.md – دستورالعمل‌های ویژه برای Claude

این فایل به Claude (دستیار Anthropic) کمک می‌کند تا در پروژه **ModuleHub CMS** همکاری مؤثرتری داشته باشد.

**فهرست مستندات:** [docs/README.md](docs/README.md)

## 🎯 شناخت زمینه (Context)

شما در حال توسعه **ModuleHub CMS** هستید — CMS مدولار با Node.js + TypeScript. مدیر سایت ماژول standalone را ZIP آپلود می‌کند (`manifest.json` + `index.html` + `docker-compose.yml`). پس از upload، Docker برای **تنظیمات** بالا می‌آید (هدف محصول؛ v2 فعلی: Start دستی). Landing در `/modules/<id>/` از host؛ API فقط از `proxy.paths` (پیش‌فرض `api`) به کانتینر.

هر Add (catalog یا ZIP) → instance مستقل در `standalone-modules/<instance-id>/` + ثبت در JSON.

⛔ `type: static` ZIP منسوخ است. ⛔ proxy کل `/modules/<id>/` منسوخ — فقط `proxy.paths`.

## ✅ قوانین اختصاصی برای Claude

### 1. سبک پاسخگویی
- همیشه قبل از ارائه کد، توضیح مختصری از رویکرد خود بدهید.
- اگر کد بیش از ۱۰۰ خط است، ابتدا ساختار کلی را توضیح دهید و سپس بخش‌های کلیدی را ارائه کنید.
- از نشانه‌گذاری Markdown با زبان مشخص (مثلا ````typescript`) استفاده کنید.

### 2. اولویت‌های پیاده‌سازی
در هنگام پیشنهاد کد، اولویت با:
- **امنیت** (اجرای ماژول‌های ناشناس در داکر با کمترین امتیاز)
- **سادگی برای توسعه‌دهندگان ماژول** (حداقل نیازمندی‌ها برای ساخت یک ماژول جدید)
- **قابلیت نگهداری** (کد تمیز، توابع کوچک، نوع‌دهی قوی)

### 3. الگوهای کدنویسی ترجیحی
- **مدیریت داکر**: از `dockerode` کتابخانه استفاده شود.
- **پروکسی معکوس**: از `http-proxy` برای `proxy.paths` فقط (نه کل مسیر). Traefik out of scope تا v4+.
- **پایگاه داده**: تا حد امکان از فایل JSON (`modules.json`) استفاده شود تا وابستگی کاهش یابد. فقط در صورت نیاز واقعی به داکیومنت NoSQL (مثل LowDB) بروید.

### 4. نمونه کد مورد تأیید (ایده‌آل)
```typescript
// core/src/docker/manager.ts
export class DockerManager {
  async runModule(modulePath: string, manifest: Manifest): Promise<string> {
    // اعتبارسنجی محدودیت‌ها
    // ساخت دستور docker compose up -d با محدودیت‌های امنیتی
    // بازگرداندن containerId
  }
}