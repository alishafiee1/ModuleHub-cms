## Context

ModuleHub CMS MVP (change `modulehub-cms-initial-core`) is deployed on Ubuntu with:
- Express core on port 4000, systemd service, Nginx decoy proxy
- `modules.json` registry, admin dashboard at `/admin`, Docker lifecycle for standalone modules
- `static-modules/sample-gallery` and `standalone-modules/demo-api` as samples
- Root `/` redirects to `/admin` — no public visitor experience

The user refined the architecture:
1. **Public homepage** reads a JSON layout file and renders module tiles (title, icon, page type, route)
2. **Regular pages** (gallery, markdown viewer) are **built into core**, not uploaded as static ZIPs
3. **Standalone modules** = folder with `manifest.json`, `index.html`, `docker-compose.yml` (+ app code); Docker Compose starts the runtime; reverse proxy routes dynamic traffic
4. **Admin controls** (green dot, Start/Stop, stats tooltip) visible on homepage when admin is logged in with appropriate role; per-module admin UI may live inside the module
5. **Monitoring** via Docker API (`docker stats`) — no separate resource JSON needed

## Goals / Non-Goals

**Goals:**

- Deliver a minimal, RTL-friendly public homepage at `/` for anonymous visitors
- Match homepage card visual design to reference `Ai_projects/main.html` (RODI Docs main page)
- Drive homepage tiles from `site-layout.json` (presentation) linked to `modules.json` (runtime state)
- Implement built-in gallery and markdown viewer as core modules under `core/builtin-modules/`
- Enforce standalone contract: `index.html` + Docker compose on upload
- Serve standalone `index.html` from host filesystem; proxy API/dynamic paths to container when running
- Show admin-only Start/Stop/Logs/stats overlay on homepage tiles for authorized sessions
- Migrate existing `sample-gallery` to built-in module; update demo-api with `index.html`

**Non-Goals:**

- WYSIWYG page builder or drag-and-drop layout editor
- User-uploaded static ZIP modules (removed in this change)
- Kubernetes / multi-host orchestration
- Persistent stats history
- Auto-opening UFW ports (warning only, manual admin action)
- Full OAuth / multi-user auth (keep env-based admin password + session stub)

## Decisions

### 1. Two JSON files: `site-layout.json` + `modules.json`

**Choice:** Separate presentation (`site-layout.json`) from runtime registry (`modules.json`).

**Rationale:** Layout defines display order, tile labels, icons, and route paths independent of Docker state. Registry holds install path, container id, host port, status. Admins can reorder homepage without touching runtime metadata.

**Alternative considered:** Single merged JSON — rejected because install/uninstall mutations would risk corrupting display config.

**`site-layout.json` shape:**

```json
{
  "siteTitle": "ModuleHub CMS",
  "siteSubtitle": "ماژول‌ها و صفحات سایت",
  "items": [
    {
      "id": "sample-gallery",
      "title": "گالری نمونه",
      "subtitle": "نمایش تصاویر نمونه برای تست",
      "iconClass": "fas fa-images",
      "pageType": "builtin",
      "route": "/pages/sample-gallery/",
      "sortOrder": 1
    },
    {
      "id": "demo-api",
      "title": "Demo API",
      "subtitle": "API ساده Node.js در Docker",
      "iconClass": "fas fa-plug",
      "pageType": "standalone",
      "route": "/modules/demo-api/",
      "sortOrder": 2
    }
  ]
}
```

`iconClass` (Font Awesome) is preferred for homepage tiles; optional `icon` image filename remains as fallback.

### 2. Built-in modules live in `core/builtin-modules/<id>/`

**Choice:** Each built-in module has `manifest.json`, `index.html`, assets, and a TypeScript route registrar in `core/src/builtin/<id>/routes.ts`.

**Rationale:** Matches user intent ("مابقی صفحات عادی در core نوشته شده"). Core owns code review and security for these pages; they appear in layout JSON like any tile but skip Docker and ZIP upload.

**Route prefix:** `/pages/<id>/` (distinct from standalone `/modules/<id>/`).

### 3. Deprecate `static-modules/` ZIP upload

**Choice:** Remove `type: static` from upload pipeline; keep folder temporarily for migration only.

**Rationale:** User explicitly distinguishes built-in pages from standalone Docker modules. Upload path simplifies to standalone-only.

**Migration:** Move `sample-gallery` content to `core/builtin-modules/sample-gallery/`; remove static entry from registry; add layout item with `pageType: "builtin"`.

### 4. Standalone module contract: `index.html` + Docker

**Choice:** Upload validator requires for `type: standalone`:
- `manifest.json`
- `docker-compose.yml` (or path in manifest)
- `index.html` at module root

**Rationale:** Homepage links to `/modules/<id>/`; visitors see landing page even before admin starts Docker. When container runs, proxy forwards non-static paths (e.g. `/api/*`) to container port.

**Serving strategy:**
- `GET /modules/<id>/` → serve `index.html` from `standalone-modules/<id>/` on host
- `GET /modules/<id>/api/*` (and paths listed in manifest `proxy.paths`) → http-proxy to container when `status: running`
- When stopped: index.html still served; API paths return 503 with friendly message

