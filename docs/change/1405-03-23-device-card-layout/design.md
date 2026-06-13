<div dir="rtl" style="text-align:right;">

# طراحی — چیدمان کارت per-device (موبایل / تبلت / PC)

> **مسیر:** `docs/change/1405-03-23-device-card-layout/design.md`  
> **پیش‌نیاز:** [proposal.md](./proposal.md) · **رفتار کاربر:** [behavior.md](./behavior.md)

---

## §۱ محدوده

چیدمان `cardGrid` و ارتفاع بوم (`folderCanvas`) برای سه breakpoint ثابت — فقط صفحهٔ اصلی و زیرپوشه‌ها. `cardBackground` و منطق navigate/gear بدون تغییر.

---

## §۲ تصویر کلی

```
بارگذاری layout
    → resolve breakpoint فعال (viewport)
    → برای هر node: cardGrid مناسب breakpoint (یا مشتق + ذخیره)
    → رندر بوم با عرض طراحی ثابت آن breakpoint

حالت ویرایش
    → ادمین دستگاه را انتخاب می‌کند (پیش‌فرض desktop)
    → بوم به عرض طراحی آن دستگاه محدود/شبیه‌سازی می‌شود
    → drag/resize روی cardGrid همان breakpoint
    → PATCH مثل قبل — با فیلد breakpoint
```

---

## §۳ Breakpointها

| کلید | برچسب UI | عرض طراحی (reference) | فعال وقتی viewport |
|------|----------|----------------------|-------------------|
| `desktop` | PC | **`1200px`** (سقف گرید؛ shell تا `1280px`) | `≥ 1024px` |
| `tablet` | تبلت | `768px` (reference مشتق‌سازی) | `641px – 1023px` |
| `mobile` | موبایل | `390px` (reference مشتق‌سازی) | `≤ 640px` |

- عرض‌های reference برای **مشتق‌سازی** و **سقف دسکتاپ** — نه قفل کردن گرید در viewport کوچک‌تر از reference.
- **داخل هر breakpoint:** سلول‌های گرید **کل عرض قابل‌استفادهٔ بوم** را پر می‌کنند (`cellWidth = containerInner / 30`)؛ فقط دسکتاپ وقتی container از `1200px` عریض‌تر است به `1200px` محدود می‌شود.
- `640px` با §۸.۴ فعلی `ui-behavior.md` هم‌راستا است؛ آستانهٔ تبلت/دسکتاپ `1024px` قرارداد جدید این change است.

---

## §۴ داده — `site-layout.json`

### ۴.۱ سازگاری عقب‌رو

- `cardGrid` موجود = چیدمان **`desktop`** (منبع حقیقت دسکتاپ).
- نودهای بدون فیلد جدید → فقط دسکتاپ؛ تبلت/موبایل lazy-generate.

### ۴.۲ فیلدهای جدید روی `LayoutTreeNode`

```typescript
/** Optional per-breakpoint layout — desktop falls back to cardGrid */
cardGridTablet?: CardGridPosition;
cardGridMobile?: CardGridPosition;
```

روی node پوشه (folder):

```typescript
folderCanvas?: {
  gridRows: number;           // desktop — مثل الان
  gridRowsTablet?: number;
  gridRowsMobile?: number;
};
```

### ۴.۳ نگاشت breakpoint → فیلد

| breakpoint | node field | folder canvas rows |
|------------|------------|-------------------|
| desktop | `cardGrid` | `folderCanvas.gridRows` |
| tablet | `cardGridTablet` | `folderCanvas.gridRowsTablet` ?? `gridRows` |
| mobile | `cardGridMobile` | `folderCanvas.gridRowsMobile` ?? `gridRowsTablet` ?? `gridRows` |

### ۴.۴ PATCH payload

گسترش `FolderCardsUpdatePayload`:

```typescript
cards: Array<{
  nodeId: string;
  cardGrid?: CardGridPosition;        // desktop
  cardGridTablet?: CardGridPosition;
  cardGridMobile?: CardGridPosition;
  cardBackground?: CardBackground | null;
}>;
canvasGridRows?: number;
canvasGridRowsTablet?: number;
canvasGridRowsMobile?: number;
```

- فقط فیلدهای breakpoint در حال ویرایش ارسال شوند (یا همه اگر flush نهایی).
- validation همان محدوده‌های فعلی (`col` ۰–۲۹، `colSpan` حداقل ۳، …).

---

## §۵ الگوریتم مشتق‌سازی (یک‌بار)

**تابع:** `deriveCardGridForBreakpoint(sourceGrid, sourceBreakpoint, targetBreakpoint, occupiedSlots)`

**ورودی:** چیدمان breakpoint بزرگ‌تر (معمولاً desktop → tablet → mobile).

**مراحل:**

