
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

این فایل به Claude (دستیار Anthropic) کمک می‌کند تا در پروژه ModularCore CMS همکاری مؤثرتری داشته باشد.

## 🎯 شناخت زمینه (Context)
شما در حال توسعه یک CMS مدولار با قابلیت افزودن ماژول‌های داکری مستقل هستید. هسته با Node.js + TypeScript نوشته می‌شود. مدیر سایت می‌تواند از طریق پنل، ماژول جدید آپلود کند (ZIP شامل manifest.json و docker-compose.yml) و ماژول به صورت خودکار راه‌اندازی شده و از طریق زیرمسیر `/modules/<name>` در دسترس قرار می‌گیرد.

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
- **پروکسی معکوس**: در ابتدا از `http-proxy` ساده استفاده کنید، بعداً Traefik جایگزین شود.
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