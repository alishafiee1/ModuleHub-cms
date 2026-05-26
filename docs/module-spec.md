
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

# مشخصات فنی ماژول‌ها در ModularCore CMS

هر ماژول (اعم از ایستا یا مستقل) باید یک پوشه با نام یکتا و شامل فایل `manifest.json` باشد.

## 📄 ساختار manifest.json

```json
{
  "name": "نمایشگر دما",
  "type": "standalone",     // یا "builtin" (فقط در core)
  "version": "1.0.0",
  "icon": "thermometer.png",
  "description": "نمایش لحظه‌ای دما از سنسور",
  "author": "نام توسعه‌دهنده",
  "admin_role": "temp_viewer",   // اختیاری – سطح دسترسی لازم
  "docker": {                     // فقط برای type=standalone
    "composeFile": "docker-compose.yml",
    "ports": [3000],
    "resources": {
      "memory": "256M",
      "cpus": "0.2"
    },
    "capabilities": {
      "add": [],
      "drop": ["ALL"]
    }
  },
  "proxy": {
    "prefix": "/modules/temp-display/",
    "internalPort": 3000,
    "paths": ["api"]
  },
  "webhook": {                     // اختیاری – برای اعلان رویدادها
    "onInstall": "https://...",
    "onUninstall": "https://..."
  }
}