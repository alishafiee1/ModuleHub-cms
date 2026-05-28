/* ============================================================================================
   FILE: script.js
   PROJECT: HaderBash.ir
   LAYER: Client - Logic
   
   PURPOSE: Main JavaScript for landing page with floating icons and CMS loading
   
   CAPABILITIES:
   - Dark/Light theme management with localStorage
   - Floating animated icons with rotation and mouse interaction
   - CMS loading via fetch (from /cms/cms.html)
   - Navigation menu interactions
   - PostMessage communication with CMS for theme sync
   ============================================================================================ */

// ========== DOM Elements ==========
const darkToggle = document.getElementById('darkToggleMain');
const cmsPlaceholder = document.getElementById('cmsPlaceholder');
const floatingBg = document.getElementById('floatingBg');

// ========== Theme Management ==========
let currentTheme = localStorage.getItem('haderbash-theme') || 'light';

// Apply initial theme
if (currentTheme === 'dark') {
    document.body.classList.add('dark');
    updateDarkToggleIcon(true);
} else {
    document.body.classList.remove('dark');
    updateDarkToggleIcon(false);
}

// Dark mode toggle handler
darkToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    currentTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('haderbash-theme', currentTheme);
    updateDarkToggleIcon(isDark);
    
    // Send theme change to CMS iframe
    const cmsIframe = document.getElementById('cmsIframe');
    if (cmsIframe && cmsIframe.contentWindow) {
        cmsIframe.contentWindow.postMessage({ type: 'theme-change', theme: currentTheme }, '*');
    }
});

function updateDarkToggleIcon(isDark) {
    const icon = darkToggle.querySelector('i');
    const text = darkToggle.querySelector('span');
    if (isDark) {
        icon.className = 'fas fa-sun';
        text.textContent = 'لایت مود';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'دارک مود';
    }
}

// ========== Floating Icons with Rotation & Mouse Interaction ==========
const iconClasses = [
    'fas fa-microchip', 'fas fa-wifi', 'fas fa-cloud-upload-alt', 
    'fas fa-chart-line', 'fas fa-database', 'fab fa-docker', 
    'fas fa-microphone-alt', 'fas fa-satellite-dish', 'fas fa-robot',
    'fas fa-broadcast-tower', 'fas fa-server', 'fas fa-shield-alt',
    'fas fa-cogs', 'fas fa-bluetooth', 'fas fa-plug', 'fas fa-thermometer-half'
];

function createFloatingIcons() {
    if (!floatingBg) return;
    floatingBg.innerHTML = '';
    
    const iconCount = window.innerWidth < 768 ? 16 : 28;
    
    for (let i = 0; i < iconCount; i++) {
        const icon = document.createElement('i');
        const randomClass = iconClasses[Math.floor(Math.random() * iconClasses.length)];
        icon.className = `${randomClass} floating-icon`;
        
        // Random size between 18px and 48px
        const size = Math.random() * 30 + 18;
        icon.style.fontSize = size + 'px';
        
        // Random position
        icon.style.left = Math.random() * 100 + '%';
        icon.style.top = Math.random() * 100 + '%';
        
        // Random animation duration between 12s and 30s
        const duration = Math.random() * 18 + 12;
        icon.style.animation = `floatRotate ${duration}s infinite ease-in-out`;
        icon.style.animationDelay = Math.random() * 10 + 's';
        
        // Set color based on theme
        updateFloatingIconColor(icon);
        
        // Mouse interaction: move away from cursor slightly and rotate more
        icon.addEventListener('mousemove', (e) => {
            const rect = icon.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const iconCenterX = rect.left + rect.width / 2;
            const iconCenterY = rect.top + rect.height / 2;
            
            // Calculate distance and direction
            const deltaX = (mouseX - iconCenterX) * 0.04;
            const deltaY = (mouseY - iconCenterY) * 0.04;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxOffset = 25;
            const offsetX = Math.min(Math.max(deltaX, -maxOffset), maxOffset);
            const offsetY = Math.min(Math.max(deltaY, -maxOffset), maxOffset);
            const rotation = (offsetX + offsetY) * 0.8;
            
            icon.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
            icon.style.opacity = '0.35';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = '';
            icon.style.opacity = '';
        });
        
        floatingBg.appendChild(icon);
    }
}

