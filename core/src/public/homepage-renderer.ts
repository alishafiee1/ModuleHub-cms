import { SiteLayoutData } from '../site-layout/types';
import { ModuleEntry } from '../modules/types';
import { canManageModule } from '../auth/session';

/**
 * Escape HTML special characters for safe template output.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface HomepageRenderOptions {
  layout: SiteLayoutData;
  modules: ModuleEntry[];
  isAuthenticated: boolean;
  userRole?: string;
}

/**
 * Resolve status CSS class for homepage tile.
 */
function resolveStatusClass(module: ModuleEntry | undefined): string {
  if (!module) return 'stopped';
  if (module.type === 'builtin') return 'static';
  return module.status;
}

/**
 * Build homepage card HTML for one layout item.
 */
function renderCard(
  item: SiteLayoutData['items'][number],
  module: ModuleEntry | undefined,
  options: HomepageRenderOptions,
): string {
  const statusClass = resolveStatusClass(module);
  const iconMarkup = item.iconClass
    ? `<div class="card-icon"><i class="${escapeHtml(item.iconClass)}"></i></div>`
    : item.icon
      ? `<div class="card-icon"><img src="${escapeHtml(item.icon)}" alt="" /></div>`
      : `<div class="card-icon"><i class="fas fa-puzzle-piece"></i></div>`;

  const showAdmin =
    module?.type === 'standalone' &&
    options.isAuthenticated &&
    module &&
    canManageModule(options.userRole, module);

  const adminMarkup = showAdmin
    ? `<div class="admin-actions" onclick="event.stopPropagation(); event.preventDefault();">
        <button type="button" onclick="event.stopPropagation(); startModule('${escapeHtml(module!.id)}')">Start</button>
        <button type="button" class="secondary" onclick="event.stopPropagation(); stopModule('${escapeHtml(module!.id)}')">Stop</button>
        <button type="button" class="secondary" onclick="event.stopPropagation(); viewLogs('${escapeHtml(module!.id)}')">Logs</button>
      </div>
      <div class="stats-tooltip" id="stats-${escapeHtml(module!.id)}" onmouseenter="loadStats('${escapeHtml(module!.id)}')"></div>`
    : '';

  return `<div class="card-wrap">
    <span class="status-dot ${statusClass}" title="${statusClass}"></span>
    <a class="card-link" href="${escapeHtml(item.route)}">
      ${iconMarkup}
      <h5 class="mb-2">${escapeHtml(item.title)}</h5>
      <div class="card-subtitle">${escapeHtml(item.subtitle)}</div>
    </a>
    ${adminMarkup}
  </div>`;
}

/**
 * Render full public homepage HTML.
 */
export function renderHomepage(options: HomepageRenderOptions): string {
  const moduleMap = new Map(options.modules.map((mod) => [mod.id, mod]));
  const cards = options.layout.items
    .map((item) => renderCard(item, moduleMap.get(item.id), options))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(options.layout.siteTitle)}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/public/homepage.css" />
  <style>* { font-family: 'Vazirmatn', sans-serif; }</style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <h1 class="mb-3"><i class="fas fa-cubes"></i> ${escapeHtml(options.layout.siteTitle)}</h1>
      <p class="mb-0">${escapeHtml(options.layout.siteSubtitle)}</p>
    </div>
  </section>
  <main class="container my-4">
    <div class="cards">${cards}</div>
  </main>
  <footer class="footer">
    <div class="container">
      &copy; ${new Date().getFullYear()} ModuleHub CMS ·
      <a href="/admin">مدیریت سیستم</a>
    </div>
  </footer>
  <script>
    async function api(path, opts = {}) {
      const res = await fetch('/api' + path, { credentials: 'same-origin', ...opts });
      if (res.status === 401) throw new Error('auth');
      return res.json();
    }
    async function startModule(id) {
      try {
        const r = await api('/modules/' + id + '/start', { method: 'POST' });
        if (r.firewallWarning) alert(r.firewallWarning);
        location.reload();
      } catch (e) { alert('خطا در Start — از /admin وارد شوید'); }
    }
    async function stopModule(id) {
      try { await api('/modules/' + id + '/stop', { method: 'POST' }); location.reload(); }
      catch (e) { alert('خطا در Stop'); }
    }
    async function viewLogs(id) {
      try { const { logs } = await api('/modules/' + id + '/logs'); alert(logs); }
      catch (e) { alert('خطا در دریافت Logs'); }
    }
    async function loadStats(id) {
      const el = document.getElementById('stats-' + id);
      if (!el) return;
      try {
        const { stats } = await api('/modules/' + id + '/stats');
        if (stats) el.textContent = 'CPU: ' + stats.cpuPercent + ' · RAM: ' + stats.memoryUsage + '/' + stats.memoryLimit;
      } catch {}
    }
  </script>
</body>
</html>`;
}
