# پلن اصلاح ModuleHub-CMS
> نماینده Cursor: این سند را کامل بخوان. هر مورد شامل **چرا، چی، و کجا** است.
> تاریخ تهیه: ۱۴۰۵/۰۳/۲۹ | وضعیت: آماده برای اجرا

---

## مرور کلی — سه مورد اصلی

| # | عنوان | نوع کار | اولویت |
|---|-------|---------|--------|
| مورد ۱ | استاندارد `module.json` + راهنمای AI | داکیومنت + اصلاح تناقض در داک‌های اصلی | 🔴 بالا |
| مورد ۲ | Docker-only برای بک‌اند + پیام راهنما | پروپزال جدید + اصلاح داک‌های اصلی + کد CMS | 🔴 بالا |
| مورد ۳ | Migration از `site-layout.json` قدیمی | اسکریپت migration | 🟡 متوسط |
| مورد ۴ | یکپارچه‌سازی card-view + card-live | بازنویسی هر دو پروپزال → یک پروپزال واحد | 🟡 متوسط |

---

---

# مورد ۱ — استاندارد `module.json` + راهنمای AI-Ready

## خلاصه تصمیم
ماژول‌ها دیگر نیازی به wizard سؤال‌محور ندارند. هر ماژول یک فایل `module.json` دارد که توسعه‌دهنده یا AI آن را می‌سازد. یک فایل راهنما (`module-json-ai-guide.md`) استاندارد را برای AI agent توضیح می‌دهد.

## دلیل اضافه شدن رویکرد AI-Ready
امروز اکثر ماژول‌ها با کمک AI نوشته می‌شوند. اگر استاندارد `module.json` مستند و واضح باشد، توسعه‌دهنده فقط کافی است کد ماژول را به AI بدهد تا فایل manifest را بسازد — بدون نیاز به wizard و بدون حدس و خطا. در فاز بعد می‌توان یک script نوشت که این کار را خودکار انجام دهد.

## تناقضی که باید اصلاح شود

### فایل: `docs/proposal.md` (داکیومنت اصلی)
**مشکل:** در بخش نصب ماژول نوشته شده که بعد از آپلود ZIP، سیستم یک فرم نشان می‌دهد و تنظیمات را از طریق سؤال از ادمین جمع‌آوری می‌کند. این با رویکرد manifest-based جدید **متناقض** است.

**اصلاح مورد نیاز:**
در بخش «نصب ماژول» (Installation) این جمله یا بخش مشابه را حذف یا جایگزین کن:
> ❌ «سیستم بعد از آپلود فرم نشون میده»
> ✅ «هر ZIP معتبر باید فایل `module.json` داشته باشد. اگر این فایل وجود نداشت، CMS پیام خطا نشان می‌دهد و راهنمای ساخت manifest را لینک می‌دهد.»

### فایل: `docs/architecture-and-structure.md`
**مشکل:** ساختار فایل‌های ماژول در این فایل تعریف شده ولی `module.json` ذکر نشده.

**اصلاح مورد نیاز:**
در بخش «ساختار ZIP ماژول» این را اضافه کن:
```
module-name.zip
├── module.json         ← (اجباری) شناسنامه ماژول
├── frontend/           ← فایل‌های UI
│   └── index.html
├── backend/            ← (اختیاری) فقط اگر Docker دارد
│   └── Dockerfile
└── card.html           ← (اختیاری) کارت سفارشی
```

## فایل‌های جدیدی که باید ساخته شوند

### فایل ۱: `docs/standards/module-json-spec.md`
این فایل استاندارد کامل `module.json` را تعریف می‌کند. محتوا:

```markdown
# استاندارد module.json

## ساختار کامل

```json
{
  "id": "unique-module-id",
  "name": "نام نمایشی ماژول",
  "version": "1.0.0",
  "description": "توضیح کوتاه",
  "type": "frontend-only | frontend-backend | backend-only",
  
  "install": {
    "hasBackend": false,
    "dockerRequired": false,
    "entryPoint": "frontend/index.html"
  },
  
  "backend": {
    "dockerComposePath": "backend/docker-compose.yml",
    "internalPort": 3000,
    "healthCheck": "/health"
  },
  
  "card": {
    "hasCustomCard": false,
    "cardPath": "card.html",
    "cardDataEndpoint": "/__modulehub/card-ui"
  },
  
  "meta": {
    "author": "نام سازنده",
    "tags": ["iot", "dashboard"],
    "icon": "assets/icon.png"
  }
}
```

## قوانین اجباری
- `id`, `name`, `version`, `type`, `install.hasBackend` اجباری هستند
- اگر `hasBackend: true` باشد، `backend.dockerComposePath` اجباری است
- `id` باید lowercase، بدون فاصله، و یکتا باشد
```

