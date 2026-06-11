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

## به‌زبان ساده و عامیانهٔ این دستور چه کار می‌کنه؟

**دستور:**  

```bash
npm run dev
```

### ۱️⃣ npm چی هست؟
`npm` برنامهٔ مدیریت بسته (Package Manager) برای **Node.js** است. اون می‌تونه کتاب‌خونه‌ها (پکیج‌ها) رو نصب کنه، به‌روزرسانی کنه، یا اسکریپت‌های تعریف‌شده در فایل `package.json`‑مون رو اجرا کنه.

### ۲️⃣ `run dev` یعنی چی؟
در فایل `package.json` که توی پوشهٔ ریشهٔ پروژه ( `D:\2 Curent project git\ModuleHub-cms` ) وجود داره، یک بخش به نام **scripts** داریم.  
مثلاً:

```json
{
  "scripts": {
    "dev": "tsx watch core/src/server/index.ts"
  }
}
```

وقتی می‌گیم `npm run dev`، npm می‌خواند این خط زیر را اجرا کند:

```
tsx watch core/src/server/index.ts
```

### ۳️⃣ `tsx watch …` چه کاری انجام می‌دهد؟
- **tsx**: یک ابزار است که می‌تونه مستقیم فایل‌های TypeScript رو بدون نیاز به کامپایل جداگانه اجرا کند.  
- **watch**: به این معنیه که «به تغییرات فایل‌ها گوش می‌ده». هر وقت فایلی که در این مسیر (`core/src/server/index.ts`) تغییر کند، `tsx` خودکار‌ً دوباره اجرا می‌شه.  
- **core/src/server/index.ts**: نقطهٔ ورود برنامهٔ سرور ماست. این فایل معمولاً یک سرور HTTP (مثلاً با Express یا Fastify) را بالا می‌آورد.

### ۴️⃣ چه اتفاقی در خروجی می‌بینیم؟

#### قبل از رفع خطا
```
Error: Transform failed with 1 error:
...admin-login-route.ts:100:0: ERROR: Unexpected "export"
```
- این خطا از **esbuild** (کامپایلری که `tsx` به‌صورت پشت‌صحنه استفاده می‌کند) میاد.
- به‌نظر می‌رسه در فایلی به نام `admin-login-route.ts` یک `export` در جایی قرار گرفته که **esbuild** انتظارش رو نداشته؛ یعنی سینتکس اشتباهی وجود داره (مثلاً export توی فایل جاوااسکریپت ساده یا داخل یک بلوک که نمی‌تونست پردازش کنه).

#### بعد از رفع خطا (یا وقتی همه چیز درست هست)
```
ModuleHub CMS listening on 127.0.0.1:4000
```
- سرور با موفقیت بالا آمد.
- **127.0.0.1** یعنی «لوپ‌بک» (فقط روی کامپیوتر شما قابل دسترس) و **پورت 4000** جایی که برنامه‌مون درخواست‌ها رو می‌پذیره.

### خلاصهٔ قدم به قدم

| قدم | چه می‌شه؟ |
|------|-----------|
| 1️⃣ | `npm` می‌خوندهٔ فایل `package.json` و اسکریپت `dev` رو پیدا می‌کنه. |
| 2️⃣ | اسکریپت `dev` برابر با `tsx watch core/src/server/index.ts`. |
| 3️⃣ | `tsx` فایلی که در `core/src/server/index.ts` تعریف شده رو اجرا می‌کنه. |
| 4️⃣ | `watch` باعث می‌شه هر تغییری در فایل‌های TypeScript زیرمجموعه (مثلاً `admin-login-route.ts`) تشخیص داده بشه و سرور دوباره ریستارت بشه. |
| 5️⃣ | اگر کد به درستی کامپایل بشه، سرور شروع می‌کنه به **listen** کردن روی **127.0.0.1:4000**؛ در غیر این صورت خطای `TransformError` نمایش داده می‌شود. |
| 6️⃣ | وقتی خطاها رفع شوند، می‌توانید در مرورگر به `http://127.0.0.1:4000` برین و واسط کاربری **ModuleHub CMS** رو ببینید. |

### نکتهٔ مهم
خطای «Unexpected "export"» معمولاً به این معنیه که یک `export` در جایی قرار گرفته که TypeScript/ESBuild نمی‌تونه به درستی تشخیص بده (مثلاً داخل یک فایل `.js` یا داخل یک بلوک `if` که در حالت ماژول نیست). برای رفعش:

1. مطمئن بشید فایل `.ts` به‌درستی به‌عنوان ماژول (module) تنظیم شده.
2. اگر از `export` داخل توابع یا شرط‌ها استفاده کردید، به شکل `export const foo = …` یا `export function foo()` تبدیل کنید.
3. بعد از اصلاح، دوباره `npm run dev` بزنید؛ سرور باید بدون خطا بالا بیاد.

به این صورت، این دستور به‌صورت «شبیه یک دکمهٔ «Run»» برای توسعه‌دهنده عمل می‌کنه: کدتونو اجرا می‌کنه، در حالت watch می‌مونه و هر تغییری رو فوراً می‌بینه.