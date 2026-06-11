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

## ۱️⃣ تفاوت‌های کامپایل / اجرا بین **ویندوز** و **اوبونتو**

| حوزه | ویندوز | اوبونتو (Linux) | آیا نیاز به تغییر کد دارد؟ |
|------|--------|----------------|----------------------------

[ignoring loop detection]

### تفاوت‌های کامپایل / اجرا بین ویندوز و اوبونتو  

| بخش | ویندوز | اوبونتو (Linux) | نیاز به تغییر کد |
|------|--------|----------------|-------------------|
| **Node.js** | نصب از MSI یا nvm‑windows؛ مسیرهای مسیر (`PATH`) معمولاً به صورت `C:\Program Files\nodejs` | نصب از بسته باینری یا `nvm`؛ مسیرها به صورت `/usr/local/bin` | **نه** – اسکریپت‌های `npm` با `tsx` به‌صورت کراس‑پلات‌فرم هستند. |
| **فایل‌سیستم** | مسیرها با `\` و درایو (`D:\…`) | مسیرها با `/` و ریشه‌ٔ یکپارچه | در کد موجود مسیرهای سخت‌کد شده وجود ندارد؛ فقط استفاده از `PATHS` (که از `config/paths.ts` می‌آید) مناسب است. |
| **خط فرمان** | PowerShell/Command Prompt می‌تواند `npm run dev` را اجرا کند؛ متغیرهای محیطی با `set` یا `.env` | Bash؛ متغیرها با `export` یا `.env` | **نه** – کتابخانه `dotenv` (اگر استفاده شود) هر دو محیط را پشتیبانی می‌کند. |
| **کتابخانه‌های باینری** (`bcrypt`, `adm-zip`…) | نیاز به کامپایل ماژول‌های native برای VS 2022 یا Build‑Tools؛ ممکن است زمان‌بر باشد | کامپایل با `node‑gyp` روی GCC/Make؛ معمولاً سریع‌تر | اگر پیش‌نیازهای باینری (`python`, `make`, `gcc`) نصب باشند، نیازی به تغییر کد نیست. |
| **پورت گوش دادن** | `127.0.0.1:4000` در هر دو OS | یکسان | **نه** – سرور Express تنظیمات پورت ثابت دارد. |
| **حساسیت به حروف بزرگ/کوچک** | سیستم فایل ویندوز به‌صورت case‑insensitive است | Linux case‑sensitive است | اگر مسیرهایی مثل `./Core` vs `./core` استفاده شده باشد، ممکن است در اوبونتو شکست بخورد. در کد فعلی مسیرها از `PATHS` و `import` با حروف دقیق استفاده می‌شود؛ بنابراین مشکلی نباید باشد. |
| **دستورات npm** | `npm install` → نصب `node_modules` در `C:\…` | نصب در `/home/…` | **نه** – بسته‌ها به‌صورت platform‑agnostic نصب می‌شوند. |

### آیا باید کد را برای اوبونتو تغییر داد؟

- **مسیرهای ثابت**: در `admin-login-route.ts` دو بار `import { PATHS }` وجود دارد؛ یکی تکراری. می‌توانید یکی را حذف کنید، اما این تغییر برای هر دو OS یکسان است.  
- **خطای “Unexpected }”**: ناشی از خطاهای قبلی در ادغام توابع است؛ پس از اصلاح توابع (`postAdminChangePasswordHandler`، `logoutRateLimiter`) دیگر این خطا نباید ظاهر شود.  
- **مجوزهای فایل**: در اوبونتو ممکن است نیاز به `chmod +x` برای اسکریپت‌های shell یا `chmod 644` برای `admin-users.json` باشد. این تنظیمات در کد نیستند، در زمان استقرار اعمال می‌شوند.  

### بررسی کلی معماری کد (استاندارد)

| لایه | توضیح | ارزیابی استاندارد |
|------|------|-------------------|
| **Router / Controller** (`admin-login-route.ts`) | تمام نقاط ورود HTTP (login, logout, change‑password, module‑auth) را تعریف می‌کند. از **Express Router** استفاده می‌شود، مسیرها بدون میدلورهای auth (به‌جز CSRF) تعریف شده‌اند. | مناسب؛ می‌توان میدلورهای **authentication** (مثلاً `requireSuperAdmin`) را برای مسیرهای حساس اضافه کرد. |
| **Service / Business Logic** | توابع `postAdminLoginHandler`, `postAdminLogoutHandler`, `postModuleAuthHandler`، و جدید `postAdminChangePasswordHandler` منطق اصلی را دارند. از توابع کمکی (`verifyPassword`, `ensureSessionCsrfToken`) استفاده می‌شود. | خوب؛ می‌توان منطق را به فایل‌های سرویس جدا کرد (`admin-auth.service.ts`) تا کنترلر فقط درخواست/پاسخ را مدیریت کند. |
| **Data Access** | `admin-users-loader.ts` مسئول بارگذاری و جستجوی کاربران از `admin-users.json` و متغیرهای env است. | ساده و مناسب برای یک پروژه کوچک؛ اگر در آینده دیتابیس استفاده شود، این لایه می‌تواند جایگزین شود. |
| **Config** (`config/paths.ts`) | مسیرهای فایل‌ها (publicDirectory, adminUsers…) در یک مکان متمرکز تعریف شده‌اند. | ✅ الگوی مناسب. |
| **Security** | استفاده از **CSRF token**, **rate‑limiter**, **bcrypt** برای hash رمز. | خوب؛ می‌توان به **Helmet** برای هدرهای امنیتی و **CORS** برای محدودیت‌های دامنه اضافه کرد. |
| **Error Handling** | خطاها به صورت `response.status(...).json({ error: '…' })` بازگردانده می‌شوند. | مناسب؛ می‌توانید یک میدلور خطا جهانی (`errorHandler`) برای قالب‌بندی یکسان استفاده کنید. |
| **Logging** | بسته `winston` در `dependencies` but not used yet. | پیشنهاد: افزودن لاگ‌های مهم مثل ورود/خروج، رکوردهای failed‑auth. |
| **Testing** | `jest` و `supertest` موجود هستند. | تست‌های واحد/یکپارچه برای روت‌ها و سرویس‌ها توصیه می‌شود. |

### خلاصه عملیاتی

1. **اطمینان از حذف مسیر تکراری** `import { PATHS }` در `admin-login-route.ts`.  
2. **بررسی case‑sensitivity** برای تمام مسیرهای import (در اوبونتو حساس است).  
3. **اعمال مجوزهای مناسب** (`chmod`) برای فایل‌های JSON در سرور لینوکس.  
4. **اگر می‌خواهید لایه‌های سرویس/دیتا را جدا کنید** – می‌توانید یک پوشه `services` و `repositories` اضافه کنید.  
5. **اضافه کردن میدلور لاگ و error‑handler** برای سازگاری بیشتر با استانداردهای اداری.  

با این تغییرات، پروژه هم در ویندوز و هم در اوبونتو بدون تغییر اساسی قابل اجراست و معماری به‌صورت ماژولار و قابل گسترش باقی می‌ماند.