
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
| `modulePasswordHash` | — | ✅ | bcrypt hash; set via Settings form (P4) |
| `webhook` | — | 🔜 planned | `onInstall` / `onUninstall` — **not implemented** |

---
