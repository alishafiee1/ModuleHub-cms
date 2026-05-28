/* ============================================================================================
   FILE: cms-script.js
   PROJECT: HaderBash.ir - CMS Module
   LAYER: Client - CMS Logic
   
   PURPOSE: Standalone CMS module for managing IoT modules with folder structure
   
   CAPABILITIES:
   - Dark/Light theme management (independent + sync with parent)
   - Virtual folder system (JSON-based tree structure)
   - Module management (add, edit, delete, start/stop)
   - Resource limits (CPU, RAM, Swap)
   - ZIP upload simulation with wizard
   - Centralized logs and cache info
   - PostMessage communication with parent site
   ============================================================================================ */

// ========== Data Structure ==========
let itemsMap = new Map();
const ROOT_ID = "root_home";
let currentFolderId = ROOT_ID;
let adminMode = true;

function genId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

// ========== Theme Management (Independent + Parent Sync) ==========
function initTheme() {
    const savedTheme = localStorage.getItem('cms-theme') || 'light';
    const cmsBody = document.getElementById('cmsBody');
    
    if (savedTheme === 'dark') {
        cmsBody.classList.remove('light-theme');
        cmsBody.classList.add('dark-theme');
        updateDarkButtonUI(true);
    } else {
        cmsBody.classList.remove('dark-theme');
        cmsBody.classList.add('light-theme');
        updateDarkButtonUI(false);
    }
}

function updateDarkButtonUI(isDark) {
    const darkBtn = document.getElementById('cmsDarkBtn');
    if (!darkBtn) return;
    const icon = darkBtn.querySelector('i');
    const span = darkBtn.querySelector('span');
    if (isDark) {
        icon.className = 'fas fa-sun';
        span.textContent = 'لایت مود';
    } else {
        icon.className = 'fas fa-moon';
        span.textContent = 'دارک مود';
    }
}

function setCMSTheme(theme) {
    const cmsBody = document.getElementById('cmsBody');
    if (theme === 'dark') {
        cmsBody.classList.remove('light-theme');
        cmsBody.classList.add('dark-theme');
        localStorage.setItem('cms-theme', 'dark');
        updateDarkButtonUI(true);
    } else {
        cmsBody.classList.remove('dark-theme');
        cmsBody.classList.add('light-theme');
        localStorage.setItem('cms-theme', 'light');
        updateDarkButtonUI(false);
    }
    
    // Notify parent site about theme change
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'cms-theme-changed', theme: theme }, '*');
    }
}

// Listen for theme changes from parent site
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'theme-change') {
        setCMSTheme(event.data.theme);
    }
});

// ========== Icon Library ==========
const iconLibrary = [
    "fas fa-microchip", "fas fa-wifi", "fas fa-cloud-upload-alt",
    "fas fa-chart-line", "fas fa-database", "fab fa-docker",
    "fas fa-cube", "fas fa-file-alt", "fas fa-video", "fas fa-music",
    "fas fa-store", "fas fa-graduation-cap", "fas fa-tachometer-alt",
    "fas fa-robot", "fas fa-home", "fas fa-lightbulb", "fas fa-thermometer-half"
];

