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
table {
  direction: rtl !important;
  text-align: right !important;
  width: 100%;
  border-collapse: collapse;
}
table th, table td {
  text-align: right !important;
  direction: rtl;
  vertical-align: top;
  padding: 0.35em 0.5em;
}
table td code, table th code {
  direction: ltr;
  unicode-bidi: embed;
  display: inline-block;
}
</style>

# رفع مشکل «Invalid or missing CSRF token» در تمام عملیات‌های ادمین

## توضیح ساده: CSRF چیست و چرا استفاده می‌شود؟

### مثال روزمره
فرض کنید شما وارد سایت بانکتان شده‌اید (لاگین کردید). حالا یک سایت مخرب باز می‌کنید. آن سایت مخرب می‌تواند **بدون اطلاع شما** یک فرم مخفی به سمت سایت بانک ارسال کند (مثلاً «۱ میلیون تومان به حساب X انتقال بده»). چون مرورگر شما هنوز کوکی لاگین بانک را دارد، بانک فکر می‌کند **خود شما** این درخواست را فرستادید!

### CSRF Token چطور جلوی این را می‌گیرد؟
سرور یک **کد مخفی تصادفی** (CSRF Token) می‌سازد و فقط به صفحهٔ واقعی خودش می‌دهد. هر وقت صفحه می‌خواهد کاری انجام دهد (مثلاً پوشه بسازد، ماژول حذف کند)، باید این کد را همراه درخواست بفرستد. سایت مخرب این کد را ندارد → سرور درخواست را رد می‌کند.

### جریان در ModuleHub CMS

```
مرورگر                          سرور
  │                               │
  │── GET /api/auth/csrf-token ──→│  ① سرور token تصادفی می‌سازد
  │←── { csrfToken: "abc123" } ──│     و در session ذخیره می‌کند
  │                               │
  │── POST /admin/folder ────────→│  ② مرورگر token را در هدر
  │   Header: X-CSRF-Token:abc123 │     ارسال می‌کند
  │                               │
  │   سرور چک: هدر == session؟   │  ③ مطابقت → اجازه عبور
  │←── 200 OK ───────────────────│     عدم مطابقت → 403 ❌
```

---

## ریشه مشکل

بعد از بررسی کد، **دو مشکل اصلی** پیدا شد:

### مشکل ۱: مسیرهای login router از CSRF رد نمی‌شوند ولی logout و change-password نیاز دارند

در `index.ts` خط ۷۷-۷۸:
```typescript
app.use('/admin', createAdminLoginRouter());   // line 77 — شامل POST /login, /logout, /change-password
app.use('/admin', createAdminCsrfProtectionMiddleware()); // line 78 — CSRF چک
```

مسیرهای `POST /admin/login`، `POST /admin/logout` و `POST /admin/change-password` **قبل** از CSRF middleware ثبت شده‌اند. بنابراین:
- ✅ `POST /login` — درست کار می‌کند (نباید CSRF بخواهد چون کاربر هنوز لاگین نکرده)
- ❌ `POST /logout` — CSRF چک نمی‌شود (مشکل امنیتی)
- ❌ `POST /change-password` — CSRF چک نمی‌شود (مشکل امنیتی)

### مشکل ۲: `requestJson` در فرانت‌اند هدر CSRF را بازنویسی می‌کند

در `api-client.js` خط ۵۹-۶۳:
```javascript
const response = await fetch(url, {
  credentials: 'same-origin',
  headers: buildHeaders(options.headers || {}),  // ← هدر CSRF اینجا اضافه می‌شود
  ...options,  // ← اگر options.headers هم باشد، buildHeaders را بازنویسی می‌کند!
});
```

وقتی `options` شامل `headers: { 'Content-Type': 'application/json' }` باشد، **`...options`** در آخر باعث می‌شود `headers` از `buildHeaders` (که CSRF داشت) **بازنویسی** شود و فقط `Content-Type` بماند — بدون CSRF token!

### مشکل ۳: مسیر `POST /admin/module/:id/auth` هم از CSRF رد نمی‌شود

`createModuleAuthRouter()` در خط ۷۹ ثبت شده — **بعد از** CSRF middleware (خط ۷۸). پس Module Manager auth درست CSRF چک می‌شود. ✅

اما مسیرهای module management (خط ۸۰) هم بعد از CSRF هستند، پس مشکل آنها فقط **مشکل ۲** (بازنویسی هدرها) است.

---

## پلن رفع مشکل

### تغییر ۱: اصلاح `api-client.js` — هدر CSRF هرگز بازنویسی نشود

