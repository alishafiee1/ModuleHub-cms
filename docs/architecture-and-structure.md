<div dir="rtl" style="text-align:right;">

# معماری فایل‌ها — ModuleHub CMS

این سند می‌گه **کدوم فایل کجای داستانه**. جریان سیستم (کاربر چی می‌بینه) → [`design.md`](design.md) · فهرست یک‌خطی → [`project-file-index.md`](project-file-index.md)

---

## نمای کلی

ModuleHub یه سرور Node (Express) است که صفحهٔ اصلی با کارت نشون می‌ده. هر کارت می‌تونه به یه ماژول ZIP وصل باشه. ادمین با session وارد می‌شه، ZIP آپلود می‌کنه، wizard پر می‌کنه، ماژول رو start می‌کنه — بدون دست زدن به کد هسته.

---

## بک‌اند — شروع و مسیرها

### `core/src/server/index.ts`

وقتی `npm run dev` یا `npm start` می‌زنی، برنامه از اینجا بالا میاد. اول پوشه‌های storage ساخته می‌شن، بعد express-session و routeهای admin و home-layout و module-manager وصل می‌شن. health check هم همین‌جاست.

### `core/src/config/paths.ts`

همهٔ مسیرهای مهم (layout JSON، modules، thumbnails، cache) اینجا تعریف می‌شن تا بقیهٔ کد حدس نزنه. اگه بخوای بفهمی فایل layout کجا ذخیره می‌شه، از اینجا شروع کن.

### `core/src/bootstrap/ensure-directories.ts`

قبل از هر چیز، پوشه‌هایی مثل `storage/` و `standalone-modules/` اگه نباشن ساخته می‌شن — تا اولین upload خطا نده.

---

## بک‌اند — ماژول‌های اصلی

### `core/src/modules/home-layout/`

قلب چیدمان صفحهٔ اصلی. `layout-store.ts` JSON رو می‌خونه/می‌نویسه. `migrate-card-grid.ts` قدیمی `cardSpan` رو به `cardGrid` تبدیل می‌کنه. `folder-cards-update.ts` و `layout-routes.ts` PATCH کارت‌ها رو از ادیتور می‌گیرن. `folder-management.ts` rename/move/delete پوشه با `contentPolicy`؛ `layout-node-move.ts` انتقال drag بین پوشه‌ها. `grid-slot.ts` جلوی overlap کارت‌ها رو می‌گیره. `grid-config.ts` باید با `public/js/card-canvas/config.js` هم‌خوان بمونه.

### `core/src/modules/module-upload-wizard/`

بعد از آپلود ZIP، extract و wizard save اینجاست. `upload-routes.ts` endpoint آپلود رو داره؛ `wizard-save.ts` جواب wizard رو توی layout ثبت می‌کنه.

### `core/src/modules/module-manager/`

وقتی ادمین Start می‌زنه، `backend-runner.ts` یا `docker-runner.ts` process رو بالا می‌آره. `module-serving-router.ts` درخواست‌های `/modules/<id>/` رو به فایل static یا پروکسی backend می‌فرسته.

### `core/src/modules/package-cache/`

بعد از upload، اگه ZIP داخلش `package.json` داشته باشه، hash می‌گیره، از `/var/cache/modulehub/pkg/` symlink می‌زنه یا npm install می‌کنه — تا دفعهٔ بعد سریع‌تر باشه.

### `core/src/modules/admin-auth/`

login، logout، change-password، CSRF، rate limit، و session Module Manager. `auth-middleware.ts` همهٔ `/admin/*` رو محافظت می‌کنه مگر route عمومی login.

### `core/src/modules/system-settings/`

تنظیمات سراسری (حد ZIP، NIC نصب، ظاهر خانه) — API برای `/admin/settings` و validation schema.

### `core/src/modules/backup-restore/`

ZIP کامل از layout + modules + settings — API و CLI.

---

## فرانت — UI

### `public/index.html` + `public/script.js`

صفحهٔ خانه: کارت‌ها، حالت ویرایش، toolbar ادمین، debounce ذخیره layout. `script.js` با APIهای PATCH صحبت می‌کنه.

### `public/js/card-canvas/`

بوم drag و resize کارت روی گرید. `card-canvas-app.js` orchestrator است؛ `interactions.js` ماوس/لمس؛ `card-transfer.js` انتقال پوشه/ماژول در edit mode؛ `modulehub-card-store.js` رندر کارت + `cardDescription`. `gear-floating-menu.js` منوی شناور ⚙.

### `public/card-layout-editor.js`

دیالوگ پس‌زمینه کارت، دکمه‌های breakpoint (دسکتاپ/تبلت/موبایل)، هماهنگی با `derive-breakpoint-layout.ts` در بک‌اند.

### `public/admin/`

صفحات جدا برای login و settings — HTML سبک + JS مخصوص همان صفحه.

### `public/theme.js` و `public/home-floating-background.js`

تم یکپارچه و پس‌زمینهٔ شناور خانه — از تنظیمات `system-settings` می‌خونن.

---

## اسکریپت و deploy

### `scripts/deploy-full.sh`

روی سرور: git pull → install-to-opt → build در opt → restart systemd → health. AI و انسان هر دو باید همین رو به‌عنوان مسیر اصلی بشناسن.

### `scripts/lib/`

توابع مشترک deploy — مستقیم اجرا نمی‌شن، از shellهای بالایی `source` می‌شن.

---

## تست

Unit testها کنار هر ماژول در `tests/unit/` هستن. E2E با Playwright در `tests/e2e/` — پورت جدا `4010` تا با dev تداخل نکنه. راهنمای ساده: [`tests/README.md`](../tests/README.md).

</div>

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
