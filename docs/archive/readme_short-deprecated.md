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

/* جدول‌های markdown — RTL + راست‌چین همهٔ سلول‌ها (پیش‌نمایش VS Code / Cursor) */
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
/* نام فایل داخل سلول — LTR ولی چسبیده به راست سلول */
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
</style>

# ⛔ منسوخ — readme_short

این فایل **دیگر استفاده نشود**. محتوای قدیمی آن به «ModularCore CMS» و static ZIP اشاره دارد.

**جایگزین:** [README.md](../README.md) و [docs/README.md](../README.md)

---

## محتوای آرشیو شده (فقط تاریخچه)

```markdown
# ModularCore CMS

یک سیستم مدیریت محتوای مدولار با قابلیت افزودن ماژول‌های ایستا و مستقل (Containerized).

## ویژگی‌های کلیدی
- ✅ افزودن ماژول از طریق آپلود ZIP (با manifest.json)
- ✅ اجرای خودکار ماژول‌های داکری در کانتینرهای ایزوله
- ✅ پروکسی معکوس پویا برای دسترسی به ماژول‌ها
- ✅ پنل ادمین بصری با مانیتورینگ لحظه‌ای منابع
- ✅ مدیریت دسترسی بر اساس نقش‌ها
```

⛔ `type: static` ZIP و نام ModularCore در بالا **منسوخ** هستند.