// ========== Dialog Functions ==========
async function showResourceAndIconDialog(initialData = {}) {
    const defaultResources = {
        cpu_limit: 0.5,
        ram_limit_mb: 512,
        swap_limit_mb: 128,
        icon: "fas fa-cube",
        thumbnail: null,
        moduleName: "",
        moduleDesc: ""
    };
    const data = { ...defaultResources, ...initialData };
    
    const iconOptionsHtml = iconLibrary.map(icon => `
        <div class="icon-option" data-icon="${icon}">
            <i class="${icon}" style="font-size: 1.5rem;"></i>
        </div>
    `).join('');
    
    const { value: result } = await Swal.fire({
        title: 'تنظیمات ماژول',
        html: `
            <div style="text-align:right;">
                <label>نام ماژول</label>
                <input id="mod-name" class="swal2-input" value="${data.moduleName.replace(/"/g, '&quot;')}" placeholder="نام کارت">
                <label>توضیحات</label>
                <textarea id="mod-desc" class="swal2-textarea" placeholder="توضیحات کوتاه">${data.moduleDesc.replace(/"/g, '&quot;')}</textarea>
                <label>آیکون کارت</label>
                <div id="icon-selector-container" class="icon-selector">${iconOptionsHtml}</div>
                <input id="custom-icon" class="swal2-input" placeholder="یا آیکون سفارشی" value="${data.icon}">
                <label>تصویر کارت (اختیاری)</label>
                <input type="file" id="card-thumbnail" accept="image/*">
                <div id="thumbnail-preview" style="margin: 8px 0;"></div>
                <hr>
                <label>CPU (هسته): <span id="cpu-val">${data.cpu_limit}</span></label>
                <input type="range" id="cpu-limit" min="0.1" max="2" step="0.1" value="${data.cpu_limit}">
                <label>RAM (MB): <span id="ram-val">${data.ram_limit_mb}</span></label>
                <input type="range" id="ram-limit" min="128" max="4096" step="64" value="${data.ram_limit_mb}">
                <label>Swap (MB): <span id="swap-val">${data.swap_limit_mb}</span></label>
                <input type="range" id="swap-limit" min="0" max="1024" step="32" value="${data.swap_limit_mb}">
            </div>
        `,
        focusConfirm: false,
        confirmButtonText: 'ذخیره',
        cancelButtonText: 'انصراف',
        showCancelButton: true,
        preConfirm: () => {
            const selectedIconElem = document.querySelector('#icon-selector-container .icon-option.selected');
            let finalIcon = document.getElementById('custom-icon').value;
            if (selectedIconElem && !finalIcon) finalIcon = selectedIconElem.getAttribute('data-icon');
            if (!finalIcon) finalIcon = "fas fa-cube";
            const thumbnailFile = document.getElementById('card-thumbnail').files[0];
            let thumbnailData = thumbnailFile ? URL.createObjectURL(thumbnailFile) : null;
            return {
                moduleName: document.getElementById('mod-name').value,
                moduleDesc: document.getElementById('mod-desc').value,
                icon: finalIcon,
                thumbnail: thumbnailData,
                cpu_limit: parseFloat(document.getElementById('cpu-limit').value),
                ram_limit_mb: parseInt(document.getElementById('ram-limit').value),
                swap_limit_mb: parseInt(document.getElementById('swap-limit').value)
            };
        },
        didOpen: () => {
            const cpu = document.getElementById('cpu-limit');
            const ram = document.getElementById('ram-limit');
            const swap = document.getElementById('swap-limit');
            cpu.addEventListener('input', () => document.getElementById('cpu-val').innerText = cpu.value);
            ram.addEventListener('input', () => document.getElementById('ram-val').innerText = ram.value);
            swap.addEventListener('input', () => document.getElementById('swap-val').innerText = swap.value);
            
            document.querySelectorAll('.icon-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    document.getElementById('custom-icon').value = opt.getAttribute('data-icon');
                });
            });
            
            const thumbInput = document.getElementById('card-thumbnail');
            const previewDiv = document.getElementById('thumbnail-preview');
            thumbInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        previewDiv.innerHTML = `<img src="${ev.target.result}" style="max-width:80px; border-radius:12px;">`;
                    };
                    reader.readAsDataURL(e.target.files[0]);
                } else previewDiv.innerHTML = '';
            });
        }
    });
    return result;
}

async function showLogsDialog(moduleName, logsContent) {
    await Swal.fire({
        title: `لاگ‌های ${moduleName}`,
        html: `<pre style="text-align:left; direction:ltr; background:#1e1e2f; color:#f0f0f0; padding:12px; border-radius:12px; max-height:400px; overflow:auto;">${logsContent}</pre>`,
        icon: 'info',
        confirmButtonText: 'بستن'
    });
}

async function showCacheInfoDialog() {
    await Swal.fire({
        title: 'کش متمرکز پکیج‌ها',
        html: `<div style="text-align:right;">
            <p>✅ وضعیت کش فعال است</p>
            <p>📦 تعداد پکیج‌های کش شده: ۳۲</p>
            <p>💾 حجم کل کش: ۴۵۲ MB</p>
            <p>🕒 آخرین به‌روزرسانی: امروز ۱۴:۳۰</p>
        </div>`,
        confirmButtonText: 'بستن'
    });
}

