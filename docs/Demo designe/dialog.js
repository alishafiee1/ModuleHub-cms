// dialog.js - ماژول مدیریت دیالوگ‌های پیشرفته (آیکون، تصویر، منابع)
const ModuleDialogs = (function() {
    // کتابخانه آیکون‌های پیشنهادی
    const iconLibrary = [
        "fas fa-images", "fas fa-chart-line", "fab fa-react", "fab fa-docker",
        "fas fa-cube", "fas fa-file-alt", "fas fa-video", "fas fa-music",
        "fas fa-store", "fas fa-graduation-cap", "fas fa-tachometer-alt", "fas fa-database"
    ];

    async function showResourceAndIconDialog(initialData = {}) {
        const defaultResources = {
            cpu_limit: 0.5,
            ram_limit_mb: 512,
            swap_limit_mb: 128,
            icon: "fas fa-cube",
            thumbnail: null, // base64 یا URL
            moduleName: "",
            moduleDesc: ""
        };
        const data = { ...defaultResources, ...initialData };
        
        // ساخت HTML پویا برای انتخاب آیکون و منابع
        const iconOptionsHtml = iconLibrary.map(icon => `
            <div class="icon-option" data-icon="${icon}">
                <i class="${icon}" style="font-size: 1.8rem;"></i>
            </div>
        `).join('');
        
        const { value: result } = await Swal.fire({
            title: 'تنظیمات ماژول: منابع، آیکون و تصویر کارت',
            html: `
                <div style="text-align:right;">
                    <label>نام ماژول</label>
                    <input id="mod-name" class="swal2-input" value="${data.moduleName}" placeholder="نام کارت">
                    <label>توضیحات</label>
                    <textarea id="mod-desc" class="swal2-textarea" placeholder="توضیحات کوتاه">${data.moduleDesc}</textarea>
                    
                    <label>آیکون کارت (انتخاب از کتابخانه)</label>
                    <div id="icon-selector-container" class="icon-selector">${iconOptionsHtml}</div>
                    <input id="custom-icon" class="swal2-input" placeholder="یا آیکون سفارشی (مثلاً fas fa-rocket)" value="${data.icon}">
                    
                    <label>تصویر کارت (آپلود، اختیاری)</label>
                    <input type="file" id="card-thumbnail" accept="image/*">
                    <div id="thumbnail-preview" style="margin: 8px 0;"></div>
                    
                    <hr>
                    <label>محدودیت CPU (هسته): <span id="cpu-val">${data.cpu_limit}</span></label>
                    <input type="range" id="cpu-limit" class="resource-slider" min="0.1" max="2" step="0.1" value="${data.cpu_limit}">
                    
                    <label>محدودیت RAM (MB): <span id="ram-val">${data.ram_limit_mb}</span></label>
                    <input type="range" id="ram-limit" class="resource-slider" min="128" max="4096" step="64" value="${data.ram_limit_mb}">
                    
                    <label>محدودیت Swap (MB): <span id="swap-val">${data.swap_limit_mb}</span></label>
                    <input type="range" id="swap-limit" class="resource-slider" min="0" max="1024" step="32" value="${data.swap_limit_mb}">
                </div>
            `,
            focusConfirm: false,
            confirmButtonText: 'ذخیره و ادامه',
            cancelButtonText: 'انصراف',
            showCancelButton: true,
            preConfirm: () => {
                const selectedIconElem = document.querySelector('#icon-selector-container .icon-option.selected');
                let finalIcon = document.getElementById('custom-icon').value;
                if (selectedIconElem && !finalIcon) finalIcon = selectedIconElem.getAttribute('data-icon');
                if (!finalIcon) finalIcon = "fas fa-cube";
                
                const thumbnailFile = document.getElementById('card-thumbnail').files[0];
                let thumbnailData = null;
                if (thumbnailFile) {
                    const reader = new FileReader();
                    // برای سادگی در دمو، فقط نام فایل را ذخیره می‌کنیم (در واقعیت base64 یا آدرس)
                    thumbnailData = thumbnailFile.name;
                }
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
                // تنظیم event listeners برای اسلایدرها و انتخاب آیکون
                const cpuSlider = document.getElementById('cpu-limit');
                const ramSlider = document.getElementById('ram-limit');
                const swapSlider = document.getElementById('swap-limit');
                cpuSlider.addEventListener('input', () => document.getElementById('cpu-val').innerText = cpuSlider.value);
                ramSlider.addEventListener('input', () => document.getElementById('ram-val').innerText = ramSlider.value);
                swapSlider.addEventListener('input', () => document.getElementById('swap-val').innerText = swapSlider.value);
                
                // انتخاب آیکون
                const iconOptions = document.querySelectorAll('.icon-option');
                iconOptions.forEach(opt => {
                    opt.addEventListener('click', () => {
                        iconOptions.forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        document.getElementById('custom-icon').value = opt.getAttribute('data-icon');
                    });
                });
                // پیش‌نمایش تصویر
                const thumbInput = document.getElementById('card-thumbnail');
                const previewDiv = document.getElementById('thumbnail-preview');
                thumbInput.addEventListener('change', (e) => {
                    if (e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            previewDiv.innerHTML = `<img src="${ev.target.result}" style="max-width:100px; border-radius:12px;">`;
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
            title: `لاگ‌های ماژول: ${moduleName}`,
            html: `<pre style="text-align:left; direction:ltr; background:#1e1e2f; color:#f0f0f0; padding:12px; border-radius:12px; max-height:400px; overflow:auto;">${logsContent}</pre>`,
            icon: 'info',
            confirmButtonText: 'بستن',
            width: '700px'
        });
    }

    async function showCacheInfoDialog() {
        await Swal.fire({
            title: 'کش متمرکز پکیج‌ها',
            html: `<div style="text-align:right;">
                <p>✅ وضعیت کش فعال است.</p>
                <p>📦 تعداد پکیج‌های کش شده: ۳۲</p>
                <p>💾 حجم کل کش: ۴۵۲ MB</p>
                <p>🕒 آخرین به‌روزرسانی: امروز ۱۴:۳۰</p>
                <hr>
                <small>هر ماژول با package.json یا requirements.txt جدید، به‌طور خودکار کش می‌شود.</small>
            </div>`,
            confirmButtonText: 'بستن'
        });
    }

    return {
        showResourceAndIconDialog,
        showLogsDialog,
        showCacheInfoDialog
    };
})();