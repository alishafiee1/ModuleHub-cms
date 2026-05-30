# برنامهٔ افزودن خروج (Sign‑out) و تغییر رمز عبور ادمین

## مقدمه
در این مستند، گام‌های لازم برای اضافه کردن دو قابلیت مهم به ماژول احراز هویت ادمین در **ModuleHub‑CMS** توضیح داده می‌شود:
1. خروج امن ادمین (sign‑out)
2. تغییر رمز عبور ادمین (change‑password)

تمامی تغییرات بر پایهٔ کدهای موجود در `admin-login-route.ts` و `admin-users-loader.ts` انجام می‌شود و از ابزارهای موجود پروژه مثل **CSRF protection**, **rate‑limiter**, **bcrypt** بهره می‌برد.

---

## 1️⃣ خروج (Sign‑out)
### اهداف
- پاک‌سازی سشن سرور و کوکی‌های مربوط به جلسه
- اعتبارسنجی توکن CSRF برای جلوگیری از حملات تقاطعی
- اعمال محدودیت تعداد درخواست (rate‑limiter)

### کارهای اجرایی
| # | توضیح | مسئول | زمان تقریبی |
|---|-------|------|--------------|
| 1.1 | اضافه کردن فراخوانی `ensureSessionCsrfToken(request)` در `postAdminLogoutHandler` | توسعه‌دهنده | 15 دقیقه |
| 1.2 | پاک‌سازی سشن با `clearAuthSession(request)` (در حال حاضر موجود) | توسعه‌دهنده | 10 دقیقه |
| 1.3 | حذف کوکی `sessionId` با `response.clearCookie('sessionId')` | توسعه‌دهنده | 10 دقیقه |
| 1.4 | تعریف `logoutRateLimiter` با استفاده از `createLoginRateLimiter()` و اعمال آن در مسیر `/admin/logout` | توسعه‌دهنده | 15 دقیقه |
| 1.5 | به‌روزرسانی مستندات OpenAPI (`openspec/admin-auth.yaml`) | نویسنده مستندات | 20 دقیقه |
| 1.6 | نوشتن تست واحد برای مسیر logout (موفق، توکن CSRF گم‌شده، بیش از حد درخواست) | QA | 30 دقیقه |

### معیارهای پذیرش
- **200 OK** با پیام `{ message: 'Logged out' }` در حضور توکن CSRF معتبر
- سشن سرور پاک شده و کوکی `sessionId` حذف شود
- در صورت عبور از سقف محدودیت، **429 Too Many Requests** برگردد
- مستندات به‌روز شوند

---

## 2️⃣ تغییر رمز عبور ادمین (Change‑Password)
### اهداف
- فراهم کردن امکان تغییر رمز عبور توسط ادمین احراز هویت‌دار
- اطمینان از صحت رمز فعلی، قوت رمز جدید و جلوگیری از حملات Brute‑Force
- به‌روزرسانی ایمن `admin-users.json`

### کارهای اجرایی
| # | توضیح | مسئول | زمان تقریبی |
|---|-------|------|--------------|
| 2.1 | تعریف اینترفیس بدنهٔ درخواست: `{ currentPassword, newPassword, confirmPassword }` | توسعه‌دهنده | 10 دقیقه |
| 2.2 | پیاده‌سازی تابع کمکی `validateNewPassword(password)` (حداقل 8 کاراکتر، شامل حروف و ارقام) | توسعه‌دهنده | 15 دقیقه |
| 2.3 | افزودن `postAdminChangePasswordHandler`:
- چک کردن `request.session.authScope === 'super-admin'`
- اعتبارسنجی CSRF
- بررسی صحت رمز فعلی با `verifyPassword`
- اعتبارسنجی رمز جدید و تطبیق `confirmPassword`
- هش‌گذاری جدید با `bcrypt.hash`
- ذخیرهٔ امن در `admin-users.json` با `fs.writeFile` اتمیک
- پاسخ `{ message: 'Password changed' }` | توسعه‌دهنده | 45 دقیقه |
| 2.4 | افزودن `changePasswordRateLimiter` (می‌تواند همان `createLoginRateLimiter` باشد) به مسیر `/admin/change-password` | توسعه‌دهنده | 10 دقیقه |
| 2.5 | به‌روزرسانی روت‌ره‌ها در `createAdminLoginRouter` برای مسیر جدید | توسعه‌دهنده | 5 دقیقه |
| 2.6 | افزودن توابع کمکی در `admin-users-loader.ts`:
- `async function updateAdminPassword(username: string, newHash: string): Promise<void>`
- استفاده از `fs.readJson` → modify → `fs.writeJson` با فایل موقت برای اتمیک بودن | توسعه‌دهنده | 20 دقیقه |
| 2.7 | مستندسازی مسیر جدید در OpenAPI (`openspec/admin-auth.yaml`) | نویسنده مستندات | 20 دقیقه |
| 2.8 | نوشتن تست‌های یکپارچه (موفق، رمز فعلی نادرست، رمز جدید ضعیف، توکن CSRF مفقود، Rate‑limit) | QA | 40 دقیقه |

### معیارهای پذیرش
- **200 OK** با پیام `{ message: 'Password changed' }` در صورت موفقیت
- **401 Unauthorized** هنگام عدم تطبیق رمز فعلی
- **400 Bad Request** برای ورودی نادرست (فیلدهای خالی، رمز جدید ضعیف، عدم تطبیق) 
- **403 Forbidden** بدون توکن CSRF
- **429 Too Many Requests** پس از عبور از محدودیت
- `admin-users.json` به‌روزرسانی شود بدون از دست رفتن داده‌های دیگر
- تست‌ها و مستندات کامل باشند

---

## 3️⃣ گام‌های بعدی
1. **ایجاد شاخهٔ ویژگی**: `git checkout -b admin-auth-enhancements`
2. **پیاده‌سازی کدها** طبق جدول بالا
3. **اجرای تست‌ها** (`npm test` یا فریم‌ورک تست موجود)
4. **به‌روزرسانی مستندات** و بازبینی توسط تیم
5. **ایجاد Pull Request** و دریافت بازخورد

---

*این برنامه بر پایهٔ مستندات موجود در پوشهٔ `docs` و کدهای فعلی پروژه‌نویسی شده است.*