// ========== Initialize Sample Data ==========
function initializeData() {
    itemsMap.set(ROOT_ID, {
        id: ROOT_ID,
        name: "خانه",
        type: "folder",
        parentId: null,
        childrenIds: [],
        description: "ریشه سایت - پوشه مجازی ریشه"
    });
    
    const gallery = {
        id: genId(), name: "گالری حرفه‌ای نمونه‌کار", type: "module", moduleKind: "gallery",
        description: "آلبوم تصاویر پروژه‌های IoT", status: "running", icon: "fas fa-images",
        settings: { docker: false, port: "", permissions: "network", resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 }, logs: "۱۴۰۴/۰۲/۱۵: راه‌اندازی شد\n۱۴۰۴/۰۲/۱۶: ۲۰۰ تصویر آپلود شد" }
    };
    
    const markdown = {
        id: genId(), name: "داکیومنت فنی", type: "module", moduleKind: "markdown",
        description: "مستندات میکروکنترلرها و API", status: "running", icon: "fab fa-markdown",
        settings: { docker: false, port: "", permissions: "none", resources: { cpu_limit: 0.3, ram_limit_mb: 256, swap_limit_mb: 64 }, logs: "آماده به کار" }
    };
    
    const live = {
        id: genId(), name: "مانیتورینگ لحظه‌ای", type: "module", moduleKind: "live-widget",
        description: "نمودارهای زنده سنسورها", status: "stopped", icon: "fas fa-chart-line",
        settings: { docker: true, port: "8080", permissions: "network", resources: { cpu_limit: 0.8, ram_limit_mb: 1024, swap_limit_mb: 256 }, logs: "متوقف شده به دلیل کمبود RAM" }
    };
    
    const portfolioFolder = {
        id: genId(), name: "پروژه‌های شاخص", type: "folder", parentId: ROOT_ID, childrenIds: [],
        description: "نمونه کارهای برتر تیم", icon: "fas fa-briefcase"
    };
    
    const shopModule = {
        id: genId(), name: "فروشگاه قطعات", type: "module", moduleKind: "shop",
        description: "فروشگاه آنلاین IoT", status: "running", icon: "fas fa-store",
        settings: { docker: false, port: "3000", permissions: "network", resources: { cpu_limit: 0.6, ram_limit_mb: 768, swap_limit_mb: 128 }, logs: "فعال" }
    };
    
    const dockerModule = {
        id: genId(), name: "پلتفرم داکری", type: "module", moduleKind: "dockerized",
        description: "میکروسرویس تحلیل داده", status: "running", icon: "fab fa-docker",
        settings: { docker: true, port: "80", permissions: "network+volume", resources: { cpu_limit: 1.2, ram_limit_mb: 2048, swap_limit_mb: 512 }, logs: "مصرف RAM نزدیک به حد مجاز" }
    };
    
    portfolioFolder.childrenIds = [shopModule.id, dockerModule.id];
    itemsMap.get(ROOT_ID).childrenIds = [gallery.id, markdown.id, live.id, portfolioFolder.id];
    
    [gallery, markdown, live, portfolioFolder, shopModule, dockerModule].forEach(n => itemsMap.set(n.id, n));
}

initializeData();

// ========== Core Functions ==========
async function toggleModuleStatus(moduleId) {
    const mod = itemsMap.get(moduleId);
    if (mod && mod.type === 'module') {
        mod.status = mod.status === 'running' ? 'stopped' : 'running';
        renderAll();
        Swal.fire({ icon: 'success', title: 'تغییر وضعیت', text: `ماژول "${mod.name}" اکنون ${mod.status === 'running' ? 'در حال اجرا' : 'متوقف شد'}`, timer: 1500, showConfirmButton: false });
    }
}

function deleteItem(id, parentId) {
    const item = itemsMap.get(id);
    if (!item) return;
    if (item.type === 'folder') {
        for (let child of [...item.childrenIds]) deleteItem(child, id);
    }
    const parent = itemsMap.get(parentId || item.parentId);
    if (parent) parent.childrenIds = parent.childrenIds.filter(cid => cid !== id);
    itemsMap.delete(id);
    if (currentFolderId === id) currentFolderId = ROOT_ID;
    renderAll();
    Swal.fire({ icon: 'info', title: 'حذف شد', text: `${item.name} حذف گردید.`, toast: true, timer: 1800 });
}

