<style>
body, p, h1, h2, h3, li { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>

<div dir="rtl" style="text-align:right;">

# Migration: built-in demos → catalog instances

اختیاری — برای سرورهایی که هنوز `sample-gallery` / `markdown-viewer` به‌صورت **builtin** در layout دارند.

## پیش‌نیاز

- backup از `data/modules.json` و `data/site-layout.json`
- catalog templates در `core/catalog-modules/` (image-gallery، markdown-viewer)

## گام‌ها

1. در `/admin` یا homepage با Add card، از catalog دو instance بسازید.
2. آیتم‌های builtin قدیمی را از `site-layout.json` حذف کنید (یا از layout editor).
3. `BOOTSTRAP_BUILTIN_LAYOUT=false` در `.env` (پیش‌فرض).
4. restart سرویس.

## API (دستی)

```bash
# مثال — با session admin
curl -X POST http://localhost:4000/api/instances \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json" \
  -d '{"templateId":"image-gallery","cardTitle":"گالری من","folderId":"root"}'
```

تکرار برای `markdown-viewer`.

</div>
