<div dir="rtl" style="text-align:right;">

# تسک‌ها — مدیریت کارت پوشه

> **مسیر:** `docs/change/1405-03-24-folder-card-management/tasks.md`  
> **وضعیت:** ✅ **بسته** — ۱۴۰۵/۰۳/۲۴ (2026-06-14) · فاز ۱–۳ پیاده · فاز ۴ **معلق** → [archive](../../archive/1405-03-24-static-card-template-suspended/proposal.md)  
> **OpenSpec:** [`archive/2026-06-14-folder-card-management`](../../../openspec/changes/archive/2026-06-14-folder-card-management/tasks.md)  
> **طراحی:** [design.md](./design.md) · **چرا:** [proposal.md](./proposal.md) · **رفتار UI:** [behavior.md](./behavior.md)

---

## فاز ۱ — توضیح کارت + چرخ‌دنده پوشه (MVP)

- [x] ۱.۱ فیلد `cardDescription` به `LayoutTreeNode` و نمونهٔ `docs/site-layout.json`
- [x] ۱.۲ `modulehub-card-store.js`: `card-desc` برای پوشه؛ ماژول `cardDescription ?? changelog` + مارک‌داون GFM
- [x] ۱.۳ CSS: `line-clamp` روی `.card-desc` (حداکثر ۲ خط در نمایش کارت)
- [x] ۱.۴ `shouldShowGearForCard`: ⚙ برای `folder` وقتی Super Admin — مخفی در edit mode
- [x] ۱.۵ `card-canvas-app.js`: کلیک ⚙ پوشه → `stopPropagation` + منوی شناور (نه navigate)

---

## فاز ۲ — API و منطق درخت

- [x] ۲.۱ `folder-management.ts`: `renameFolder`, `moveFolder`, `deleteFolder` + `isDescendant`
- [x] ۲.۲ `PATCH /admin/folder/:folderId` — name، cardDescription، parentId
- [x] ۲.۳ `DELETE /admin/folder/:folderId` — چهار `contentPolicy`
- [x] ۲.۴ cascade-delete از سرویس حذف ماژول reuse (stop + delete files)
- [x] ۲.۵ تست unit: درخت تو در تو، حلقه ممنوع، root غیرقابل حذف
- [x] ۲.۶ تست API: PATCH rename؛ DELETE `reject-if-not-empty` → 409
- [x] ۲.۷ `layout-node-move.ts` + drag transfer در edit mode (`card-transfer.js`)

---

## فاز ۳ — دیالوگ و UX

- [x] ۳.۱ `dialog.js` + `gear-floating-menu.js`: منوی شناور پوشه + فرم ویرایش نام/توضیح (تا ۴۰۰۰ کاراکتر، مارک‌داون)
- [x] ۳.۲ tree picker برای جابجایی از منوی ⚙
- [x] ۳.۳ wizard حذف با انتخاب سیاست محتوا + تأیید نام برای cascade
- [x] ۳.۴ `script.js`: `openFolderGearMenu` + `handleFolderGearAction` + refresh بعد از موفقیت
- [x] ۳.۵ redirect وقتی `?folder=` به پوشهٔ حذف‌شده اشاره کند
- [x] ۳.۶ فیلد «توضیح کارت» در تنظیمات ماژول — جدا از changelog
- [x] ۳.۷ E2E **E2E-FCM-01** (ویرایش نام و توضیح)
- [x] ۳.۸ E2E **E2E-FCM-02** / **02b** / **02c** (جابجایی drag در edit mode)
- [x] ۳.۹ E2E حذف — معوق (wizard/API/unit پوشش داده)
- [x] ۳.۱۰ `behavior.md` + `docs/ui-behavior.md` §۱.۱ و §۲.۵
- [x] ۳.۱۱ `openspec/specs/virtual-folder/spec.md` — سناریوهای PATCH/DELETE
- [x] ۳.۱۲ `npm test` → ۲۳۷ PASS (2026-06-14)

**E2E اضافه:** FCM-03 چندخطی · FCM-04 bold · FCM-05 راهنما · FCM-06 سقف ۴۰۰۰ · FCM-07 هدر

---

## فاز ۴ — دیزاین استاتیک کارت — ⏸ معلق (۱۴۰۵/۰۳/۲۴)

> پیاده نشد. ایدهٔ iframe + `card.html` **معلق** و بایگانی شد: [archive/1405-03-24-static-card-template-suspended](../../archive/1405-03-24-static-card-template-suspended/proposal.md)  
> روش جدید تکمیل دیزاین کارت → [card-live-customization](../card-live-customization/proposal.md)

- [~] ۴.۱–۴.۷ معلق — نه لغو، نه انجام‌شده

---

## پس از اتمام

- [x] خط در `docs/tasks.md` — فاز ۷.۹
- [x] `/sync-docs` → `1405-03-24-folder-card-management`
- [x] OpenSpec → `archive/2026-06-14-folder-card-management`

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
