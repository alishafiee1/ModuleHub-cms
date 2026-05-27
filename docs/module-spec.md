
# مشخصات فنی ماژول‌ها در ModuleHub CMS

> **راهنمای کامل ZIP:** [standalone-module-guide.md](standalone-module-guide.md)  
> **AI Agent:** [standalone-module-ai-guide.md](standalone-module-ai-guide.md)  
> **فهرست docs:** [README.md](README.md)

هر ماژول standalone یک پوشه با نام یکتا و `manifest.json` دارد. `type: builtin` فقط داخل `core/builtin-modules/` (demo) — **ZIP upload فقط `standalone`**.

---

## Manifest Schema (مرجع واحد)

| فیلد | Required | وضعیت | توضیح |
|------|----------|--------|--------|
| `name` | ✅ | ✅ | نام نمایشی — برای production نام انگلیسی کوتاه توصیه می‌شود |
| `type` | ✅ | ✅ | `"standalone"` برای ZIP؛ `"builtin"` فقط در core |
| `version` | ✅ | ✅ | semver، مثلاً `"1.0.0"` |
| `description` | ✅ | ✅ | یک خط — روی کارت homepage |
| `icon` | ✅ | ✅ | نام فایل آیکون یا رشته معتبر |
| `author` | — | ✅ | اختیاری |
| `admin_role` | — | ✅ | نقش لازم برای Start/Stop (پیش‌فرض: global admin) |
| `docker` | ✅* | ✅ | *فقط `type: standalone` |
| `docker.composeFile` | ✅ | ✅ | مثلاً `"docker-compose.yml"` |
| `docker.ports` | ✅ | ✅ | پورت‌های داخل کانتینر |
| `docker.resources` | — | ✅ | `memory`, `cpus` |
| `docker.capabilities` | — | ✅ | `add` / `drop` (توصیه: `drop: ["ALL"]`) |
| `proxy` | ✅* | ✅ | *فقط standalone |
| `proxy.prefix` | ✅ | ✅ | `/modules/<module-id>/` |
| `proxy.internalPort` | ✅ | ✅ | پورت داخل کانتینر |
| `proxy.paths` | — | ✅ | پیش‌فرض `["api"]` — **فقط** این مسیرها proxy می‌شوند |
| `github` | — | ✅ | `{ repo, branch }` |
| `entryHtml` | — | ✅ | پیش‌فرض `index.html` |
| `modulePasswordHash` | — | 🔜 | planned P4 |
| `webhook` | — | 🔜 planned | `onInstall` / `onUninstall` — **not implemented** |

---

## نمونه manifest (standalone)

```json
{
  "name": "Temp Display",
  "type": "standalone",
  "version": "1.0.0",
  "icon": "thermometer.png",
  "description": "نمایش لحظه‌ای دما از سنسور",
  "author": "Developer Name",
  "admin_role": "admin",
  "docker": {
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
  }
}
```

`module-id` = `sanitizeModuleId(name)` → مثلاً `temp-display`

---

## Reverse proxy — اشتباه رایج ⛔

| ⛔ منسوخ (initial-core) | ✅ v2 فعلی |
|-------------------------|-----------|
| proxy کل `/modules/<id>/` به کانتینر | `index.html` + assets از **host** |
| | فقط `proxy.paths` (پیش‌فرض `/api/*`) به Docker وقتی Running |

وقتی Stop: landing کار می‌کند؛ API → 503.

---

## Lifecycle (هدف vs v2)

| مرحله | هدف 🔜 | v2 فعلی ✅ |
|-------|--------|-----------|
| Upload ZIP | validate + extract + Docker settings mode | ✅ |
| Settings | فرم؛ کلیک کارت اگر ناقص | ✅ P2b |
| Running | proxy فعال پس از Save settings | ✅ |

---

## انواع ماژول

| نوع | محل | ZIP |
|-----|-----|-----|
| standalone | `standalone-modules/<id>/` | ✅ |
| catalog template | `core/catalog-modules/` | خیر |
| instance (from catalog) | `standalone-modules/<instance-id>/` | خیر (copy) |
| builtin demo | `core/builtin-modules/` | خیر |

⛔ `type: static` در ZIP — رد می‌شود.
