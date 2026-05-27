import { buildBreadcrumb, getChildFolders, getItemsForFolder } from '../site-layout/folder-navigation';
import { SiteLayoutData, SiteLayoutFolder } from '../site-layout/types';
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
  currentFolderId: string;
}

/**
 * Resolve status CSS class for homepage tile.
 */
function resolveStatusClass(module: ModuleEntry | undefined): string {
  if (!module) return 'stopped';
  if (module.type === 'builtin' || module.type === 'instance') return 'static';
  return module.status;
}

/**
 * Build homepage card HTML for one module layout item.
 */
function renderModuleCard(
  item: Extract<SiteLayoutData['items'][number], { kind: 'module' }>,
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
 * Render virtual folder navigation card.
 */
function renderFolderCard(folder: SiteLayoutFolder, parentPathSegments: string[]): string {
  const pathSegments = [...parentPathSegments, folder.id];
  const href = `/browse/${pathSegments.join('/')}/`;
  return `<div class="card-wrap folder-card">
    <a class="card-link" href="${escapeHtml(href)}">
      <div class="card-icon"><i class="fas fa-folder"></i></div>
      <h5 class="mb-2">${escapeHtml(folder.title)}</h5>
      <div class="card-subtitle">پوشه</div>
    </a>
  </div>`;
}

/**
 * Render folder shortcut item (kind folder in items[]).
 */
function renderFolderItemCard(
  item: Extract<SiteLayoutData['items'][number], { kind: 'folder' }>,
  layout: SiteLayoutData,
): string {
  const crumbs = buildBreadcrumb(layout, item.targetFolderId);
  const href = crumbs[crumbs.length - 1]?.href ?? '/';
  const iconMarkup = item.iconClass
    ? `<div class="card-icon"><i class="${escapeHtml(item.iconClass)}"></i></div>`
    : `<div class="card-icon"><i class="fas fa-folder-open"></i></div>`;
  return `<div class="card-wrap folder-card">
    <a class="card-link" href="${escapeHtml(href)}">
      ${iconMarkup}
      <h5 class="mb-2">${escapeHtml(item.title)}</h5>
      <div class="card-subtitle">${escapeHtml(item.subtitle ?? 'پوشه')}</div>
    </a>
  </div>`;
}

/**
 * Admin Add card tile.
 */
function renderAddCard(): string {
  return `<div class="card-wrap">
    <button type="button" class="card-add" onclick="openAddModal()" aria-label="افزودن">
      <span class="card-add-icon">+</span>
      <span>افزودن</span>
    </button>
  </div>`;
}

/**
 * Breadcrumb navigation markup.
 */
function renderBreadcrumb(layout: SiteLayoutData, currentFolderId: string): string {
  const crumbs = buildBreadcrumb(layout, currentFolderId);
  if (crumbs.length <= 1 && currentFolderId === layout.rootFolderId) {
    return '';
  }
  const links = crumbs
    .map(
      (crumb, index) =>
        index === crumbs.length - 1
          ? `<span class="breadcrumb-current">${escapeHtml(crumb.title)}</span>`
          : `<a href="${escapeHtml(crumb.href)}">${escapeHtml(crumb.title)}</a>`,
    )
    .join('<span class="breadcrumb-sep"> › </span>');
  return `<nav class="breadcrumb" aria-label="مسیر">${links}</nav>`;
}

/**
 * Path segments for child folder links under current folder.
 */
function parentPathSegments(layout: SiteLayoutData, folderId: string): string[] {
  const crumbs = buildBreadcrumb(layout, folderId);
  return crumbs.slice(1).map((crumb) => crumb.folderId);
}

/**
 * Render full public homepage / folder browse HTML.
 */
export function renderHomepage(options: HomepageRenderOptions): string {
  const moduleMap = new Map(options.modules.map((mod) => [mod.id, mod]));
  const folderItems = getItemsForFolder(options.layout, options.currentFolderId);
  const childFolders = getChildFolders(options.layout, options.currentFolderId);
  const pathSegments = parentPathSegments(options.layout, options.currentFolderId);

  const folderCards = childFolders
    .map((folder) => renderFolderCard(folder, pathSegments))
    .join('\n');

  const itemCards = folderItems
    .map((item) => {
      if (item.kind === 'folder') {
        return renderFolderItemCard(item, options.layout);
      }
      if (item.kind === 'module') {
        return renderModuleCard(item, moduleMap.get(item.id), options);
      }
      return '';
    })
    .join('\n');

  const addCard = options.isAuthenticated ? renderAddCard() : '';
  const cards = `${folderCards}\n${itemCards}\n${addCard}`;
  const breadcrumb = renderBreadcrumb(options.layout, options.currentFolderId);
  const addModal = options.isAuthenticated ? renderAddModal(options.currentFolderId) : '';

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
    ${breadcrumb}
    <div class="cards">${cards}</div>
  </main>
  ${addModal}
  <footer class="footer">
    <div class="container">
      &copy; ${new Date().getFullYear()} ModuleHub CMS ·
      <a href="/admin">مدیریت سیستم</a>
    </div>
  </footer>
  <script>
    const CURRENT_FOLDER_ID = ${JSON.stringify(options.currentFolderId)};
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
    function openAddModal() {
      document.getElementById('add-modal')?.classList.add('open');
    }
    function closeAddModal() {
      document.getElementById('add-modal')?.classList.remove('open');
    }
    async function createNewFolder() {
      const title = document.getElementById('new-folder-title')?.value?.trim();
      if (!title) { alert('نام پوشه را وارد کنید'); return; }
      try {
        await api('/site-layout/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: CURRENT_FOLDER_ID, title }),
        });
        location.reload();
      } catch (e) { alert('خطا — از /admin وارد شوید'); }
    }
    function goUploadZip() {
      window.location.href = '/admin';
    }
    function showCatalogSection() {
      document.getElementById('catalog-section')?.classList.remove('hidden');
      loadCatalogTemplates();
    }
    function hideCatalogSection() {
      document.getElementById('catalog-section')?.classList.add('hidden');
    }
    async function loadCatalogTemplates() {
      const select = document.getElementById('catalog-template');
      if (!select) return;
      try {
        const { templates } = await api('/catalog');
        select.innerHTML = '<option value="">— انتخاب قالب —</option>';
        for (const template of templates) {
          const option = document.createElement('option');
          option.value = template.templateId;
          option.textContent = template.title;
          option.dataset.description = template.description;
          option.dataset.iconClass = template.defaultIconClass;
          select.appendChild(option);
        }
      } catch (e) {
        alert('خطا در بارگذاری کاتالوگ — از /admin وارد شوید');
      }
    }
    function onCatalogTemplateChange() {
      const select = document.getElementById('catalog-template');
      const option = select?.selectedOptions?.[0];
      const descField = document.getElementById('catalog-description');
      if (option?.dataset.description && descField && !descField.value.trim()) {
        descField.value = option.dataset.description;
      }
    }
    async function createCatalogInstance() {
      const templateId = document.getElementById('catalog-template')?.value?.trim();
      const cardTitle = document.getElementById('catalog-title')?.value?.trim();
      const instanceId = document.getElementById('catalog-instance-id')?.value?.trim();
      const cardDescription = document.getElementById('catalog-description')?.value?.trim();
      if (!templateId) { alert('قالب را انتخاب کنید'); return; }
      if (!cardTitle) { alert('عنوان کارت را وارد کنید'); return; }
      try {
        await api('/instances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            instanceId: instanceId || cardTitle,
            cardTitle,
            cardDescription,
            folderId: CURRENT_FOLDER_ID,
          }),
        });
        location.reload();
      } catch (e) {
        alert('خطا در ساخت instance — شناسه تکراری یا ورودی نامعتبر');
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Add modal markup for admin users.
 */
function renderAddModal(currentFolderId: string): string {
  return `<div id="add-modal" class="add-modal" onclick="if(event.target===this) closeAddModal()">
    <div class="add-modal-panel" role="dialog" aria-labelledby="add-modal-title">
      <h2 id="add-modal-title">افزودن</h2>
      <p class="add-modal-hint">پوشهٔ فعلی: ${escapeHtml(currentFolderId)}</p>
      <div class="add-modal-actions">
        <button type="button" onclick="createNewFolder()">پوشهٔ جدید</button>
        <button type="button" onclick="goUploadZip()">آپلود ZIP</button>
        <button type="button" class="secondary" onclick="showCatalogSection()">از آماده‌ها</button>
        <button type="button" class="secondary" onclick="closeAddModal()">بستن</button>
      </div>
      <label class="add-modal-field">
        نام پوشهٔ جدید
        <input id="new-folder-title" type="text" placeholder="مثلاً نمونه‌کارها" />
      </label>
      <div id="catalog-section" class="catalog-section hidden">
        <h3>افزودن از کاتالوگ</h3>
        <label class="add-modal-field">
          قالب
          <select id="catalog-template" onchange="onCatalogTemplateChange()"></select>
        </label>
        <label class="add-modal-field">
          عنوان کارت
          <input id="catalog-title" type="text" placeholder="مثلاً گالری پروژه‌ها" />
        </label>
        <label class="add-modal-field">
          شناسه instance (اختیاری)
          <input id="catalog-instance-id" type="text" placeholder="my-gallery" dir="ltr" />
        </label>
        <label class="add-modal-field">
          توضیح
          <input id="catalog-description" type="text" placeholder="توضیح کوتاه" />
        </label>
        <div class="add-modal-actions">
          <button type="button" onclick="createCatalogInstance()">ساخت instance</button>
          <button type="button" class="secondary" onclick="hideCatalogSection()">انصراف</button>
        </div>
      </div>
    </div>
  </div>`;
}