### فایل ۲: `docs/standards/module-json-ai-guide.md`
این فایل برای دادن به AI agent طراحی شده. محتوا:

```markdown
# راهنمای ساخت module.json برای AI Agent

## مأموریت
با خواندن کد ماژول، یک فایل `module.json` معتبر بساز.

## سؤالاتی که باید از کد پیدا کنی
1. آیا فایل Dockerfile یا docker-compose.yml وجود دارد؟ → hasBackend: true
2. آیا فایل HTML اصلی وجود دارد؟ → entryPoint
3. آیا فایل card.html وجود دارد؟ → hasCustomCard: true
4. پورت اصلی که سرویس listen می‌کند چیست؟ → internalPort
5. آیا endpoint سلامت (health check) وجود دارد؟ → healthCheck

## خروجی مورد انتظار
یک فایل JSON معتبر طبق spec بالا. اگر اطلاعاتی پیدا نکردی، آن فیلد را با مقدار پیش‌فرض بذار و یک کامنت توضیحی اضافه کن.

## مثال واقعی
[مثال‌های نمونه از انواع مختلف ماژول]
```

## فایل‌های موجود که باید اصلاح شوند

| فایل | بخش | نوع اصلاح |
|------|-----|-----------|
| `docs/proposal.md` | بخش نصب ماژول | حذف wizard، جایگزین با manifest-check |
| `docs/architecture-and-structure.md` | ساختار ZIP | اضافه کردن `module.json` به درخت فایل |
| `docs/change/add manifest/proposal.md` | بخش معیار موفقیت | اضافه کردن «راهنمای AI-Ready» به معیارها |

---

---

# مورد ۲ — Docker-only برای بک‌اند + پیام راهنما

## خلاصه تصمیم
هر ماژولی که کد بک‌اند دارد (سرور Node، Python، PHP، و...) **باید** در Docker اجرا شود. هیچ بک‌اندی مستقیم روی سرور اجرا نمی‌شود. اگر ماژولی Docker نداشت، CMS نصب را متوقف می‌کند و راهنما نشان می‌دهد.

## تناقضی که باید اصلاح شود

### فایل: `docs/proposal.md`
**مشکل:** در بخش «اجرای بک‌اند» نوشته شده که CMS می‌تواند با `npm install` یا `pip install` وابستگی‌ها را نصب کند و با `systemd-run` پروسه را اجرا کند.

**اصلاح مورد نیاز:**
این بخش را کاملاً جایگزین کن:
> ❌ «CMS با npm install/pip install وابستگی‌ها را نصب می‌کند و با systemd-run اجرا می‌کند»
> ✅ «هر بک‌اند باید در یک Docker container اجرا شود. CMS فقط با `docker compose up/down` آن را مدیریت می‌کند.»

### فایل: `docs/architecture-and-structure.md`
**مشکل:** در معماری سیستم، اشاره‌ای به Docker به عنوان تنها روش اجرای بک‌اند وجود ندارد.

**اصلاح مورد نیاز:**
در بخش معماری، این را اضافه کن:
> «بک‌اندهای ماژول فقط از طریق Docker Compose مدیریت می‌شوند. CMS مستقیماً با سرویس‌های بک‌اند ارتباط برقرار نمی‌کند — فقط docker-compose را صدا می‌زند.»

## پروپزال جدید (کامل): `docs/change/docker-module-policy/proposal.md`

این پروپزال باید در مسیر بالا ساخته شود. محتوای آن:

### بخش ۱ — هدف
تعریف سیاست رسمی CMS برای بک‌اندها: هر کدی که روی سرور نیاز به اجرا و پروسه دارد، باید در Docker باشد.

