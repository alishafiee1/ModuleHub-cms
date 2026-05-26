

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

## 📄 فایل `README.md` (برای معرفی سریع پروژه)

```markdown
# ModularCore CMS

یک سیستم مدیریت محتوای مدولار با قابلیت افزودن ماژول‌های ایستا و مستقل (Containerized).

## ویژگی‌های کلیدی
- ✅ افزودن ماژول از طریق آپلود ZIP (با manifest.json)
- ✅ اجرای خودکار ماژول‌های داکری در کانتینرهای ایزوله
- ✅ پروکسی معکوس پویا برای دسترسی به ماژول‌ها
- ✅ پنل ادمین بصری با مانیتورینگ لحظه‌ای منابع
- ✅ مدیریت دسترسی بر اساس نقش‌ها

## شروع سریع
```bash
git clone https://github.com/alishafiee1/moduleHub-cms
cd moduleHub-cms
cp .env.example .env
# ویرایش .env با مقادیر واقعی
npm install
npm run dev