function updateFloatingIconColor(icon) {
    if (!icon) return;
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
        icon.style.color = '#5bb4e0';
        icon.style.opacity = '0.18';
    } else {
        icon.style.color = '#1a2a3a';
        icon.style.opacity = '0.1';
    }
}

function updateAllFloatingIconsColors() {
    const icons = document.querySelectorAll('.floating-icon');
    icons.forEach(icon => updateFloatingIconColor(icon));
}

// Add keyframe animation dynamically if not exists
if (!document.querySelector('#floating-keyframes')) {
    const style = document.createElement('style');
    style.id = 'floating-keyframes';
    style.textContent = `
        @keyframes floatRotate {
            0% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(3deg); }
            50% { transform: translateY(-30px) rotate(6deg); }
            75% { transform: translateY(-15px) rotate(3deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
    `;
    document.head.appendChild(style);
}

// ========== CMS Loading (Embedded Fallback) ==========
async function loadCMS() {
    if (!cmsPlaceholder) return;
    
    // اگر فایل CMS در دسترس نبود، از محتوای جاسازی شده استفاده کن
    const embeddedCMS = `
        <div class="cms-embedded">
            <div style="padding: 2rem; text-align: center;">
                <i class="fas fa-puzzle-piece" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem; display: inline-block;"></i>
                <h3 style="margin-bottom: 1rem;">سیستم مدیریت ماژول‌ها (CMS)</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">برای استفاده کامل از CMS، فایل‌ها را روی سرور قرار دهید.</p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.HaderBash?.retryLoadCMS()" class="btn-outline" style="padding: 0.5rem 1.2rem;">تلاش مجدد</button>
                    <button onclick="showDemoModules()" class="btn-primary" style="padding: 0.5rem 1.2rem;">مشاهده دمو</button>
                </div>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch('/cms/cms.html');
        if (!response.ok) throw new Error('CMS file not found');
        let html = await response.text();
        cmsPlaceholder.innerHTML = `<div id="cms-container">${html}</div>`;
        
        // استخراج و اجرای اسکریپت‌ها
        const scripts = cmsPlaceholder.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
            oldScript.remove();
        });
    } catch (error) {
        console.warn('CMS file not found, using embedded demo:', error);
        cmsPlaceholder.innerHTML = embeddedCMS;
    }
}

// دموی ماژول‌ها
window.showDemoModules = function() {
    const container = document.getElementById('cmsPlaceholder');
    if (!container) return;
    
    container.innerHTML = `
        <div style="padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <h3 style="margin: 0;"><i class="fas fa-puzzle-piece"></i> مدیریت ماژول‌ها (دمو)</h3>
                <button onclick="location.reload()" class="btn-outline" style="padding: 0.3rem 1rem;"><i class="fas fa-sync-alt"></i> بازگشت</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                <div class="demo-card" style="background: var(--bg-surface); border-radius: 1rem; padding: 1rem; border: 1px solid var(--border-light);">
                    <div style="display: flex; justify-content: space-between;"><i class="fas fa-images" style="font-size: 2rem; color: var(--accent);"></i><span class="status-badge running">فعال</span></div>
                    <h4>گالری نمونه کارها</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">پروژه‌های IoT و معماری</p>
                    <div style="font-size: 0.7rem;">💻 CPU: 0.5 | 🧠 RAM: 512MB</div>
                </div>
                <div class="demo-card" style="background: var(--bg-surface); border-radius: 1rem; padding: 1rem; border: 1px solid var(--border-light);">
                    <div style="display: flex; justify-content: space-between;"><i class="fab fa-markdown" style="font-size: 2rem; color: var(--accent);"></i><span class="status-badge running">فعال</span></div>
                    <h4>داکیومنت فنی</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">مستندات میکروکنترلرها</p>
                    <div style="font-size: 0.7rem;">💻 CPU: 0.3 | 🧠 RAM: 256MB</div>
                </div>
                <div class="demo-card" style="background: var(--bg-surface); border-radius: 1rem; padding: 1rem; border: 1px solid var(--border-light);">
                    <div style="display: flex; justify-content: space-between;"><i class="fas fa-chart-line" style="font-size: 2rem; color: var(--accent);"></i><span class="status-badge stopped">متوقف</span></div>
                    <h4>مانیتورینگ لحظه‌ای</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">نمودارهای زنده سنسورها</p>
                    <div style="font-size: 0.7rem;">💻 CPU: 0.8 | 🧠 RAM: 1024MB</div>
                </div>
                <div class="demo-card" style="background: var(--bg-surface); border-radius: 1rem; padding: 1rem; border: 1px solid var(--border-light);">
                    <div style="display: flex; justify-content: space-between;"><i class="fas fa-store" style="font-size: 2rem; color: var(--accent);"></i><span class="status-badge running">فعال</span></div>
                    <h4>فروشگاه قطعات</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">ماژول‌های IoT</p>
                    <div style="font-size: 0.7rem;">💻 CPU: 0.6 | 🧠 RAM: 768MB</div>
                </div>
                <div class="demo-card add-card-demo" style="background: var(--bg-surface); border-radius: 1rem; padding: 1rem; border: 2px dashed var(--accent); text-align: center; cursor: pointer;" onclick="alert('در نسخه کامل، می‌توانید ماژول جدید اضافه کنید.')">
                    <i class="fas fa-plus-circle" style="font-size: 2rem; color: var(--accent);"></i>
                    <h4>افزودن ماژول جدید</h4>
                    <p style="font-size: 0.8rem;">ZIP / کتابخانه</p>
                </div>
            </div>
            <div style="margin-top: 1rem; padding: 0.5rem; background: var(--bg-surface); border-radius: 0.5rem; font-size: 0.7rem; text-align: center;">
                <i class="fas fa-info-circle"></i> این یک نمای دمو است. برای استفاده از CMS کامل، فایل‌ها را روی سرور قرار دهید.
            </div>
        </div>
    `;
};

window.HaderBash = window.HaderBash || {};
window.HaderBash.retryLoadCMS = loadCMS;

// Setup postMessage listener for CMS theme sync
function setupCMSThemeSync() {
    window.addEventListener('message', (event) => {
        // Handle theme change from CMS
        if (event.data && event.data.type === 'cms-theme-changed') {
            const cmsTheme = event.data.theme;
            if (cmsTheme === 'dark' && !document.body.classList.contains('dark')) {
                document.body.classList.add('dark');
                currentTheme = 'dark';
                localStorage.setItem('haderbash-theme', 'dark');
                updateDarkToggleIcon(true);
                updateAllFloatingIconsColors();
            } else if (cmsTheme === 'light' && document.body.classList.contains('dark')) {
                document.body.classList.remove('dark');
                currentTheme = 'light';
                localStorage.setItem('haderbash-theme', 'light');
                updateDarkToggleIcon(false);
                updateAllFloatingIconsColors();
            }
        }
    });
}

// ========== Navigation Menu Interactions ==========
function setupNavigation() {
    const navHome = document.getElementById('navHome');
    const navTech = document.getElementById('navTech');
    const navMCU = document.getElementById('navMCU');
    const navIoT = document.getElementById('navIoT');
    const navShop = document.getElementById('navShop');
    const navDocs = document.getElementById('navDocs');
    const navCmsTrigger = document.getElementById('navCmsTrigger');
    const heroCta = document.getElementById('heroCta');
    const heroGallery = document.getElementById('heroGallery');
    
    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    if (navTech) {
        navTech.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'تکنولوژی‌های HaderBash',
                html: `
                    <div style="text-align: right; direction: rtl;">
                        <p><i class="fas fa-microchip"></i> <strong>میکروکنترلرها:</strong> ESP8266, ESP32, STM32, Arduino</p>
                        <p><i class="fas fa-wifi"></i> <strong>پروتکل‌ها:</strong> MQTT, HTTP, WebSocket, LoRa</p>
                        <p><i class="fab fa-docker"></i> <strong>استقرار:</strong> Docker, Kubernetes</p>
                        <p><i class="fas fa-database"></i> <strong>ذخیره‌سازی:</strong> InfluxDB, PostgreSQL, Redis</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'متوجه شدم'
            });
        });
    }
    
    if (navMCU) {
        navMCU.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'میکروکنترلرهای پشتیبانی شده',
                html: `
                    <div style="text-align: right;">
                        <p>✅ ESP8266 / ESP32</p>
                        <p>✅ STM32 (F1, F4, H7 series)</p>
                        <p>✅ Arduino (Uno, Mega, Nano)</p>
                        <p>✅ Raspberry Pi Pico</p>
                        <p>✅ TI MSP430</p>
                    </div>
                `,
                icon: 'info'
            });
        });
    }
    
    if (navIoT) {
        navIoT.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'IoT و ابر',
                html: '<p>اتصال امن دستگاه‌ها به ابر • مانیتورینگ لحظه‌ای • دشبورد اختصاصی • ذخیره‌سازی داده‌ها • آنالیز و گزارش‌گیری</p>',
                icon: 'info'
            });
        });
    }
    
    if (navShop) {
        navShop.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'فروشگاه قطعات',
                text: 'به زودی... فروشگاه آنلاین قطعات IoT و ماژول‌های HaderBash',
                icon: 'info'
            });
        });
    }
    
    if (navDocs) {
        navDocs.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'داکیومنت جامع',
                text: 'راهنمای نصب، مستندات API، آموزش فریمور نویسی و کانفیگ دستگاه‌ها',
                icon: 'info'
            });
        });
    }
    
    if (navCmsTrigger) {
        navCmsTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('cmsPlaceholder').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    if (heroCta) {
        heroCta.addEventListener('click', () => {
            Swal.fire({
                title: 'شروع رایگان',
                text: 'فرم ثبت‌نام به زودی فعال می‌شود. جهت اطلاع از زمان رونمایی، ایمیل خود را وارد کنید.',
                input: 'email',
                inputPlaceholder: 'example@domain.com',
                showCancelButton: true,
                confirmButtonText: 'ثبت نام',
                cancelButtonText: 'بعداً'
            });
        });
    }
    
    if (heroGallery) {
        heroGallery.addEventListener('click', () => {
            Swal.fire({
                title: 'نمونه کارها',
                html: `
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; direction: rtl;">
                        <div><img src="https://picsum.photos/100/100?random=1" style="border-radius: 16px; width: 90px; height: 90px; object-fit: cover;"></div>
                        <div><img src="https://picsum.photos/100/100?random=2" style="border-radius: 16px; width: 90px; height: 90px; object-fit: cover;"></div>
                        <div><img src="https://picsum.photos/100/100?random=3" style="border-radius: 16px; width: 90px; height: 90px; object-fit: cover;"></div>
                        <div><img src="https://picsum.photos/100/100?random=4" style="border-radius: 16px; width: 90px; height: 90px; object-fit: cover;"></div>
                    </div>
                    <p style="margin-top: 1rem;">پروژه‌های IoT | نظارت بر دما | رباتیک | خانه هوشمند | گلخانه هوشمند</p>
                `,
                confirmButtonText: 'بستن'
            });
        });
    }
}

// ========== Watch for theme changes to update floating icons ==========
const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            updateAllFloatingIconsColors();
        }
    });
});
themeObserver.observe(document.body, { attributes: true });

// ========== Handle window resize ==========
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        createFloatingIcons();
    }, 250);
});

// ========== Initialize everything on DOM load ==========
document.addEventListener('DOMContentLoaded', () => {
    createFloatingIcons();
    setupNavigation();
    loadCMS();
});

// Export for debugging (optional)
window.HaderBash = {
    reloadCMS: loadCMS,
    getTheme: () => currentTheme,
    setTheme: (theme) => {
        if (theme === 'dark' && !document.body.classList.contains('dark')) {
            darkToggle.click();
        } else if (theme === 'light' && document.body.classList.contains('dark')) {
            darkToggle.click();
        }
    }
};