### بخش ۲ — چرا Docker؟
- **امنیت:** ماژول نمی‌تواند به فایل‌سیستم سرور اصلی دسترسی داشته باشد
- **پاکیزگی:** نصب و حذف بدون باقی ماندن فایل‌های اضافه
- **قابل پیش‌بینی بودن:** هر ماژول محیط خودش را دارد، تداخل با سایرین وجود ندارد
- **مدیریت منابع:** CPU و RAM را می‌توان محدود کرد

### بخش ۳ — جریان نصب ماژول با بک‌اند

```
کاربر ZIP آپلود می‌کند
        ↓
CMS فایل module.json را بررسی می‌کند
        ↓
   hasBackend: true؟
      ↙        ↘
    خیر        بله
     ↓           ↓
  نصب عادی   dockerComposePath وجود دارد؟
                ↙        ↘
              خیر         بله
               ↓           ↓
          نمایش پیام    اجرای docker compose up
          راهنما
```

### بخش ۴ — پیام راهنما برای کاربر (متن دقیق)

وقتی ماژول بک‌اند دارد ولی Docker ندارد، این پیام نمایش داده می‌شود:

```
⚠️ این ماژول شامل کد بک‌اند است

کدی که ارسال کرده‌اید دارای کدهای بک‌اند است که روی سرور نیاز به اجرا 
و مدیریت دارند. برای نصب امن این ماژول، ابتدا آن را در یک بسته Docker 
با محدودیت‌های لازم قرار دهید، سپس دوباره آپلود کنید.

📖 راهنمای داکرایز کردن ماژول را بخوانید  ←  [لینک به راهنما]
🤖 یا این راهنما را به AI agent خود بدهید تا Dockerfile را بسازد
```

### بخش ۵ — تأیید تنظیمات Docker توسط ادمین

بعد از نصب ماژول Docker، ادمین در پنل این موارد را می‌بیند و می‌تواند تغییر دهد:
- محدودیت CPU (مثال: `0.5` یعنی نصف یک هسته)
- محدودیت RAM (مثال: `256m`)
- پورت‌های expose شده
- متغیرهای محیطی (environment variables) — بدون نمایش مقادیر sensitive
- وضعیت container (running/stopped/error)

### بخش ۶ — فایل‌های CMS که باید تغییر کنند

| فایل در کد | تغییر مورد نیاز |
|------------|----------------|
| فایل نصب ماژول (upload handler) | اگر `hasBackend: true` و `dockerComposePath` خالی بود → توقف نصب + نمایش پیام |
| فایل اجرای ماژول (start/stop) | حذف `systemd-run` و `npm install` مستقیم، جایگزین با `docker compose up -d` |
| پنل مدیریت ماژول | اضافه کردن بخش «تنظیمات Docker» |

## فایل‌های موجود که باید اصلاح شوند

| فایل | بخش | نوع اصلاح |
|------|-----|-----------|
| `docs/proposal.md` | اجرای بک‌اند | حذف روش مستقیم، جایگزین با Docker |
| `docs/architecture-and-structure.md` | معماری سیستم | اضافه کردن Docker policy |
| `docs/change/docker-module/proposal.md` | کل سند | به‌روزرسانی با این سیاست رسمی |

---

---

# مورد ۳ — Migration دقیق `site-layout.json`

## وضعیت فعلی
فایل `site-layout.json` الان همه این‌ها را با هم نگه می‌دارد:
- چیدمان کارت‌ها روی بوم (موقعیت، اندازه)
- تنظیمات ماژول (پورت، RAM، CPU)
- وضعیت ماژول (running/stopped)
- اطلاعات شناسنامه‌ای (نام، آیکون، توضیح)

## هدف Migration
جدا کردن این‌ها به دو فایل:
- `site-layout.json` ← فقط چیدمان بوم
- `modules/[module-id]/module.json` ← شناسنامه + تنظیمات هر ماژول

## اسکریپت Migration

فایل جدید: `scripts/migrate-layout-v1-to-v2.js`

