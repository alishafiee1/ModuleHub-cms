<style>
body, p, h1, h2, h3, li { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>

<div dir="rtl" style="text-align:right;">

# ModuleHub — راهنمای AI (Standalone ZIP)

**نمونه:** `standalone-modules/demo-api/` · **راهنمای انسان:** [standalone-module-guide.md](standalone-module-guide.md) · **Schema:** [module-spec.md](module-spec.md)

---

## System prompt (کپی کن)

```text
Build a ModuleHub CMS standalone module as a ZIP-ready folder.

MUST:
- type: "standalone" only
- ZIP root: manifest.json, index.html, docker-compose.yml (no extra wrapper folder, no ../)
- module-id = kebab-case from name (e.g. "Demo API" → demo-api)
- proxy.prefix = "/modules/<module-id>/"
- index.html served on HOST at prefix; app runs in Docker
- Public API under /modules/<id>/api/... → container /api/... (default proxy.paths: ["api"])
- compose: ports: ["3000"], read_only: true, cap_drop: [ALL]
- index.html works when Docker is stopped; fetch site URL not localhost

Deliver: file tree + all files + zip command.
```

---

## manifest.json (حداقل)

```json
{
  "name": "Demo API",
  "type": "standalone",
  "version": "1.0.0",
  "icon": "api.png",
  "description": "Short description",
  "docker": {
    "composeFile": "docker-compose.yml",
    "ports": [3000],
    "resources": { "memory": "256M" }
  },
  "proxy": {
    "prefix": "/modules/demo-api/",
    "internalPort": 3000
  }
}
```

---

## مسیریابی

| URL | منبع |
|-----|------|
| `/modules/<id>/` | `index.html` روی هاست (همیشه) |
| `/modules/<id>/api/*` | Docker اگر **Start** شده؛ وگرنه 503 |

---

## docker-compose.yml (حداقل)

```yaml
services:
  app:
    build: .
    ports: ["3000"]
    read_only: true
    cap_drop: [ALL]
    tmpfs: [/tmp]
```

---

## NEVER

- `type: static` · ZIP با پوشه تو در تو · `3000:3000` bind · API فقط `/health` بدون `/api/` · `fetch('http://localhost:3000')` · بدون `index.html`
- proxy کل `/modules/<id>/` به کانتینر — فقط `proxy.paths` (پیش‌فرض `api`)

---

## Common mistakes (from legacy docs ⛔)

| ⛔ Wrong | ✅ Correct |
|----------|-----------|
| Static ZIP upload | standalone only |
| Auto-start without settings | v2: manual Start; target: settings mode after upload |
| ModularCore CMS | **ModuleHub CMS** |

---

## بعد از تحویل (admin)

**v2:** آپلود `/admin` → تأیید دسترسی → Approve → Start  
**هدف 🔜:** upload → Docker settings mode → Save settings → Running

مرجع lifecycle: [module-spec.md](module-spec.md)

---

## Prompt کاربر (فارسی)

```text
طبق docs/standalone-module-ai-guide.md یک ماژول standalone برای ModuleHub بساز.
ماژول: [توضیح] · Runtime: [Node/Python/...]
```

</div>