### 5. Public homepage vs system admin panel

**Choice:**
- `/` — public homepage (HTML, reads layout JSON + module status for dots)
- `/admin` — system admin (upload standalone ZIP, global module management, unchanged core functions)

**Rationale:** Visitors must not hit admin login. Admins managing Docker from homepage get inline controls only when session exists and `admin_role` matches manifest.

### 6. Admin controls on homepage tiles

**Choice:** Homepage server-renders tiles; if `req.session.authenticated` and role matches module's `admin_role` (or global admin), inject Start/Stop/Logs buttons and stats tooltip via small inline JS calling existing `/api/modules/:id/*` endpoints.

**Rationale:** Reuses existing API; no duplicate admin logic. Module-internal admin (e.g. `/modules/demo-api/admin.html`) remains optional inside module folder.

### 7. Monitoring: Docker stats only

**Choice:** No executable-file detection JSON. Use container name/label from compose + `docker stats` keyed by module title for tooltip.

**Rationale:** User confirmed Docker API is sufficient; compose service name + module `name` field provides readable labels in admin UI.

### 8. Layout bootstrap on standalone install/uninstall

**Choice:** On standalone install, auto-append layout item if missing (defaults from manifest). On uninstall, remove layout item. Built-in modules registered at core bootstrap from static list in code + layout file.

### 9. Homepage card UI — reference `Ai_projects/main.html`

**Choice:** Public homepage HTML/CSS SHALL follow the RODI Docs main page card pattern (user-provided reference at `Ai_projects/main.html`).

**Visual tokens (from reference):**

| Element | Style |
|---------|--------|
| Page background | `linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)` |
| Hero section | `linear-gradient(135deg, #0f2027, #203a43, #2c5364)`, centered title + subtitle |
| Card grid | CSS grid `repeat(auto-fit, minmax(260px, 1fr))`, gap 24px |
| Card (`.card-link`) | Gradient `#263238 → #37474f`, border `rgba(79,195,247,0.2)`, radius 16px, padding 28px |
| Card hover | `translateY(-6px)`, border `#4fc3f7`, shadow `0 12px 24px rgba(79,195,247,0.2)` |
| Card icon | Font Awesome 36px, color `#4fc3f7` |
| Card title | `<h5>` bold; subtitle muted (`#b0bec5`) |
| Footer | Dark gradient, top border accent, copyright + admin link |
| Typography | Vazirmatn (Google Fonts), RTL `dir="rtl"` |

**ModuleHub extensions on top of reference:**

- **Status dot** — top-left of card: green (`#22c55e`) running/builtin, gray (`#64748b`) stopped standalone
- **Admin toolbar** — small Start/Stop/Logs buttons below subtitle when admin session + role match (must not break card hover or link navigation)
- **Whole card clickable** — primary navigation via `<a class="card-link">` wrapping icon + title + subtitle (same as reference)
- **No Bootstrap JS required** — reference uses Bootstrap CSS only; homepage MAY use Bootstrap 5.3 grid/container classes or pure CSS grid equivalent

**Assets to bundle or CDN (match reference):**

- Bootstrap 5.3 CSS (CDN acceptable for MVP)
- Font Awesome 6.0
- Vazirmatn font

**File location:** `core/src/public/homepage.html` + `core/src/public/homepage.css` (extract styles from reference, do not hotlink external HTML)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **BREAKING**: static ZIP upload removed | Migration doc; sample-gallery moved to built-in |
| Standalone index vs proxied paths conflict | Manifest `proxy.paths` prefix list; default `/api` |
| Homepage exposes module list to public | Intended; only non-sensitive titles/icons; admin actions gated by session |
| Two JSON files drift out of sync | Install/uninstall hooks update both; Jest integration test |
| Stopped standalone shows index but broken API | index.html includes status banner; API returns 503 JSON |
| site-layout.json manual edit errors | Zod schema validation on load; admin API for reorder (future) |

## Migration Plan

1. Add `site-layout.json` with gallery + demo-api items
2. Create `core/builtin-modules/sample-gallery/` from existing static module files
3. Add `index.html` to `standalone-modules/demo-api/`
4. Update registry: change gallery to `type: builtin`, remove static-modules path
5. Implement `/` homepage route; remove redirect to `/admin`
6. Deploy to server via existing `deploy-to-server.ps1`; restart systemd
7. **Rollback:** Restore `modules.json.bak`, revert git tag, restart service

## Open Questions

1. **Markdown viewer scope:** Full markdown file browser or single demo page for MVP? *(Default: single demo page with one sample `.md` file)*
2. **Layout editing UI:** Admin edits layout JSON manually vs drag-and-drop in `/admin`? *(Default: manual JSON + API `GET/PUT /api/site-layout` for phase 1)*
3. **Standalone admin inside module:** Require `admin.html` convention or fully optional? *(Default: optional; core homepage controls sufficient for MVP)*
4. **Public homepage auth:** Should admins log in on homepage or only via `/admin`? *(Default: shared session — login link on homepage footer redirects to `/admin` login, session cookie works on `/`)*