```javascript
/**
 * Migration: site-layout.json v1 → v2
 * 
 * v1: همه اطلاعات در یک فایل
 * v2: layout جدا، module.json جدا برای هر ماژول
 * 
 * اجرا: node scripts/migrate-layout-v1-to-v2.js
 */

const fs = require('fs');
const path = require('path');

const LAYOUT_PATH = './data/site-layout.json';
const MODULES_DIR = './data/modules';
const BACKUP_PATH = './data/site-layout.backup.json';

function migrate() {
  // خواندن فایل قدیمی
  const oldLayout = JSON.parse(fs.readFileSync(LAYOUT_PATH, 'utf8'));
  
  // بکاپ قبل از هر کاری
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(oldLayout, null, 2));
  console.log('✅ بکاپ ذخیره شد:', BACKUP_PATH);
  
  // ساختار جدید layout
  const newLayout = {
    version: 2,
    grid: oldLayout.grid || { columns: 12, rows: 'auto' },
    cards: []
  };
  
  // پردازش هر ماژول
  const modules = oldLayout.modules || oldLayout.cards || [];
  
  for (const mod of modules) {
    // ۱. اطلاعات layout (موقعیت و اندازه)
    newLayout.cards.push({
      moduleId: mod.id || mod.moduleId,
      position: {
        x: mod.x ?? mod.position?.x ?? 0,
        y: mod.y ?? mod.position?.y ?? 0,
        w: mod.w ?? mod.width ?? 2,
        h: mod.h ?? mod.height ?? 2
      },
      breakpoints: mod.breakpoints || {}
    });
    
    // ۲. ساخت module.json برای این ماژول
    const moduleDir = path.join(MODULES_DIR, mod.id || mod.moduleId);
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }
    
    // بررسی وجود module.json قبلی
    const moduleJsonPath = path.join(moduleDir, 'module.json');
    if (!fs.existsSync(moduleJsonPath)) {
      const moduleJson = {
        id: mod.id || mod.moduleId,
        name: mod.name || mod.title || 'ماژول بدون نام',
        version: mod.version || '1.0.0',
        description: mod.description || '',
        type: detectType(mod),
        install: {
          hasBackend: !!(mod.port || mod.backendPort),
          entryPoint: mod.entryPoint || 'index.html'
        },
        meta: {
          icon: mod.icon || '',
          tags: mod.tags || []
        },
        _migrated: true,
        _migratedAt: new Date().toISOString(),
        _note: 'این فایل توسط migration خودکار ساخته شده. لطفاً بررسی و تکمیل کنید.'
      };
      
      // اطلاعات بک‌اند اگر وجود داشت
      if (moduleJson.install.hasBackend) {
        moduleJson.backend = {
          dockerComposePath: mod.dockerComposePath || null,
          internalPort: mod.port || mod.backendPort || null,
          healthCheck: mod.healthCheck || '/health',
          _warning: 'اگر dockerComposePath خالی است، این ماژول از روش قدیمی (مستقیم) استفاده می‌کرد. باید داکرایز شود.'
        };
      }
      
      fs.writeFileSync(moduleJsonPath, JSON.stringify(moduleJson, null, 2));
      console.log(`✅ module.json ساخته شد: ${mod.id}`);
    } else {
      console.log(`⏭️  module.json از قبل وجود دارد: ${mod.id}`);
    }
  }
  
  // ذخیره layout جدید
  fs.writeFileSync(LAYOUT_PATH, JSON.stringify(newLayout, null, 2));
  console.log('✅ site-layout.json به نسخه ۲ ارتقا یافت');
  console.log('\n⚠️  توجه: ماژول‌هایی که _migrated: true دارند باید دستی بررسی شوند');
}

function detectType(mod) {
  if (mod.port || mod.backendPort) return 'frontend-backend';
  if (mod.backendOnly) return 'backend-only';
  return 'frontend-only';
}

try {
  migrate();
} catch (err) {
  console.error('❌ خطا در migration:', err.message);
  console.error('بکاپ در:', BACKUP_PATH);
  process.exit(1);
}
```

## نکات مهم Migration

1. **اول بکاپ بگیر** — اسکریپت خودش بکاپ می‌گیرد ولی یک کپی دستی هم بگیر
2. **بعد از migration، ماژول‌هایی که `_migrated: true` دارند را یک‌به‌یک بررسی کن** — اطلاعاتشان ناقص است
3. **ماژول‌هایی که بک‌اند مستقیم دارند** (بدون Docker) در `backend._warning` علامت‌گذاری می‌شوند — باید داکرایز شوند (مورد ۲)
4. **فایل اصلی CMS که `site-layout.json` را می‌خواند** باید آپدیت شود تا با فرمت v2 کار کند

---

---

# مورد ۴ — یکپارچه‌سازی card-view + card-live-customization