async function openSettingsModal(moduleId) {
    const mod = itemsMap.get(moduleId);
    if (!mod || mod.type !== 'module') return;
    const res = await showResourceAndIconDialog({
        moduleName: mod.name,
        moduleDesc: mod.description,
        icon: mod.icon,
        cpu_limit: mod.settings.resources?.cpu_limit || 0.5,
        ram_limit_mb: mod.settings.resources?.ram_limit_mb || 512,
        swap_limit_mb: mod.settings.resources?.swap_limit_mb || 128
    });
    if (res) {
        mod.name = res.moduleName;
        mod.description = res.moduleDesc;
        mod.icon = res.icon;
        if (!mod.settings.resources) mod.settings.resources = {};
        mod.settings.resources.cpu_limit = res.cpu_limit;
        mod.settings.resources.ram_limit_mb = res.ram_limit_mb;
        mod.settings.resources.swap_limit_mb = res.swap_limit_mb;
        if (res.thumbnail) mod.thumbnail = res.thumbnail;
        renderAll();
        Swal.fire({ icon: 'success', title: 'ذخیره شد', text: 'تنظیمات بروز شد.', timer: 1300 });
    }
}

async function openGearMenu(moduleId) {
    const mod = itemsMap.get(moduleId);
    const action = await Swal.fire({
        title: `مدیریت ماژول · ${mod.name}`,
        text: `وضعیت: ${mod.status === 'running' ? '🟢 فعال' : '⛔ متوقف'} | CPU: ${mod.settings.resources?.cpu_limit || '?'} | RAM: ${mod.settings.resources?.ram_limit_mb || '?'} MB`,
        icon: 'info',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: mod.status === 'running' ? '🛑 توقف' : '▶️ اجرا',
        denyButtonText: '⚙️ ویرایش',
        cancelButtonText: '📋 لاگ'
    });
    if (action.isConfirmed) toggleModuleStatus(moduleId);
    else if (action.isDenied) openSettingsModal(moduleId);
    else if (action.dismiss === Swal.DismissReason.cancel) {
        showLogsDialog(mod.name, mod.settings.logs || "لاگی موجود نیست.");
    }
}

async function addVirtualFolder(parentId) {
    const { value: folderName } = await Swal.fire({
        title: 'پوشه مجازی جدید',
        input: 'text',
        inputPlaceholder: 'نام پوشه',
        showCancelButton: true
    });
    if (folderName) {
        const newId = genId();
        const newFolder = {
            id: newId, name: folderName, type: "folder", parentId: parentId, childrenIds: [],
            description: "پوشه مجازی", icon: "fas fa-folder"
        };
        itemsMap.set(newId, newFolder);
        itemsMap.get(parentId).childrenIds.push(newId);
        renderAll();
        Swal.fire({ icon: 'success', title: 'ساخته شد', timer: 1200 });
    }
}

