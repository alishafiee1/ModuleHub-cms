
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

### اجباری
- **TypeScript** استفاده شود. از `any` اجتناب کنید؛ نوع‌ها را به درستی تعریف کنید.
- **ماژول‌ها** (در core/src/modules) باید دارای اینترفیس ورودی/خروجی مشخص باشند.
- **خطاها** را با try-catch گرفته و لاگ کنید (از `console.error` یا logger اختصاصی).
- **همه توابع عمومی** مستندات JSDoc داشته باشند.

### امنیت
- هرگز کلیدها یا رمزها را در کد هاردکد نکنید. از `process.env` استفاده کنید.
- ورودی‌های کاربر (مانند نام ماژول، پورت‌ها) را اعتبارسنجی و sanitize کنید.
- در زمان اجرای داکر، از `cap_drop: ALL` و `read_only: true` استفاده کنید مگر اینکه ماژول واقعاً نیاز داشته باشد.

### تست
- برای هر قابلیت جدید در core، حداقل یک تست واحد (Jest) بنویسید.
- برای ماژول‌های نمونه، یک تست یکپارچگی ساده ارائه دهید.

## 🔄 فرآیند درخواست تغییر (Pull Request)
- عنوان PR باید واضح و شامل یکی از پیشوندها باشد: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- حتماً PR توضیح دهد که چه تغییری کرده و چرا.
- اگر تغییری در `manifest.json` یا ساختار ماژول‌ها ایجاد می‌شود، حتماً `docs/module-spec.md` را به‌روز کنید.
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