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



# گزارش جلسات — ModuleHub CMS

> **برای AI:** با `/sync-docs` بعد از هر کار مهم یک بلوک **بالای** «آخرین جلسات» اضافه کن.  
> قالب: عامیانه · ≤۵ خط (تغییر بزرگ ≤۱۰) · تاریخ/ساعت درخواست و نتیجه.

---

## آخرین جلسات

### 2026-05-28 — فاز ۳ runtime + deploy سایت
- **درخواست (~صبح):** شروع فاز ۳؛ اجرای ماژول، Start/Stop، باز شدن `/modules/`
- **نتیجه (~ظهر):** کد runtime، تست ۴۵/۴۵، deploy روی `192.168.88.50`؛ health سبز
- **مشکل بعدی:** در haderbash.ir تغییر نمی‌دید — `script.js` قدیمی در `/opt`
- **رفع (~بعدازظهر):** SCP + `install-to-opt`؛ ادمین با `enable-dev-admin-on-server.sh` — «درست شد»

### 2026-05-28 — ادمین قفل + `.gitignore`
- **درخواست:** ورود ادمین خطا `Super Admin session required`؛ چه push نشود
- **نتیجه:** `MODULEHUB_DEV` با systemd drop-in؛ `.gitignore` برای `storage/` و ماژول‌ها؛ `dev-workflow` بازنویسی ساده

---

## قالب (کپی برای ورودی جدید)

```markdown
### YYYY-MM-DD — عنوان کوتاه
- **درخواست (HH:mm):** …
- **نتیجه (HH:mm):** …
```