async function uploadZipWizard(parentId) {
    const { value: fileConfirm } = await Swal.fire({
        title: 'آپلود ماژول (ZIP)',
        input: 'file',
        inputAttributes: { accept: '.zip' },
        confirmButtonText: 'ادامه',
        showCancelButton: true
    });
    if (!fileConfirm) return;
    
    const { value: basicAnswers } = await Swal.fire({
        title: 'تنظیمات پایه ماژول',
        html: `
            <select id="install-docker" style="width:100%; padding:0.5rem;">
                <option value="false">خیر (اجرای مستقیم)</option>
                <option value="true">بله (Docker)</option>
            </select>
            <input id="install-port" placeholder="پورت داخلی" style="width:100%; margin-top:8px;">
            <select id="install-perms" style="width:100%; margin-top:8px;">
                <option value="network">شبکه</option>
                <option value="none">هیچ</option>
                <option value="network+volume">شبکه + ذخیره‌سازی</option>
            </select>
        `,
        confirmButtonText: 'ادامه',
        preConfirm: () => ({
            docker: document.getElementById('install-docker').value === 'true',
            port: document.getElementById('install-port').value,
            permissions: document.getElementById('install-perms').value
        })
    });
    if (!basicAnswers) return;
    
    const resourceData = await showResourceAndIconDialog({
        moduleName: "ماژول جدید",
        moduleDesc: "توضیحات...",
        cpu_limit: 0.5,
        ram_limit_mb: 512
    });
    if (!resourceData) return;
    
    const newId = genId();
    const newModule = {
        id: newId, name: resourceData.moduleName, type: "module", moduleKind: "uploaded",
        description: resourceData.moduleDesc, status: "stopped", icon: resourceData.icon,
        thumbnail: resourceData.thumbnail,
        settings: {
            docker: basicAnswers.docker, port: basicAnswers.port, permissions: basicAnswers.permissions,
            resources: { cpu_limit: resourceData.cpu_limit, ram_limit_mb: resourceData.ram_limit_mb, swap_limit_mb: resourceData.swap_limit_mb },
            logs: "ماژول تازه نصب شده - تاریخ: " + new Date().toLocaleDateString('fa-IR')
        }
    };
    itemsMap.set(newId, newModule);
    itemsMap.get(parentId).childrenIds.push(newId);
    renderAll();
    Swal.fire({ icon: 'success', title: 'ماژول نصب شد!', timer: 2000 });
}

async function addFromLibrary(parentId) {
    const { value: choice } = await Swal.fire({
        title: 'کتابخانه ماژول‌ها',
        input: 'select',
        inputOptions: { gallery: 'گالری تصاویر', markdown: 'وبلاگ مارک‌داون', shop: 'فروشگاه آنلاین' }
    });
    if (choice) {
        const resourceData = await showResourceAndIconDialog({
            moduleName: choice === 'gallery' ? 'گالری هوشمند' : (choice === 'shop' ? 'فروشگاه آنلاین' : 'وبلاگ'),
            moduleDesc: `ماژول آماده ${choice === 'gallery' ? 'مدیریت تصاویر' : (choice === 'shop' ? 'فروشگاه' : 'نمایش محتوا')}`,
            cpu_limit: 0.3, ram_limit_mb: 256
        });
        if (!resourceData) return;
        const newId = genId();
        const newModule = {
            id: newId, name: resourceData.moduleName, type: "module", moduleKind: choice,
            description: resourceData.moduleDesc, status: "running", icon: resourceData.icon,
            thumbnail: resourceData.thumbnail,
            settings: { docker: false, port: "", permissions: "network", resources: { cpu_limit: resourceData.cpu_limit, ram_limit_mb: resourceData.ram_limit_mb, swap_limit_mb: resourceData.swap_limit_mb }, logs: "ماژول از کتابخانه نصب شد." }
        };
        itemsMap.set(newId, newModule);
        itemsMap.get(parentId).childrenIds.push(newId);
        renderAll();
        Swal.fire({ icon: 'success', title: 'نصب شد', timer: 1500 });
    }
}

async function openAddMasterDialog() {
    const { value: option } = await Swal.fire({
        title: '➕ افزودن محتوا',
        input: 'select',
        inputOptions: { folder: 'پوشه مجازی', zip: 'آپلود ZIP', library: 'کتابخانه آماده' },
        confirmButtonText: 'ادامه'
    });
    if (option === 'folder') await addVirtualFolder(currentFolderId);
    else if (option === 'zip') await uploadZipWizard(currentFolderId);
    else if (option === 'library') await addFromLibrary(currentFolderId);
}

