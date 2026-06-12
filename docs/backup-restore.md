# راهنمای پشتیبان‌گیری و بازیابی — ModuleHub CMS

## خلاصه

بکاپ **کامل** شامل: `site-layout.json`, `system-settings.json`, `standalone-modules/`, `thumbnails/` و manifest. قبل از هر restore، نسخهٔ **pre-restore** خودکار ذخیره می‌شود.

---

## از UI (توصیه‌شده)

1. ورود Super Admin
2. منوی هدر → **تنظیمات** (`/admin/settings`)
3. کارت **پشتیبان‌گیری و بازیابی**
4. در دیالوگ:
   - **ایجاد بکاپ جدید** — ZIP در `storage/backups/`
   - **توضیحات** — چه چیزهایی داخل/خارج بکاپ هستند
   - **لیست** — دانلود، بازیابی یا **حذف** (حذف نیاز به رمز Super Admin دارد)
   - **بازیابی از فایل محلی** — انتخاب ZIP + تأیید خطر

پس از restore موفق، به صفحهٔ اصلی هدایت می‌شوید. در صورت نیاز CMS را restart کنید.

---

## از API (curl)

```bash
# ایجاد بکاپ (نیاز به session + CSRF)
curl -X POST http://127.0.0.1:4000/admin/backup \
  -H "X-CSRF-Token: <token>" \
  --cookie "modulehub.sid=..."

# لیست
curl -s http://127.0.0.1:4000/admin/backup/list \
  --cookie "modulehub.sid=..."

# دانلود
curl -OJ "http://127.0.0.1:4000/admin/backup/download/modulehub-full-....zip" \
  --cookie "modulehub.sid=..."

# بازیابی از فایل روی سرور
curl -X POST "http://127.0.0.1:4000/admin/backup/restore/modulehub-full-....zip" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  --cookie "modulehub.sid=..." \
  -d '{"confirm":true}'

# بازیابی از آپلود
curl -X POST http://127.0.0.1:4000/admin/restore \
  -H "X-CSRF-Token: <token>" \
  --cookie "modulehub.sid=..." \
  -F "backup=@/path/to/modulehub-full-....zip" \
  -F "confirm=true"
```

---

## CLI

```bash
node scripts/cli.js backup --output /tmp/modulehub-full.zip
```

---

## محتوای بکاپ

**داخل ZIP:** `site-layout.json`, `system-settings.json`, `standalone-modules/`, `thumbnails/`, `backup-manifest.json`

**خارج از ZIP:** لاگ‌ها، کش پکیج، فایل temp آپلود، حساب ادمین/session، سایر فایل‌های بکاپ روی دیسک

---

## محدودیت‌ها

| روش | محدودیت |
|-----|---------|
| آپلود ZIP | `maxZipUploadMb` در تنظیمات (پیش‌فرض ۲۰۰ MB) |
| restore از سرور | فقط `modulehub-full-*.zip` — نه pre-restore |
| زمان | بکاپ/restore بزرگ ممکن است چند دقیقه طول بکشد |

---

## بکاپ تکی ماژول

از دیالوگ ⚙ روی کارت ماژول → **پشتیبان ZIP** — فقط همان ماژول، نه کل CMS.

---

## مسیر ذخیره

`storage/backups/` — نام فایل‌ها: `modulehub-full-<timestamp>.zip` و `modulehub-pre-restore-<timestamp>.zip`

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
table {
 direction: rtl !important;
 text-align: right !important;
 width: 100%;
 border-collapse: collapse;
}
table th, table td {
 text-align: right !important;
 padding: 0.35em 0.5em;
}
</style>
