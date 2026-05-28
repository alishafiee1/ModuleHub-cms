
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

/* RTL tables --- Persian layout: right-aligned cells and logical column order for RTL readers */
table {
    direction: rtl;
    text-align: right;
    width: 100%;
    border-collapse: collapse;
    margin-inline-start: 0;
    margin-inline-end: auto;
}

thead th,
tbody td {
    text-align: right;
    vertical-align: top;
    padding: 0.35em 0.5em;
}

/* Keep CLI/command snippets in table cells readable (LTR) */
table td code,
table th code {
    direction: ltr;
    unicode-bidi: embed;
    text-align: left;
    display: inline-block;
}
</style>

## 🤖 قوانین کدنویسی برای AI

### TypeScript + JSDoc (خلاصه — منبع حقیقت)

| قانون | جزئیات |
|--------|--------|
| **TypeScript** | همهٔ `core/src/` — کامپایل با `tsc`؛ بدون `any` |
| **Types** | هر ماژول در `core/src/modules/` → `interface` ورودی/خروجی |
| **JSDoc** | هر `export function` → `@param` + `@returns` + یک خط توضیح |
| **Lint** | ESLint Airbnb — `npm run lint` پایان هر فاز |
| **حجم** | فایل ≤۳۰۰ خط، تابع ≤۴۰ خط |

```typescript
/**
 * Returns the next free port in the configured range.
 * @param usedPorts - Ports already assigned in site-layout
 * @returns First available port number
 */
export function assignNextPort(usedPorts: number[], rangeStart: number, rangeEnd: number): number {
  // ...
}
```

### اجباری
- **TypeScript** — جزئیات در جدول بالا.
- **ماژول‌ها** (در `core/src/modules`) باید دارای interface ورودی/خروجی مشخص باشند.
- **خطاها** را با try-catch گرفته و لاگ کنید (logger اختصاصی، نه `console.log` در production).
- **JSDoc** — برای همهٔ توابع public (جدول بالا).

### امنیت
- هرگز کلیدها یا رمزها را در کد هاردکد نکنید. از `process.env` استفاده کنید (`SESSION_SECRET`, `ADMIN_PASSWORD_HASH`).
- رمز Super Admin و Module Manager: **bcrypt** cost ≥ 12 — هرگز plaintext در JSON یا log.
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Strict`.
- همه POST admin: **CSRF token** + session معتبر.
- Rate limit: login (`loginRateLimitPerMinute`) و رمز ماژول (`modulePasswordMaxAttempts`).
- Module Manager session: scoped به `moduleId` — middleware قبل از handler بررسی کند.
- ورودی‌های کاربر (نام ماژول، پورت‌ها، حجم ZIP) را اعتبارسنجی کنید — پورت فقط در محدوده `system-settings.json` (`portRangeStart`–`portRangeEnd` یا مقدار دستی معتبر).
- مقادیر `system-settings.json` را با schema اعتبارسنجی کنید (حد ZIP، timeout، رابط شبکه از لیست NICهای موجود).
- در زمان اجرای Docker، از `cap_drop: ALL` و `read_only: true` استفاده کنید مگر اینکه ماژول واقعاً نیاز داشته باشد.

### تست
- برای هر قابلیت جدید در core، حداقل یک تست واحد (Jest) بنویسید.
- برای ماژول‌های نمونه، یک تست یکپارچگی ساده ارائه دهید.

## 🔄 فرآیند درخواست تغییر (Pull Request)
- عنوان PR باید واضح و شامل یکی از پیشوندها باشد: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- حتماً PR توضیح دهد که چه تغییری کرده و چرا.
- اگر تغییری در docs ایجاد می‌شود، **`docs/ai-doc-guide.md`** را رعایت کنید (نقش proposal vs design plan).
- قبل از ارسال، دستور `npm run lint` و `npm run test` را اجرا کنید.

## 🧪 نحوه آزمایش تغییرات
```bash
# clone مخزن
git clone https://github.com/alishafiee1/moduleHub-cms
cd moduleHub-cms
cp .env.example .env   # و مقادیر واقعی را تنظیم کنید

# نصب وابستگی‌ها
npm install

# اجرای هسته در حالت توسعه
npm run dev

# اجرای تست‌ها
npm run test

# ساخت برای تولید
npm run build