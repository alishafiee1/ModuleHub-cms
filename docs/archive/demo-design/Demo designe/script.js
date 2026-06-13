// script.js - منطق اصلی برنامه، شامل مدیریت درخت، رندر و تعامل با دیالوگ‌ها
let itemsMap = new Map();
const ROOT_ID = "root_home";
let currentFolderId = ROOT_ID;
let adminMode = true;

function genId() { return Date.now() + '-' + Math.random().toString(36).substring(2, 8); }

function initializeData() {
    itemsMap.set(ROOT_ID, {
        id: ROOT_ID, name: "خانه", type: "folder", parentId: null, childrenIds: [],
        description: "ریشه سایت - پوشه مجازی ریشه"
    });
    const gallery = {
        id: genId(), name: "گالری حرفه‌ای نمونه‌کار", type: "module", moduleKind: "gallery",
        description: "آلبوم تصاویر پروژه‌های معماری", status: "running", icon: "fas fa-images",
        settings: { docker: false, port: "", permissions: "network", resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 }, logs: "2025-01-15: راه‌اندازی شد\n2025-01-16: درخواست ۲۰۰ تصویر" }
    };
    const markdown = {
        id: genId(), name: "مقالات آموزشی مارک‌داون", type: "module", moduleKind: "markdown",
        description: "مجموعه فایل‌های .md", status: "running", icon: "fab fa-markdown",
        settings: { docker: false, port: "", permissions: "none", resources: { cpu_limit: 0.3, ram_limit_mb: 256, swap_limit_mb: 64 }, logs: "آماده به کار" }
    };
    const live = {
        id: genId(), name: "لایو مانیتورینگ سرور", type: "module", moduleKind: "live-widget",
        description: "نمودارهای زنده و WebSocket", status: "stopped", icon: "fas fa-chart-line",
        settings: { docker: true, port: "8080", permissions: "network", resources: { cpu_limit: 0.8, ram_limit_mb: 1024, swap_limit_mb: 256 }, logs: "متوقف شده به دلیل کمبود RAM در آخرین اجرا" }
    };
    const portfolioFolder = {
        id: genId(), name: "نمونه‌کارهای برتر", type: "folder", parentId: ROOT_ID, childrenIds: [],
        description: "پروژه‌های شاخص", icon: "fas fa-briefcase"
    };
    const reactApp = {
        id: genId(), name: "اپلیکیشن فروشگاهی React", type: "module", moduleKind: "spa",
        description: "SPA کامل با روتینگ", status: "running", icon: "fab fa-react",
        settings: { docker: false, port: "3000", permissions: "network", resources: { cpu_limit: 0.6, ram_limit_mb: 768, swap_limit_mb: 128 }, logs: "فعال" }
    };
    const dockerApp = {
        id: genId(), name: "پلتفرم تحلیل داکری", type: "module", moduleKind: "dockerized",
        description: "میکروسرویس", status: "running", icon: "fa-brands fa-docker",
        settings: { docker: true, port: "80", permissions: "network+volume", resources: { cpu_limit: 1.2, ram_limit_mb: 2048, swap_limit_mb: 512 }, logs: "مصرف RAM نزدیک به حد مجاز" }
    };
    portfolioFolder.childrenIds = [reactApp.id, dockerApp.id];
    itemsMap.get(ROOT_ID).childrenIds = [gallery.id, markdown.id, live.id, portfolioFolder.id];
    [gallery, markdown, live, portfolioFolder, reactApp, dockerApp].forEach(n => itemsMap.set(n.id, n));
}
initializeData();

