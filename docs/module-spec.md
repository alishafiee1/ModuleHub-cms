
# مشخصات فنی ماژول‌ها در ModuleHub CMS

> **راهنمای کامل و ساده برای ماژول Standalone (ZIP):** [standalone-module-guide.md](standalone-module-guide.md)  
> **راهنمای مخصوص هوش مصنوعی (AI Agent):** [standalone-module-ai-guide.md](standalone-module-ai-guide.md)

هر ماژول standalone باید یک پوشه با نام یکتا و شامل فایل `manifest.json` باشد.

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