#### [MODIFY] [api-client.js](file:///d:/2%20Curent%20project%20git/ModuleHub-cms/public/api-client.js)

در تابع `requestJson`، ترتیب merge هدرها را اصلاح کنیم تا `...options` هدرهای CSRF را بازنویسی نکند:

```diff
-    const response = await fetch(url, {
-      credentials: 'same-origin',
-      headers: buildHeaders(options.headers || {}),
-      ...options,
-    });
+    const { headers: extraHeaders, ...restOptions } = options;
+    const response = await fetch(url, {
+      ...restOptions,
+      credentials: 'same-origin',
+      headers: buildHeaders(extraHeaders || {}),
+    });
```

### تغییر ۲: مسیرهای logout و change-password را به بعد از CSRF middleware منتقل کنیم

#### [MODIFY] [admin-login-route.ts](file:///d:/2%20Curent%20project%20git/ModuleHub-cms/core/src/modules/admin-auth/admin-login-route.ts)

`createAdminLoginRouter` فقط باید شامل `GET /login` و `POST /login` باشد (مسیرهایی که **قبل** از احراز هویت هستند و CSRF لازم ندارند).

`POST /logout` و `POST /change-password` را به یک router جداگانه منتقل می‌کنیم که **بعد** از CSRF middleware ثبت شود.

```diff
 export function createAdminLoginRouter(): Router {
   const router = createRouter();
   const loginRateLimiter = createLoginRateLimiter();
-  const logoutRateLimiter = createLoginRateLimiter();

   router.get('/login', getAdminLoginHandler);
   router.post('/login', loginRateLimiter, (request, response) => {
     void postAdminLoginHandler(request, response);
   });
-  router.post('/logout', logoutRateLimiter, (request, response) => {
-    postAdminLogoutHandler(request, response);
-  });
-  router.post('/change-password', loginRateLimiter, (request, response) => {
-    void postAdminChangePasswordHandler(request, response);
-  });

   return router;
 }

+export function createAdminProtectedRouter(): Router {
+  const router = createRouter();
+  const rateLimiter = createLoginRateLimiter();
+
+  router.post('/logout', rateLimiter, (request, response) => {
+    postAdminLogoutHandler(request, response);
+  });
+  router.post('/change-password', rateLimiter, (request, response) => {
+    void postAdminChangePasswordHandler(request, response);
+  });
+
+  return router;
+}
```

#### [MODIFY] [index.ts](file:///d:/2%20Curent%20project%20git/ModuleHub-cms/core/src/server/index.ts)

```diff
   app.use('/admin', createAdminLoginRouter());       // فقط login (بدون CSRF)
   app.use('/admin', createAdminCsrfProtectionMiddleware()); // CSRF برای بقیه
+  app.use('/admin', createAdminProtectedRouter());   // logout + change-password (با CSRF)
```

#### [MODIFY] [index.ts](file:///d:/2%20Curent%20project%20git/ModuleHub-cms/core/src/modules/admin-auth/index.ts)

export جدید `createAdminProtectedRouter` را اضافه کنیم.

---

## نقشه تغییرات فایل‌ها

| فایل | تغییر | دلیل |
|------|--------|-------|
| `public/api-client.js` | اصلاح merge هدرها در `requestJson` | جلوگیری از بازنویسی هدر CSRF |
| `core/src/modules/admin-auth/admin-login-route.ts` | جدا کردن logout/change-password به router جدید | اطمینان از عبور CSRF middleware |
| `core/src/modules/admin-auth/index.ts` | export router جدید | دسترسی در `index.ts` |
| `core/src/server/index.ts` | اضافه کردن protected router بعد از CSRF | ترتیب صحیح middleware |

## تأییدیه

> [!IMPORTANT]
> **مشکل اصلی شماره ۱**: تابع `requestJson` هدر CSRF را می‌سازد ولی بعداً `...options` آن را بازنویسی می‌کند. این باعث می‌شود **همه عملیات‌های POST/PUT/DELETE** بدون CSRF token ارسال شوند.
>
> **مشکل اصلی شماره ۲**: مسیرهای logout و change-password قبل از CSRF middleware قرار دارند (مشکل امنیتی، نه مشکل ۴۰۳).

## پلن تست

- بعد از اعمال تغییرات، `npm run build` اجرا می‌شود
- سرور با `npm run dev` بالا می‌آید
- عملیات‌هایی مثل ایجاد پوشه، آپلود ماژول، تغییر تنظیمات تست می‌شوند
- بررسی می‌شود که هدر `X-CSRF-Token` در درخواست‌های مرورگر وجود دارد