function renderBreadcrumb() {
    const container = document.getElementById("breadcrumbArea");
    let pathNodes = [];
    let cur = itemsMap.get(currentFolderId);
    while (cur && cur.id !== ROOT_ID) {
        pathNodes.unshift(cur);
        cur = itemsMap.get(cur.parentId);
    }
    const rootNode = itemsMap.get(ROOT_ID);
    let html = `<div class="breadcrumb-list"><div class="breadcrumb-item" data-folder="${ROOT_ID}"><i class="fas fa-home"></i> ${rootNode.name}</div>`;
    for (let node of pathNodes) {
        html += `<span class="separator"> / </span><div class="breadcrumb-item" data-folder="${node.id}">${node.name}</div>`;
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
    Swal.fire({ icon: 'info', title: 'حذف شد', text: `${item.name} حذف گردید.`, toast: true, timer: 1800, position: 'top-end' });
}

async function openSettingsModal(moduleId) {
    const mod = itemsMap.get(moduleId);
    if (!mod || mod.type !== 'module') return;
    // استفاده از دیالوگ جامع منابع و آیکون
    const res = await ModuleDialogs.showResourceAndIconDialog({
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
        Swal.fire({ icon: 'success', title: 'ذخیره شد', text: 'تنظیمات منابع و ظاهر بروز شد.', timer: 1300 });
    }
}

async function openGearMenu(moduleId) {
    const mod = itemsMap.get(moduleId);
    if (!adminMode) return;
    const action = await Swal.fire({
        title: `مدیریت ماژول · ${mod.name}`,
        text: `وضعیت: ${mod.status === 'running' ? '🟢 فعال' : '⛔ متوقف'} | CPU: ${mod.settings.resources?.cpu_limit || '?'} هسته | RAM: ${mod.settings.resources?.ram_limit_mb || '?'} MB`,
        icon: 'info',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: mod.status === 'running' ? '🛑 توقف' : '▶️ اجرا',
        denyButtonText: '⚙️ ویرایش منابع/آیکون',
        cancelButtonText: '📋 لاگ ماژول'
    });
    if (action.isConfirmed) toggleModuleStatus(moduleId);
    else if (action.isDenied) openSettingsModal(moduleId);
    else if (action.dismiss === Swal.DismissReason.cancel) {
        const logs = mod.settings.logs || "لاگی موجود نیست.";
        ModuleDialogs.showLogsDialog(mod.name, logs);
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
    
    // مرحله اول: سه سوال اصلی (Docker, Port, Permissions)
    const { value: basicAnswers } = await Swal.fire({
        title: 'تنظیمات پایه ماژول',
        html: `
            <select id="install-docker" style="width:100%; padding:0.5rem;">
                <option value="false">خیر (اجرای مستقیم)</option>
                <option value="true">بله (Docker)</option>
            </select>
            <input id="install-port" placeholder="پورت داخلی (مثل 3000)" style="width:100%; margin-top:8px;">
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
    
    // مرحله دوم: دیالوگ منابع، آیکون و تصویر کارت
    const resourceData = await ModuleDialogs.showResourceAndIconDialog({
        moduleName: "ماژول جدید",
        moduleDesc: "توضیحات...",
        cpu_limit: 0.5,
        ram_limit_mb: 512,
        swap_limit_mb: 128
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
            logs: "ماژول تازه نصب شده. هنوز لاگی ثبت نشده است."
        }
    };
    itemsMap.set(newId, newModule);
    itemsMap.get(parentId).childrenIds.push(newId);
    renderAll();
    Swal.fire({ icon: 'success', title: 'ماژول نصب شد!', text: `فایل‌ها در standalone-modules/${newId}/ قرار گرفت.`, timer: 2000 });
}

async function addFromLibrary(parentId) {
    const { value: choice } = await Swal.fire({
        title: 'کتابخانه ماژول‌ها',
        input: 'select',
        inputOptions: { gallery: 'گالری تصاویر', markdown: 'مارک‌داون بلاگ' }
    });
    if (choice) {
        const resourceData = await ModuleDialogs.showResourceAndIconDialog({
            moduleName: choice === 'gallery' ? 'گالری هوشمند' : 'وبلاگ مارک‌داون',
            moduleDesc: `یک ماژول آماده ${choice === 'gallery' ? 'مدیریت تصاویر' : 'نمایش محتوا'}`,
            cpu_limit: 0.3, ram_limit_mb: 256
        });
        if (!resourceData) return;
        const newId = genId();
        const newModule = {
            id: newId, name: resourceData.moduleName, type: "module", moduleKind: choice,
            description: resourceData.moduleDesc, status: "running", icon: resourceData.icon,
            thumbnail: resourceData.thumbnail,
            settings: { docker: false, port: "", permissions: "network", resources: { cpu_limit: resourceData.cpu_limit, ram_limit_mb: resourceData.ram_limit_mb, swap_limit_mb: resourceData.swap_limit_mb }, logs: "ماژول آماده از کتابخانه با موفقیت نصب شد." }
        };
        itemsMap.set(newId, newModule);
        itemsMap.get(parentId).childrenIds.push(newId);
        renderAll();
        Swal.fire({ icon: 'success', title: 'نصب شد', timer: 1500 });
    }
}

async function openAddMasterDialog() {
    if (!adminMode) return;
    const { value: option } = await Swal.fire({
        title: '➕ افزودن به صفحه',
        input: 'select',
        inputOptions: { folder: 'پوشه مجازی', zip: 'آپلود ZIP (پروژه شخصی)', library: 'کتابخانه آماده' },
        confirmButtonText: 'ادامه'
    });
    if (option === 'folder') await addVirtualFolder(currentFolderId);
    else if (option === 'zip') await uploadZipWizard(currentFolderId);
    else if (option === 'library') await addFromLibrary(currentFolderId);
}

async function showCacheInfo() {
    await ModuleDialogs.showCacheInfoDialog();
}

function renderCards() {
    const container = document.getElementById("cardsGrid");
    const folder = itemsMap.get(currentFolderId);
    if (!folder) return;
    let html = '';
    for (let childId of folder.childrenIds) {
        const node = itemsMap.get(childId);
        if (!node) continue;
        const isFolder = node.type === 'folder';
        const iconHtml = node.thumbnail ? `<img src="${node.thumbnail}" class="thumbnail-icon">` : `<i class="${node.icon || (isFolder ? 'fas fa-folder' : 'fas fa-puzzle-piece')}"></i>`;
        const gearHtml = adminMode ? `<div class="gear-icon" data-gear-id="${node.id}"><i class="fas fa-cog"></i></div>` : '';
        const statusHtml = (!isFolder && node.status) ? `<div class="status-badge"><i class="fas ${node.status === 'running' ? 'fa-play' : 'fa-stop'}"></i> ${node.status === 'running' ? 'فعال' : 'متوقف'}</div>` : '';
        const resourceHint = (!isFolder && node.settings?.resources) ? `<div style="font-size:0.65rem; margin-top:4px;">💻 CPU: ${node.settings.resources.cpu_limit} | 🧠 RAM: ${node.settings.resources.ram_limit_mb}MB</div>` : '';
        html += `
            <div class="card ${isFolder ? 'folder-card' : 'module-card'}" data-id="${node.id}" data-type="${node.type}">
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
    if (adminMode) {
        html += `<div class="card add-card" id="addNewCardBtn"><div class="card-content"><i class="fas fa-plus-circle"></i><div class="card-title">افزودن محتوا</div><div class="card-desc">پوشه / ZIP / کتابخانه</div></div></div>`;
    }
    container.innerHTML = html;
    document.querySelectorAll('.card:not(.add-card)').forEach(card => {
        const id = card.getAttribute('data-id');
        const type = card.getAttribute('data-type');
        card.addEventListener('click', (e) => {
            if (e.target.closest('.gear-icon')) return;
            if (type === 'folder') { currentFolderId = id; renderAll(); }
            else { Swal.fire({ icon: 'info', title: 'ماژول', text: `کلیک روی "${itemsMap.get(id)?.name}" → محتوای مستقل بارگذاری می‌شود.`, toast: true, timer: 1200 }); }
        });
        const gear = card.querySelector('.gear-icon');
        if (gear) gear.addEventListener('click', (e) => { e.stopPropagation(); openGearMenu(id); });
    });
    const addBtn = document.getElementById("addNewCardBtn");
    if (addBtn && adminMode) addBtn.addEventListener('click', openAddMasterDialog);
}

function renderAll() {
    renderBreadcrumb();
    renderCards();
}

// اضافه کردن دکمه کش در نوار ویژگی‌ها (اختیاری)
function addCacheButton() {
    const banner = document.querySelector('.features-banner');
    const cacheChip = document.createElement('div');
    cacheChip.className = 'feature-chip';
    cacheChip.innerHTML = '<i class="fas fa-database"></i> اطلاعات کش پکیج';
    cacheChip.style.cursor = 'pointer';
    cacheChip.addEventListener('click', showCacheInfo);
    banner.appendChild(cacheChip);
}

document.getElementById("adminToggle").addEventListener('change', (e) => {
    adminMode = e.target.checked;
    renderAll();
});

function initDarkMode() {
    const darkToggle = document.getElementById('darkModeToggle');
    const isDark = localStorage.getItem('modulehub-theme') === 'dark';
    if (isDark) document.body.classList.add('dark');
    darkToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('modulehub-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
}

initDarkMode();
addCacheButton();
renderAll();