## وضعیت فعلی
دو پروپزال جدا داریم که هر دو در مورد کارت حرف می‌زنند:
- `card-view/proposal.md` → سازنده ماژول می‌تواند کارت سفارشی بسازد
- `card-live-customization/proposal.md` → کارت می‌تواند داده زنده داشته باشد

## راه‌حل: سه حالت کارت (رویکرد واحد)

این دو پروپزال باید به **یک پروپزال واحد** تبدیل شوند با عنوان:
`docs/change/card-system/proposal.md`

### سه حالت کارت

#### حالت ۱ — Standard (ادمین / سوپر ادمین)
کاربر پنل ادمین CMS می‌تواند بدون دانش فنی، کارت را شخصی‌سازی کند.

**چه چیزی قابل تنظیم است:**
- رنگ پس‌زمینه کارت
- رنگ متن عنوان
- آیکون (از کتابخانه آیکون یا آپلود)
- عکس پس‌زمینه
- توضیح (Markdown ساده)
- اندازه و موقعیت روی بوم

**ذخیره:** تنظیمات در `site-layout.json` (بخش appearance کارت) ذخیره می‌شود.

**نمونه JSON:**
```json
{
  "moduleId": "my-module",
  "position": { "x": 0, "y": 0, "w": 2, "h": 2 },
  "appearance": {
    "mode": "standard",
    "bgColor": "#1a1a2e",
    "textColor": "#ffffff",
    "icon": "solar:home-bold",
    "description": "**خانه هوشمند** — ۱۲ دستگاه آنلاین"
  }
}
```

#### حالت ۲ — Design (ادمین / سوپر ادمین)
کاربر می‌تواند یک بلوک HTML/CSS/JS کامل را paste کند. این HTML **بدون هیچ حاشیه‌ای** داخل کارت نمایش داده می‌شود.

**امنیت (اجباری):**
این HTML از یک فیلتر امنیتی رد می‌شود که این‌ها را حذف می‌کند:
- تگ `<script>` که به URL خارجی دسترسی دارد
- تگ `<iframe>` با src خارجی
- `onclick` و event handler های inline که `fetch` یا `XMLHttpRequest` دارند
- دسترسی به `window.parent` یا `document.cookie`

کد فیلترشده داخل یک `<iframe sandbox="allow-scripts allow-same-origin">` اجرا می‌شود.

**ذخیره:** HTML فیلترشده در `site-layout.json` (بخش appearance) ذخیره می‌شود.

**نمونه JSON:**
```json
{
  "appearance": {
    "mode": "design",
    "html": "<div style='padding:16px;color:white;background:linear-gradient(135deg,#667eea,#764ba2)'><h2>۱۲ دستگاه</h2><p>همه آنلاین</p></div>",
    "htmlFilteredAt": "2025-06-18T..."
  }
}
```

#### حالت ۳ — Developer (فقط از طریق کد ماژول)
سازنده ماژول داخل ZIP، یک فایل `card.html` قرار می‌دهد. این فایل:
- مستقیم از کد ماژول داده می‌گیرد (از طریق endpoint ماژول)
- هیچ ارتباطی با CMS ندارد — CMS فقط آن را نمایش می‌دهد
- می‌تواند داده زنده داشته باشد (polling یا WebSocket به ماژول خودش)
- داخل `iframe sandbox` اجرا می‌شود

**چه چیزی CMS می‌کند:**
- فایل `card.html` را از ZIP استخراج کرده و ذخیره می‌کند
- یک proxy endpoint برای ارتباط مرورگر با ماژول می‌سازد: `/api/card-proxy/[moduleId]/`
- کارت به این proxy وصل می‌شود، نه مستقیم به پورت ماژول

**ذخیره:** در `module.json` تعریف می‌شود:
```json
{
  "card": {
    "hasCustomCard": true,
    "cardPath": "card.html",
    "cardDataEndpoint": "/__modulehub/card-ui"
  }
}
```

### اولویت نمایش
```
Developer card موجود؟ → نمایش Developer card
       ↓ خیر
Design HTML موجود؟ → نمایش Design HTML  
       ↓ خیر
Standard settings؟ → نمایش Standard card
       ↓ خیر
Fallback → آیکون + نام ماژول
```

### یکپارچه‌سازی دو پروپزال قدیمی

