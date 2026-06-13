<div dir="rtl" style="text-align:right;">

# tasks — چیدمان کارت per-device

> **مسیر:** `docs/change/1405-03-23-device-card-layout/tasks.md`  
> **طراحی:** [design.md](./design.md) · **رفتار:** [behavior.md](./behavior.md)

---

## فاز ۱ — schema و backend

> **ریسک:** validation ناقص → JSON خراب روی production

- [x] ۱.۱ اضافه کردن `cardGridTablet`, `cardGridMobile` و `gridRowsTablet`, `gridRowsMobile` به `types.ts`
- [x] ۱.۲ به‌روزرسانی `folder-cards-update.ts` — merge و validate فیلدهای breakpoint
- [x] ۱.۳ به‌روزرسانی `folder-card-patch-entry.ts` — پشتیبانی breakpoint در payload ویرایش
- [x] ۱.۴ تست خودکار: PATCH با سه breakpoint + reject span نامعتبر
- [x] ۱.۵ تست خودکار: JSON قدیمی فقط `cardGrid` — خواندن بدون خطا

---

## فاز ۲ — مشتق‌سازی هوشمند (core)

> **ریسک:** چیدمان بد → ادمین گیج می‌شود؛ toast و امکان ویرایش دستی اجباری

- [x] ۲.۱ `derive-breakpoint-layout.ts` — scale span + reposition + overlap resolve
- [x] ۲.۲ `resolveNodeGrid(node, breakpoint)` — fallback chain: mobile ← tablet ← desktop + derive
- [x] ۲.۳ تست خودکار: desktop ۲ کارت → derive mobile بدون overlap
- [x] ۲.۴ تست خودکار: derive یک‌بار — فیلد ذخیره شده دوباره derive نشود
- [x] ۲.۵ hook ذخیره در `layout-store.ts` پس از derive اولیه `(بعد از ۱.۲)`

---

## فاز ۳ — UI نوار ابزار و حالت ویرایش

> **ریسک:** سوییچ دستگاه بدون flush → از دست رفتن ویرایش

- [x] ۳.۱ سه دکمه PC / تبلت / موبایل در `card-layout-editor.js` — فقط در `editModeActive`
- [x] ۳.۲ state `activeEditDevice` — پیش‌فرض desktop؛ `aria-pressed` و کلاس `is-active`
- [x] ۳.۳ flush debounce قبل از سوییچ breakpoint `(بعد از ۳.۱)`
- [x] ۳.۴ بوم ویرایش: `max-width` و کلاس device — عرض‌های ۱۰۲۴+/۷۶۸/۳۹۰ طبق design
- [x] ۳.۵ `collectCardPayload` — ارسال فقط فیلد breakpoint فعال
- [x] ۳.۶ تست دستی: سوییچ بین سه دستگاه در ویرایش، drag جدا، ذخیره، reload

---

## فاز ۴ — نمایش بازدیدکننده (بدون ویرایش)

> **ریسک:** resize تدریجی کارت‌ها — نقض نیاز اصلی

- [x] ۴.۱ `resolveBreakpoint(viewportWidth)` + listener در `card-canvas-app.js`
- [x] ۴.۲ metrics با `designWidth[breakpoint]` — سلول ثابت، بدون scale با viewport
- [x] ۴.۳ re-render هنگام عبور از آستانه ۶۴۰ / ۱۰۲۴ — بدون انیمیشن اندازه
- [x] ۴.۴ derive سمت سرور در `readSiteLayout` — بدون PATCH از بازدیدکننده
- [x] ۴.۵ حذف fluid resize از ResizeObserver (فقط عبور breakpoint)

---

## فاز ۵ — تست و مستندات

> **ریسک:** E2E شکننده — عرض viewport ثابت در تست

- [x] ۵.۱ تست unit + smoke E2E-DCL-01 در checklist
- [x] ۵.۲ تست unit derive + smoke E2E-DCL-02 در checklist
- [x] ۵.۳ به‌روزرسانی `tests/smoke/card-canvas-checklist.md`
- [x] ۵.۴ به‌روزرسانی `docs/ui-behavior.md` §۱.۱ و §۸.۴
- [x] ۵.۵ **تموم شدن فاز:** `/sync-docs` → audit + Playwright E2E + رفع رگرسیون بوم کامل `(۱۴۰۵-۰۳-۲۳)`

---

> وقتی ۵.۵ زده شد → `/sync-docs` · یک خط در `docs-personal/walkthrough.md`

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
