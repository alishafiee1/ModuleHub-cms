<div dir="rtl" style="text-align:right;">

# tests — تست خودکار

اینجا دو جور تست داریم:

- **Jest (unit)** — منطق TypeScript توی `core/src/`؛ بدون مرورگر، سریع.
- **Playwright (E2E)** — مرورگر واقعی باز می‌شه، کلیک و UI رو چک می‌کنه؛ خودش یه سرور موقت روی پورت جدا بالا می‌آره.

---

## چه مشکلی دارم؟

| مشکل | دستور |
|------|--------|
| همه unitها | `npm test` یا `npm run test:unit` |
| یک فایل unit | `npx jest tests/unit/package-cache/hash.test.ts` |
| UI خودکار (Playwright) | `npm run test:e2e` |
| UI با پنجره مرورگر باز | `npx playwright test --headed` |
| UI با پنل تعاملی Playwright | `npm run test:e2e:ui` |
| تست مهمان + رمز ماژول (بدون dev-admin) | `npm run test:e2e:module-manager` |
| smoke کش روی سرور | `npm run smoke:package-cache` |
| چک‌لیست UI دستی | [`smoke/card-canvas-checklist.md`](smoke/card-canvas-checklist.md) |

---

## Playwright — تست UI با مرورگر

### یعنی چی؟

Playwright مثل یه ربات مرورگره: صفحه رو باز می‌کنه، دکمه می‌زنه، می‌کشه، چک می‌کنه چیزی نشکنه. برای کارت‌ها، ویرایش چیدمان، ورود ادمین و… مناسبه.

**فرق با `npm test`:** Jest کد backend رو تست می‌کنه؛ Playwright همون چیزیه که کاربر توی Chrome می‌بینه.

### پیش‌نیاز

- **Node 20** و `npm install` انجام شده باشه
- **Chrome** نصب باشه (کانفیگ پروژه از `channel: 'chrome'` استفاده می‌کنه)
- اولین بار شاید لازم باشه: `npx playwright install` (اگه مرورگر Playwright نداری — معمولاً Chrome سیستم کافیه)

### اجرای معمولی

```bash
npm run test:e2e
```

نیازی به `npm run dev` جدا نیست — Playwright خودش سرور تست رو روی **`http://127.0.0.1:4010`** بالا می‌آره و بعد از تست می‌بنده.

### می‌خوام ببینم چی می‌شه (نمایش بصری)

| حالت | دستور | حسش |
|------|--------|-----|
| پنل UI Playwright | `npm run test:e2e:ui` | لیست تست‌ها + مرورگر + تایم‌لاین — راحت‌ترین |
| مرورگر باز، بدون پنل | `npx playwright test --headed` | پنجره Chrome می‌بینی |
| قدم‌به‌قدم | `npx playwright test --debug` | Inspector — خط‌به‌خط |
| فقط یک فایل | `npx playwright test tests/e2e/device-card-layout.spec.ts --headed` | |

پیش‌فرض **headless** است — یعنی مرورگر پشت‌صحنه، بدون پنجره.

### دو کانفیگ — مهم!

| دستور | پورت | Super Admin خودکار |
|--------|------|---------------------|
| `npm run test:e2e` | 4010 | بله (`MODULEHUB_DEV_SUPER_ADMIN=1`) — برای تست کارت و ویرایش |
| `npm run test:e2e:module-manager` | 4012 | خیر — برای تست مهمان + رمز ماژول |

تست `module-manager-flow.spec.ts` فقط با دستور دوم درسته؛ توی کانفیگ اصلی عمداً skip شده چون اونجا همه ادمین می‌شن.

### تست‌ها کجان؟

```
tests/e2e/
├── device-card-layout.spec.ts   ← چیدمان PC/تبلت/موبایل، drag، breakpoint
├── module-manager-flow.spec.ts  ← فقط با test:e2e:module-manager
└── helpers/                     ← login، drag کارت، …
```

کانفیگ: `playwright.config.ts` (اصلی) و `playwright.module-manager.config.ts` (مهمان).

### اگه fail شد

- اسکرین‌شات توی `test-results/` (روی خطا)
- trace (retry اول): `npx playwright show-trace test-results/.../trace.zip`
- لاگ سرور تست همون ترمیناله — معمولاً خطای assert یا timeout

### کی اجرا کنم؟

- بعد از تغییر UI کارت / `card-canvas` / `script.js`
- قبل از merge بزرگ روی صفحهٔ اصلی
- `npm test` (unit) هر commit؛ E2E وقتی UI دست زدی

---

## ساختار پوشه tests

```
tests/
├── unit/<feature>/     ← Jest
├── e2e/                ← Playwright
├── fixtures/modules/package-cache-test/
├── helpers/
└── smoke/              ← چک‌لیست markdown (دستی)
```

---

## لایه‌های تست (خلاصه)

| لایه | کجا | کی |
|------|-----|-----|
| **unit** | `tests/unit/` | هر commit — `npm test` |
| **E2E** | `tests/e2e/` | بعد تغییر UI — `npm run test:e2e` |
| **smoke** | `scripts/smoke/test-package-cache.sh` | سرور — `npm run smoke:package-cache` |
| **health** | `scripts/run-checks.sh` | بعد deploy |
| **دستی** | `tests/smoke/*.md` | قبل release UI |

---

## fixture package-cache

```bash
bash scripts/build-package-cache-fixture-zip.sh
bash scripts/smoke/test-package-cache.sh
bash scripts/verify-package-cache.sh <module-id>
```

hash ثابت → `tests/unit/package-cache/package-cache-fixture-hash.test.ts`

---

## خروجی موفق

**Jest:**
```
Test Suites: N passed
Tests:       M passed
```

**Playwright:**
```
N passed
```

راهنمای نصب محلی → [`docs/how-to-use.md`](../docs/how-to-use.md)

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
