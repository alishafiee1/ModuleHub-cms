<div dir="rtl" style="text-align:right;">

# طراحی — هم‌راستاسازی داکیومنت اصلی

> مغایرت‌ها از بررسی `core/src/` و `public/` در ۲۰۲۶-۰۶-۱۴. منبع اعداد: [`system-settings.example.json`](../../system-settings.example.json) · گرید: [`core/src/modules/home-layout/grid-config.ts`](../../../core/src/modules/home-layout/grid-config.ts).

---

## قواعد هم‌راستاسازی

| سند | بکن | نکن |
|-----|-----|-----|
| `proposal.md` | داستان UX، «فاز بعد» برای کتابخانه | endpoint، مسیر فایل، جدول API |
| `design.md` | جدول API، ساختار `core/src/modules/` | پاراگراف داستان، «فرض کن…» |
| `tasks.md` | وضعیت فاز، تست، deliverable | تکرار design |

**ترتیب ویرایش:** proposal → design → tasks (همان سه فایل در `docs/`).

---

## A — منسوخ (حذف یا تصحیح در داک اصلی)

| موضوع | واقعیت کد | اصلاح |
|-------|-----------|--------|
| نصب از کتابخانه | وجود ندارد | `proposal.md` — فقط ZIP + پوشه؛ کتابخانه فاز بعد |
| `packageInstallInterface` / رادیو NIC | حذف ۲۰۲۶ | `proposal.md` L203–204 · `design.md` §۱ |
| «تا فاز ۸» برای settings | فاز ۸ ✅ | `proposal.md` · `tasks.md` header |
| فاز ۸ «⏳ جزئی» در جدول | §۸ همه ✅ | `tasks.md` جدول بالا |
| `core/server.js` در §۳ | `core/src/` + `dist/` | `design.md` §۳ |
| برنامه ۷ هفته §۱۴ | تاریخی | یک خط در §۱۵ یا برچسب «تکمیل‌شده» |
| تست ۹.۹ NIC | بی‌معنی | حذف از `tasks.md` |
| `.eslintrc.json` | `eslint.config.mjs` | `tasks.md` deliverables |
| CSRF «فاز ۸» | انجام شده | `design.md` §۱۳.۲ |

---

## B — پیاده‌شده، باید به داک اصلی اضافه شود

### API عمومی (`design.md` § جدید)

| متد | مسیر | ماژول |
|-----|------|--------|
| GET | `/health` | `core/src/server/index.ts` |
| GET | `/api/layout` | `home-layout/layout-routes.ts` |
| GET | `/api/auth/status` | `home-layout/layout-routes.ts` |
| GET | `/api/auth/csrf-token` | `admin-auth` |

### Admin — کم‌ذکر

| متد | مسیر |
|-----|------|
| POST | `/admin/wizard/save` |
| POST | `/admin/module/:id/github-sync` |
| PATCH | `/admin/layout-node/:nodeId` |

### رفتار runtime (`design.md` §۶)

- `maxConcurrentRunningModules` — رد start اگر running ≥ سقف (`concurrent-limit.ts`)
- `autoRestartOnCrash` — حداکثر `autoRestartMaxAttemptsPerHour` (`auto-restart-tracker.ts`)

### Per-device (`design.md` §۱۱.۵)

| فیلد | breakpoint |
|------|------------|
| `cardGrid` / `folderCanvas.gridRows` | desktop (≥1024px) |
| `cardGridTablet` / `gridRowsTablet` | tablet (641–1023) |
| `cardGridMobile` / `gridRowsMobile` | mobile (≤640) |

ثابت‌ها: `GRID_MAX_CANVAS_ROWS = 180`، `GRID_MIN_CANVAS_ROWS = 9`.

### UX در `proposal.md` (بدون API)

- ادمین در حالت ویرایش: دکمه‌های PC / تبلت / موبایل — چیدمان جدا ذخیره.
- ⚙ روی کارت پوشه: نام، `cardDescription`، جابجایی، حذف با `contentPolicy`.
- کاربر عادی: viewport خودش؛ چرخ‌دنده نمی‌بیند.

---

## C — خارج از scope (فقط لینک در `tasks.md`)

`card-view` · `card-live-customization` · `static-card-appearance` · `admin-access-roles` · `add manifest` · `docker-module`

---

## فایل‌های هدف

| فایل | تغییرات اصلی |
|------|--------------|
| [`docs/proposal.md`](../../proposal.md) | کتابخانه، NIC، فاز۸، پوشه، per-device |
| [`docs/design.md`](../../design.md) | §۱ §۳ §۵.۵ API §۶ §۱۱.۵ §۱۱.۶ §۱۴ §۱۵ |
| [`docs/tasks.md`](../../tasks.md) | جدول فاز، ۷.۵ dev note، ۹.۹، deliverables، concurrent |

</div>