| پروپزال قدیمی | چه می‌شود |
|---------------|-----------|
| `card-view/proposal.md` | بازنویسی می‌شود — فقط به پروپزال جدید اشاره می‌کند و می‌گوید deprecated |
| `card-live-customization/proposal.md` | بازنویسی می‌شود — فقط به پروپزال جدید اشاره می‌کند و می‌گوید deprecated |
| `card-system/proposal.md` (جدید) | پروپزال اصلی و کامل |

---

---

# خلاصه کارهایی که Cursor باید انجام دهد

## کارهای داکیومنتی (فایل‌های docs)

| # | کار | مسیر فایل | نوع |
|---|-----|-----------|-----|
| ۱ | اصلاح بخش نصب ماژول | `docs/proposal.md` | ویرایش |
| ۲ | اصلاح ساختار ZIP | `docs/architecture-and-structure.md` | ویرایش |
| ۳ | ساخت spec کامل | `docs/standards/module-json-spec.md` | فایل جدید |
| ۴ | ساخت راهنمای AI | `docs/standards/module-json-ai-guide.md` | فایل جدید |
| ۵ | ساخت پروپزال Docker policy | `docs/change/docker-module-policy/proposal.md` | فایل جدید |
| ۶ | به‌روزرسانی پروپزال docker-module | `docs/change/docker-module/proposal.md` | ویرایش |
| ۷ | ساخت پروپزال card-system | `docs/change/card-system/proposal.md` | فایل جدید |
| ۸ | Deprecate کردن card-view | `docs/change/card-view/proposal.md` | ویرایش (اضافه کردن deprecated notice) |
| ۹ | Deprecate کردن card-live | `docs/change/card-live-customization/proposal.md` | ویرایش (اضافه کردن deprecated notice) |
| ۱۰ | به‌روزرسانی manifest proposal | `docs/change/add manifest/proposal.md` | ویرایش (اضافه کردن AI-Ready) |

## کارهای کدنویسی (کد CMS)

| # | کار | نوع |
|---|-----|-----|
| ۱ | اسکریپت migration | فایل جدید: `scripts/migrate-layout-v1-to-v2.js` |
| ۲ | Upload handler — چک کردن `module.json` | ویرایش کد موجود |
| ۳ | Upload handler — نمایش پیام Docker warning | ویرایش کد موجود |
| ۴ | Start/Stop ماژول — جایگزینی systemd-run با docker compose | ویرایش کد موجود |
| ۵ | پنل ادمین — بخش تنظیمات Docker | فیچر جدید |
| ۶ | پنل ادمین — سه حالت کارت | فیچر جدید |
| ۷ | Security filter برای Design HTML | ماژول جدید |
| ۸ | Proxy endpoint برای Developer card | endpoint جدید |

---

## ترتیب اجرای پیشنهادی

```
مرحله ۱ (پایه):
  ├── ساخت module-json-spec.md
  ├── ساخت module-json-ai-guide.md
  └── اصلاح داک‌های اصلی (proposal.md, architecture.md)

مرحله ۲ (migration):
  ├── اجرای اسکریپت migration
  └── بررسی دستی ماژول‌های _migrated

مرحله ۳ (Docker policy):
  ├── ساخت docker-module-policy/proposal.md
  ├── اصلاح upload handler
  └── اصلاح start/stop

مرحله ۴ (کارت):
  ├── ساخت card-system/proposal.md
  ├── Deprecate کردن دو پروپزال قدیمی
  └── پیاده‌سازی سه حالت کارت
```

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
  font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
  direction: rtl;
  text-align: right;
}
pre, code {
  direction: ltr;
  text-align: left;
}
.markdown-body table,
.markdown-preview-section table,
table {
  direction: rtl !important;
  text-align: right !important;
  width: 100%;
  border-collapse: collapse;
  margin-inline-start: 0;
  margin-inline-end: auto;
}
.markdown-body th,
.markdown-body td,
.markdown-preview-section th,
.markdown-preview-section td,
table thead th,
table tbody td,
table th,
table td {
  text-align: right !important;
  direction: rtl;
  vertical-align: top;
  padding: 0.35em 0.5em;
}
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
.task-list-item input[type="checkbox"],
input.task-list-item-checkbox {
  margin: 0 0.5em 0 0 !important;
}
</style>