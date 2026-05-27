<style>
body, p, h1, h2, h3, li { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
table { direction: rtl; text-align: right; width: 100%; border-collapse: collapse; }
thead th, tbody td { text-align: right; padding: 0.35em 0.5em; vertical-align: top; }
table td code, table th code { direction: ltr; text-align: left; display: inline-block; }
</style>

<div dir="rtl" style="text-align:right;">

# ModuleHub CMS — Design Document

> روایت کاربر: [proposal.md](proposal.md) · فهرست docs: [README.md](README.md) · OpenSpec v2: `openspec/changes/public-homepage-architecture-v2/`

---

## Context

ModuleHub CMS یک هستهٔ Node.js/Express است که:

- Homepage عمومی در `/` با کارت‌های ماژول
- پنل سیستم در `/admin`
- ماژول‌های **standalone** (ZIP + Docker) و **built-in** (داخل core)
- Registry در `modules.json` + چیدمان در `site-layout.json`

این سند **چشم‌انداز کامل** (proposal) را با **وضعیت فعلی** و **تصمیم‌های فنی** یکجا می‌آورد.

---

## Goals / Non-Goals

### Goals

- افزودن ماژول بدون تغییر کد هسته
- پشتیبانی از انواع محتوا: static، server-dynamic، SPA، live widget، standalone Docker
- مدیریت منابع و دسترسی از پنل
- کتابخانهٔ ماژول‌های آماده + نمونه‌های قابل تکثیر (gallery، markdown، …)
- به‌روزرسانی از GitHub و ZIP جزئی از UI کارت
- رمز اختیاری per-module برای مدیریت بدون login ادمین global

### Non-Goals (فاز فعلی)

- WYSIWYG drag-and-drop layout builder
- Kubernetes / multi-host
- OAuth چندکاربره کامل
- تاریخچهٔ persistent برای Docker stats
- Traefik / ingress خارج از http-proxy داخلی (تا فاز v4+)

---

## معماری لایه‌ای

```
┌─────────────────────────────────────────────────────────┐
│  Visitor UI — GET /  (homepage cards)                   │
│  GET /pages/<id>/*  (built-in)                          │
│  GET /modules/<id>/*  (standalone host files)           │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Core (Express)                                         │
│  • SiteLayoutRegistry (site-layout.json)                │
│  • ModuleRegistry (modules.json)                        │
│  • ModuleInstaller (ZIP)                                │
│  • DockerManager + ReverseProxyManager                  │
│  • Session admin (/admin)                               │
└──────────────┬───────────────────────┬──────────────────┘
               │                       │
    ┌──────────▼──────────┐   ┌────────▼────────────┐
    │ builtin-modules     │   │ standalone-modules  │
    │ (core/builtin-…)    │   │ (per install)       │
    │ no Docker           │   │ index.html on host  │
    └─────────────────────┘   │ API → Docker proxy  │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Docker containers   │
                              │ (compose per module)│
                              └─────────────────────┘
```

---

## انواع ماژول

| نوع | محل | Docker | آپلود ZIP | مثال |
|-----|-----|--------|-----------|------|
| **builtin demo** *(v2 فعلی)* | `core/builtin-modules/<id>/` | خیر | خیر | sample-gallery، markdown-viewer |
| **standalone** | `standalone-modules/<id>/` | بله (runtime) | بله (ZIP) | demo-api، thankio |
| **catalog template** *(🔜)* | `core/catalog-modules/<id>/` | خیر | خیر — فقط قالب read-only | gallery-template |
| **instance** *(هدف)* | `standalone-modules/<instance-id>/` | بسته به قالب | از Add (catalog یا ZIP) | `gallery-wedding-2026` |

### نگاشت اصطلاحات (proposal ↔ فنی)

| اصطلاح در proposal | نوع فنی | Docker | محل instance زنده |
|---------------------|---------|--------|-------------------|
| Static / Server-Dynamic (گالری، md) | catalog → instance | معمولاً خیر | `standalone-modules/<instance-id>/` |
| Standalone / SPA با API | standalone ZIP | بله | `standalone-modules/<instance-id>/` |
| Live Widget | 🔜 تعریف نشده | TBD | TBD |

**قانون instance:** هر Add (قالب آماده یا ZIP) → پوشه فیزیکی مجزا + ثبت در `modules.json` و `site-layout.json`؛ محتوا کاملاً مستقل.

---

## پوشه‌بندی مجازی (Virtual Folder Tree)

### اصل — مجازی vs واقعی

| لایه | محل | توضیح |
|------|-----|--------|
| **ناوبری / چیدمان** | `site-layout.json` | درخت پوشه‌های مجازی + ارجاع به ماژول‌ها — **مثل Explorer** |
| **اجرای ماژول** | `standalone-modules/` ، `core/builtin-modules/` | فقط وقتی ماژول **نصب** می‌شود |

- پوشهٔ مجازی **فایل یا directory روی دیسک ندارد**.
- در هر «صفحه» (هر `folderId`) دو نوع child مجاز است: `folder` | `module`.
- **Add card** — آخرین tile در grid؛ `visibleIf: adminSession`؛ actions: `newFolder` | `uploadZip` | `pickCatalog`.

### URL و breadcrumb *(planned)*

```
GET /                          → folderId: root
GET /browse/<folder-path>/     → folderId resolved from path segments
```

Breadcrumb از زنجیرهٔ `parentId` در JSON ساخته می‌شود.

### شکل JSON پیشنهادی *(planned — v3 layout)*

```json
{
  "siteTitle": "ModuleHub CMS",
  "siteSubtitle": "...",
  "rootFolderId": "root",
  "folders": [
    { "id": "root", "title": "خانه", "parentId": null },
    { "id": "portfolio", "title": "نمونه‌کارها", "parentId": "root" },
    { "id": "y1404", "title": "پروژه‌های ۱۴۰۴", "parentId": "portfolio" }
  ],
  "items": [
    {
      "id": "gallery-trip",
      "folderId": "portfolio",
      "kind": "module",
      "title": "گالری سفر",
      "pageType": "standalone",
      "route": "/modules/gallery-trip/",
      "sortOrder": 1
    },
    {
      "id": "add-slot",
      "folderId": "portfolio",
      "kind": "admin-add",
      "sortOrder": 99
    }
  ]
}
```

**v2 فعلی:** فقط `items[]` flat در root — بدون `folders[]`. migration: همهٔ items فعلی → `folderId: "root"`.

### Add card (admin)

- رندر به‌صورت `<div class="card-add">+</div>` در انتهای grid همان `folderId`.
- کلیک → modal: **New folder** | **Upload ZIP** | **From catalog**.
- New folder → فقط `folders.push({ id, title, parentId: currentFolderId })` — **بدون** touch به `modules.json`.

### built-in vs instance روی دیسک

| عمل | JSON | دیسک |
|-----|------|------|
| New virtual folder | `folders[]` | — |
| Add catalog gallery | `items[]` + `modules.json` | copy template → `standalone-modules/<instance-id>/` |
| Add ZIP standalone | `items[]` + `modules.json` | extract → `standalone-modules/<module-id>/` |
| Catalog template source | — | `core/catalog-modules/<template-id>/` (read-only در repo) |
| Built-in demo (v2) | layout item | `core/builtin-modules/<id>/` (ثابت در repo — تا migration به instance) |

---

## جریان‌های کار (User Flows)

### F0 — پیمایش پوشهٔ مجازی *(planned)*

```
Visitor/Admin → GET /browse/portfolio/
  → resolve folderId "portfolio"
  → render folder cards + module cards + (if admin) Add card at end
Click folder card → navigate to child folder
Click module card → route to /pages/... or /modules/...
```

**وضعیت:** 🔜

### F1 — افزودن پروژهٔ شخصی (ZIP)

**هدف (تصمیم محصول):**

```
Admin → Add → Upload ZIP
  → validate manifest.json + index.html + docker-compose.yml
  → extract → standalone-modules/<module-id>/
  → registry.upsert + layout.addItem
  → Docker compose up (settings mode — برای تنظیمات)
  → SettingsForm (ports, caps, prefix, resources, github, entryHtml, modulePassword, cardImage)
  → if params incomplete: کلیک کارت در /admin → فرم تنظیمات دوباره
  → Save settings → status: running + proxy /api/* فعال
```

**v2 فعلی (کد):** upload → extract → stopped → Approve → Start دستی · فرم کامل 🔜

**وضعیت:** ZIP + extract + manifest ✅ · Docker settings mode + فرم کامل 🔜

### F2 — افزودن از کتابخانه (گالری / مارک‌داون)

```
Admin → Add → Pick template from core/catalog-modules/
  → prompt: instanceId, cardTitle, cardImage, modulePassword (optional)
  → copy template → standalone-modules/<instance-id>/   (instance مستقل)
  → registry.upsert + layout.addItem (route /modules/<instance-id>/ یا /pages/...)
  → admin UI inside instance (upload images / md files)
```

**v2 فعلی:** یک نمونه ثابت در `core/builtin-modules/` (demo) — نه instance چندتایی.

**وضعیت:** builtin demo ✅ · catalog + instance copy 🔜

### F3 — چرخ‌دنده روی کارت (⚙)

```
User → click gear on card
  → if modulePassword set: prompt password
  → else: require global admin session
  → dialog: live stats | Start/Stop | Settings | Git pull | partial ZIP upload | delete
```

**وضعیت:** Start/Stop/Logs روی homepage برای admin session ✅ · gear dialog + Git + module password 🔜

### F4 — بازدیدکننده

```
GET / → homepage HTML (site-layout + status dots)
Click card → route from layout
  builtin:  /pages/<id>/index.html
  standalone: /modules/<id>/index.html (+ assets)
  API paths when container running: /modules/<id>/api/*
```

**وضعیت:** ✅

---

## تصمیم‌های فنی (Decisions)

### D1 — دو فایل JSON: presentation vs runtime

| فایل | نقش |
|------|-----|
| `site-layout.json` | عنوان سایت، ترتیب کارت‌ها، icon، route |
| `modules.json` | installPath، status، proxy، docker metadata |

**چرا جدا:** چیدمان homepage بدون دست‌زدن به state کانتینر عوض شود.

### D2 — Standalone: `index.html` روی host، API در Docker

| URL | منبع |
|-----|------|
| `/modules/<id>/` | `index.html` + static assets روی host |
| `/modules/<id>/api/*` | reverse proxy → container (فقط وقتی running) |

وقتی Stop: landing کار می‌کند؛ API → 503.

### D3 — Instance مستقل؛ catalog در core

| لایه | محل | نقش |
|------|-----|-----|
| **قالب catalog** | `core/catalog-modules/<template-id>/` | سورس read-only در repo — برای Add dialog |
| **instance زنده** | `standalone-modules/<instance-id>/` | هر Add یک کپی مجزا — محتوا مستقل |
| **demo v2** | `core/builtin-modules/<id>/` | نمونه ثابت تا migration کامل به instance |

صفحات ساده (گالری، markdown) از **catalog** کپی می‌شوند — نه ZIP upload. ZIP فقط برای `type: standalone`.

**Migration نام پوشه:** `static-modules/` ⛔ → `core/catalog-modules/` ✅

### D4 — قرارداد manifest (standalone)

```json
{
  "name": "Thankio",
  "type": "standalone",
  "version": "1.0.0",
  "description": "...",
  "docker": {
    "composeFile": "docker-compose.yml",
    "ports": [3000],
    "resources": { "memory": "256M", "cpus": "0.2" }
  },
  "proxy": {
    "prefix": "/modules/thankio/",
    "internalPort": 3000,
    "paths": ["api"]
  },
  "admin_role": "admin",
  "github": { "repo": "org/repo", "branch": "main" },
  "entryHtml": "index.html",
  "modulePasswordHash": null
}
```

`module-id` = `sanitizeModuleId(name)` → `thankio`

### D5 — امنیت Docker (compose)

اجباری/توصیه‌شده:

```yaml
read_only: true
cap_drop: [ALL]
ports: ["3000"]   # بدون bind ثابت host
tmpfs: [/tmp]
deploy.resources.limits.memory: ...
```

### D6 — Homepage UI

الگوی بصری: `Ai_projects/main.html` — Vazirmatn، RTL، grid کارت، status dot.

Admin overlay: Start/Stop/Logs + stats tooltip وقتی session + role match.

### D7 — Catalog modules *(✅ P2a)*

```
core/catalog-modules/
├── image-gallery/
│   ├── manifest.template.json
│   ├── index.html
│   └── ...
└── markdown-viewer/
    └── ...
```

Add dialog: `GET /api/catalog` → list templates → `POST /api/instances` با `{ templateId, instanceId, cardTitle, ... }`.

### D8 — Markdown instance *(planned)*

- کپی قالب → `standalone-modules/<instance-id>/`
- محتوا: `<instance>/markdown/*.md`
- عنوان لیست = first `# heading` in file
- preview: first N lines on card list; **More** → full render page
- optional: Git sync for markdown folder

### D9 — Gallery instance *(planned)*

- دکمه Add داخل گالری (با module password)
- upload multi-file → `<instance>/images/`
- gear: delete mode, Git sync, uninstall instance

### D10 — واژگان lifecycle ماژول

| وضعیت | معنی |
|-------|------|
| **Install** | extract ZIP یا copy catalog + ثبت JSON |
| **Settings pending** | Docker بالا (settings mode) ولی پارامترها ناقص یا proxy محدود |
| **Running** | تنظیمات ذخیره + سرویس عمومی + proxy فعال |
| **Stopped** | کانتینر down؛ `index.html` روی host همچنان سرو می‌شود |

### D11 — مسیر JSON (dev vs prod)

| محیط | `modules.json` | `site-layout.json` |
|------|----------------|---------------------|
| **Development** | `data/modules.json` (یا via `.env`) | `data/site-layout.json` |
| **Production** | `/var/lib/modulehub/modules.json` | `/var/lib/modulehub/site-layout.json` |

مقادیر از `MODULES_JSON_PATH` و `SITE_LAYOUT_JSON_PATH` در `.env` خوانده می‌شوند.

---

## ساختار پوشه‌ها (Target)

```
ModuleHub-cms/
├── core/
│   ├── src/                    # Express app
│   ├── builtin-modules/        # demo pages shipped in repo (v2)
│   └── catalog-modules/        # read-only templates for Add dialog (✅ P2a)
├── standalone-modules/         # installed standalone + instances
│   ├── demo-api/
│   └── thankio/
├── data/
│   ├── modules.json
│   └── site-layout.json
└── docs/
    ├── proposal.md
    └── design.md
```

---

## Routing Reference

| Pattern | Handler |
|---------|---------|
| `GET /` | homepage-renderer |
| `GET /admin` | admin SPA |
| `GET /pages/:id/*` | builtin static files |
| `GET /modules/:id/*` | standalone host files |
| `GET /modules/:id/api/*` | reverse proxy (if running) |
| `POST /api/modules/upload` | ZIP install |
| `POST /api/modules/:id/start` | docker compose up |
| `GET /api/catalog` | list catalog templates (auth) |
| `POST /api/modules/:id/git-pull` | git sync into module dir (auth) |
| `POST /api/modules/:id/partial-upload` | partial ZIP replace (auth) |

---

## Settings Form Schema *(planned)*

فیلدهای فرم پس از Add (proposal §):

| Field | Maps to |
|-------|---------|
| ports | `manifest.docker.ports` |
| capabilities / network | compose + manifest warnings |
| URL prefix | `manifest.proxy.prefix` |
| resource limits | `manifest.docker.resources` + compose deploy |
| GitHub repo | `manifest.github.repo` |
| entry HTML | `manifest.entryHtml` (default `index.html`) |
| module password | `manifest.modulePasswordHash` |
| card image | `site-layout.items[].icon` |

Auto-fill: read existing `manifest.json` + `site-layout.json` on edit.

---

## Implementation Matrix

| Capability | v2 (now) | Target (proposal) |
|------------|----------|---------------------|
| Public homepage `/` | ✅ | ✅ |
| Flat card list (root only) | ✅ | — |
| Virtual nested folders (JSON) | ✅ | ✅ |
| Add card at end of grid (admin) | ✅ | ✅ |
| site-layout.json | ✅ tree + folders | ✅ tree + folders |
| ZIP standalone install | ✅ | ✅ |
| Docker Start/Stop/Stats | ✅ (Approve/Start دستی) | ✅ + settings mode پس از upload |
| Built-in gallery/markdown | ✅ sample (fixed id) | ✅ per-instance copy |
| Add dialog catalog | ❌ | ✅ catalog-modules |
| Instance copy (gallery/md) | ❌ | ✅ |
| Gear dialog | partial (homepage admin) | ✅ full dialog |
| GitHub pull | ✅ P3 |
| Module password | ❌ | ✅ |
| Partial ZIP update | ✅ P3 |

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Catalog copy vs template drift | Single source in `catalog-modules`; tests per template |
| instance-id collision | validate kebab-case + unique check |
| Git pull overwrites local uploads | backup + restore `images/`, `markdown/`, `uploads/` before/after pull; confirm در UI |
| Partial ZIP overwrite | path-safety + max 50 files; admin confirm via gear dialog |
| module password bypass | hash + rate limit; separate from admin session (🔜 P4) |
| Too many Docker modules on small VPS | default memory caps; warn on Start |
| Docker settings mode vs public traffic | document which URLs open before Save; proxy gated until Running |
| Legacy docs (static ZIP, auto-start) | use [docs/README.md](README.md) as index; archive old files |

---

## Phasing

| Phase | Deliverables |
|-------|--------------|
| **P0 — Done** | Core, homepage flat cards, builtin samples, standalone ZIP, proxy |
| **P1** | Virtual folder tree in JSON + browse routes + Add card UI |
| **P2** | Add dialog catalog + instance copy |
| **P2** | Settings form (full fields) + gear dialog |
| **P3** | GitHub sync + partial ZIP |
| **P4** | Module password + per-module admin without global login |

---

## References

- [README.md](README.md) — فهرست و legend مستندات
- [standalone-module-guide.md](standalone-module-guide.md) — قرارداد ZIP برای توسعه‌دهنده
- [standalone-module-ai-guide.md](standalone-module-ai-guide.md) — prompt برای AI
- [public-homepage.md](public-homepage.md) — homepage و layout
- `standalone-modules/demo-api/` — نمونه standalone
- `core/builtin-modules/sample-gallery/` — نمونه built-in

</div>