// ========== Render Functions ==========
function renderBreadcrumb() {
    const container = document.getElementById('cmsBreadcrumb');
    let pathNodes = [];
    let cur = itemsMap.get(currentFolderId);
    while (cur && cur.id !== ROOT_ID) {
        pathNodes.unshift(cur);
        cur = itemsMap.get(cur.parentId);
    }
    const rootNode = itemsMap.get(ROOT_ID);
    let html = `<div class="breadcrumb-list">
        <div class="breadcrumb-item" data-folder="${ROOT_ID}"><i class="fas fa-home"></i> ${rootNode.name}</div>`;
    for (let node of pathNodes) {
        html += `<span class="separator"> / </span>
        <div class="breadcrumb-item" data-folder="${node.id}">${node.name}</div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    
    document.querySelectorAll('.breadcrumb-item').forEach(el => {
        el.addEventListener('click', (e) => {
            const fid = el.getAttribute('data-folder');
            if (fid && itemsMap.has(fid) && itemsMap.get(fid).type === 'folder') {
                currentFolderId = fid;
                renderAll();
            }
        });
    });
}

function renderCards() {
    const container = document.getElementById('cmsGrid');
    const folder = itemsMap.get(currentFolderId);
    if (!folder) return;
    
    let html = '';
    for (let childId of folder.childrenIds) {
        const node = itemsMap.get(childId);
        if (!node) continue;
        const isFolder = node.type === 'folder';
        const iconHtml = node.thumbnail ? `<img src="${node.thumbnail}" class="thumbnail-icon">` : `<i class="${node.icon || (isFolder ? 'fas fa-folder' : 'fas fa-puzzle-piece')}"></i>`;
        const gearHtml = `<div class="gear-icon" data-gear-id="${node.id}"><i class="fas fa-cog"></i></div>`;
        const statusHtml = (!isFolder && node.status) ? `<div class="status-badge ${node.status === 'running' ? 'running' : 'stopped'}"><i class="fas ${node.status === 'running' ? 'fa-play' : 'fa-stop'}"></i> ${node.status === 'running' ? 'فعال' : 'متوقف'}</div>` : '';
        const resourceHint = (!isFolder && node.settings?.resources) ? `<div class="resource-hint"><span>💻 CPU: ${node.settings.resources.cpu_limit}</span><span>🧠 RAM: ${node.settings.resources.ram_limit_mb}MB</span></div>` : '';
        
        html += `
            <div class="cms-card ${isFolder ? 'folder-card' : 'module-card'}" data-id="${node.id}" data-type="${node.type}">
                <div class="card-content">
                    <div class="card-icon">
                        <div class="card-icon-img">${iconHtml}</div>
                        ${gearHtml}
                    </div>
                    <div class="card-title">${node.name}</div>
                    <div class="card-desc">${node.description || (isFolder ? 'پوشه مجازی' : 'ماژول مستقل')}</div>
                    ${statusHtml}
                    ${resourceHint}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="cms-card add-card" id="addNewCardBtn">
            <div class="card-content">
                <i class="fas fa-plus-circle"></i>
                <div class="card-title">افزودن محتوا</div>
                <div class="card-desc">پوشه / ZIP / کتابخانه</div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.querySelectorAll('.cms-card:not(.add-card)').forEach(card => {
        const id = card.getAttribute('data-id');
        const type = card.getAttribute('data-type');
        card.addEventListener('click', (e) => {
            if (e.target.closest('.gear-icon')) return;
            if (type === 'folder') {
                currentFolderId = id;
                renderAll();
            } else {
                Swal.fire({ icon: 'info', title: 'ماژول', text: `ماژول "${itemsMap.get(id)?.name}" آماده است.`, toast: true, timer: 1500 });
            }
        });
        const gear = card.querySelector('.gear-icon');
        if (gear) gear.addEventListener('click', (e) => {
            e.stopPropagation();
            openGearMenu(id);
        });
    });
    
    const addBtn = document.getElementById('addNewCardBtn');
    if (addBtn) addBtn.addEventListener('click', openAddMasterDialog);
}

function renderAll() {
    renderBreadcrumb();
    renderCards();
}

// ========== Add Cache Button Listener ==========
function addCacheListener() {
    const cacheChip = document.querySelector('.cms-feature-chip:last-child');
    if (cacheChip) {
        cacheChip.style.cursor = 'pointer';
        cacheChip.addEventListener('click', showCacheInfoDialog);
    }
}

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderAll();
    addCacheListener();
    
    // Dark mode button listener
    const darkBtn = document.getElementById('cmsDarkBtn');
    if (darkBtn) {
        darkBtn.addEventListener('click', () => {
            const isDark = document.getElementById('cmsBody').classList.contains('dark-theme');
            setCMSTheme(isDark ? 'light' : 'dark');
        });
    }
});