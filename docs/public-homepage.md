<style>
body, p, h1, h2, h3, li { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>

<div dir="rtl" style="text-align:right;">

# صفحه اصلی عمومی ModuleHub

## مسیر

- **`/`** — homepage عمومی (پوشه root)
- **`/browse/<folder-id>/...`** — پیمایش پوشه‌های مجازی + breadcrumb
- **`/admin`** — مدیریت سیستم

## دیزاین کارت‌ها

UI از الگوی [Ai_projects/main.html](../../Ai_projects/main.html) (RODI Docs):

- Hero با `siteTitle` و `siteSubtitle`
- Grid کارت‌ها با hover
- Font Awesome + Vazirmatn + RTL

## site-layout.json

```json
{
  "siteTitle": "ModuleHub CMS",
  "siteSubtitle": "ماژول‌ها و صفحات سایت",
  "rootFolderId": "root",
  "folders": [
    { "id": "root", "title": "خانه", "parentId": null },
    { "id": "portfolio", "title": "نمونه‌کارها", "parentId": "root" }
  ],
  "items": [
    {
      "id": "sample-gallery",
      "folderId": "root",
      "kind": "module",
      "title": "گالری نمونه",
      "subtitle": "نمایش تصاویر",
      "iconClass": "fas fa-images",
      "pageType": "builtin",
      "route": "/pages/sample-gallery/",
      "sortOrder": 1
    }
  ]
}
```

## Admin overlay

وقتی مدیر login کرده (`/admin`) و به `/` یا `/browse/...` برمی‌گردد:

- کارت **Add** (+) در انتهای grid برای پوشه جدید، catalog، یا ZIP
- روی کارت‌های **standalone/instance**: آیکون **⚙** → دیالوگ gear (Start/Stop/Logs/Settings/Git/Partial ZIP)
- tooltip مصرف CPU/RAM از Docker stats
- هشدار فایروال پس از Start
- builtin demoها gear ندارند — از catalog instance استفاده کنید

## API

- `GET /api/site-layout` — خواندن layout (auth)
- `PUT /api/site-layout` — به‌روزرسانی layout (auth)

مستندات: [README.md](README.md)

</div>