1. **نسبت عرض:** `scale = designWidth[target] / designWidth[source]` — برای spanها: `newColSpan = max(minColumnSpan, round(colSpan * scale))` با سقف `maxColumns`.
2. **جایگاه افقی:** `newCol = round(col * scale)` — بعد clamp به `[0, maxColumns - newColSpan]`.
3. **ردیف:** `row` و `rowSpan` بدون scale افقی (ارتفاع سلول ثابت می‌ماند).
4. **چیدمان مجدد:** اگر overlap — همان موتور `findNearestEmptySlot` فعلی + sort بر اساس `(row, col)` برای پایداری.
5. **بوم:** `gridRows` هدف = `computeMinCanvasRowsForCards` روی layout جدید.
6. **ذخیره:** PATCH دسته‌ای برای nodeهای مشتق‌شده + flag `derivedLayoutsSaved: true` در response (اختیاری) یا فقط rely on JSON.

**زمان اجرا:**

- اولین render وقتی `cardGridTablet` / `cardGridMobile` غایب است.
- **نه** در هر resize — فقط یک‌بار تا ذخیره شود.
- ادمین بعداً با سوییچ دستگاه می‌تواند override کند.

**شکست:** اگر گرید پر شد → toast زرد + آخرین layout معتبر desktop نمایش داده شود (fail-safe).

---

## §۶ UI — نوار ابزار

### ۶.۱ محل

`layout-edit-toolbar` — گروه جدید **بعد از** دکمهٔ «ویرایش»، **قبل از** «افزودن محتوا».

### ۶.۲ دکمه‌ها (فقط `editModeActive`)

| id | آیکون | برچسب | `aria-pressed` |
|----|-------|-------|----------------|
| `layoutDeviceDesktop` | `fa-desktop` | PC | وقتی فعال |
| `layoutDeviceTablet` | `fa-tablet-alt` | تبلت | … |
| `layoutDeviceMobile` | `fa-mobile-alt` | موبایل | … |

- استایل: `layout-edit-tool-btn` + `is-active` روی انتخاب‌شده.
- پیش‌فرض هنگام ورود به ویرایش: **desktop**.
- سوییچ دستگاه → flush ذخیرهٔ breakpoint قبلی (debounce) → بارگذاری layout breakpoint جدید روی بوم.

### ۶.۳ بازخورد

- نوار ابزار: `data-active-device="desktop|tablet|mobile"`.
- بوم در ویرایش: کلاس `card-canvas--device-tablet` و … + `max-width` برابر عرض طراحی (وسط‌چین).
- toast پس از مشتق خودکار: «چیدمان [تبلت/موبایل] از روی PC ساخته و ذخیره شد — در صورت نیاز ویرایش کنید.»

---

## §۷ رفتار نمایش (خارج از ویرایش)

1. `matchMedia` یا `ResizeObserver` روی `window` — تعیین `activeBreakpoint`.
2. `ModuleHubCardStore` / `resolveNodeGrid(node, breakpoint)` — فیلد مناسب یا fallback مشتق.
3. **سلول پرکننده بوم:** `innerWidth = resolveGridInnerWidth(containerInner, breakpoint)` — تبلت/موبایل همیشه `containerInner`؛ دسکتاپ `min(containerInner, 1200px)`؛ `cellWidth = innerWidth / maxColumns`.
4. تغییر breakpoint → re-render یک‌باره (مثل navigation) — بدون transition اندازهٔ کارت.

---

## §۸ backend

| لایه | تغییر |
|------|--------|
| `types.ts` | فیلدهای `cardGridTablet`, `cardGridMobile`, `gridRowsTablet`, `gridRowsMobile` |
| `folder-cards-update.ts` | validate + merge فیلدهای جدید |
| `migrate` (اختیاری) | نیاز نیست — `cardGrid` = desktop |
| `GET /api/layout` | بدون تغییر شکل پاسخ — فیلدهای جدید در tree |

---

## §۹ frontend — فایل‌های اصلی

| فایل | مسئولیت |
|------|---------|
| `card-layout-editor.js` | دکمه‌های دستگاه، state `activeEditDevice`, flush per-device |
| `card-canvas-app.js` | `activeBreakpoint`, عرض طراحی، re-init metrics |
| `modulehub-card-store.js` | `resolveNodeGrid(node, device)` |
| `grid.js` / `config.js` | `DEVICE_DESIGN_WIDTH`, `resolveBreakpoint(viewportWidth)` |
| **جدید** `derive-breakpoint-layout.ts` (core) + wrapper در public | مشتق + unit test |

---

## §۱۰ امنیت

- همان `PATCH /admin/folder/:folderId/cards` — فقط Super Admin.
- validation سمت سرور برای spanها — جلوگیری از colSpan &gt; 30.

---

## §۱۱ ریسک فنی

| ریسک | شدت | کاهش |
|------|-----|------|
| Race بین debounce و سوییچ دستگاه | متوسط | flush قبل از سوییچ |
| derive ناسازگار با دست ویرایش ادمین | متوسط | derive فقط وقتی فیلد خالی |
| Performance re-render همه کارت‌ها | پایین | یک refresh؛ بدون انیمیشن resize |
| تست‌های unit قدیمی | پایین | fallback desktop-only |

---

## §۱۲ E2E (ارجاع proposal)

- **E2E-DCL-01:** ویرایش دو breakpoint + verify viewport
- **E2E-DCL-02:** JSON legacy فقط `cardGrid` → باز کردن موبایل → derive + ذخیره → reload بدون derive مجدد

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
