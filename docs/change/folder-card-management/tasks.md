<div dir="rtl" style="text-align:right;">

# تسک‌ها — مدیریت کارت پوشه

> **مسیر:** `docs/change/folder-card-management/tasks.md`  
> **طراحی:** [design.md](./design.md) · **چرا:** [proposal.md](./proposal.md) · **رفتار UI:** [behavior.md](./behavior.md)

---

## فاز ۱ — توضیح کارت + چرخ‌دنده پوشه (MVP)

> **ریسک این فاز:** اگر validation درخت ضعیف باشد → حلقه در `site-layout.json` و خرابی navigation

- [ ] ۱.۱ فیلد `cardDescription` به `LayoutTreeNode` و نمونهٔ `docs/site-layout.json` اضافه شود
- [ ] ۱.۲ `modulehub-card-store.js`: نمایش `card-desc` برای پوشه؛ برای ماژول `cardDescription ?? changelog`
- [ ] ۱.۳ CSS: `line-clamp` روی `.card-desc` (حداکثر ۲ خط) — تست دستی روی کارت کوچک ۳×۳
- [ ] ۱.۴ `shouldShowGearForCard`: ⚙ برای `folder` وقتی Super Admin — مخفی در edit mode (همان رفتار ماژول)
- [ ] ۱.۵ `card-canvas-app.js`: کلیک ⚙ پوشه → handler جدا (نه navigate)
- [ ] ۱.۶ **تموم شدن زیرفاز:** تست دستی — پوشه با توضیح روی بوم دیده شود؛ ⚙ فقط برای ادمین

---

## فاز ۲ — API و منطق درخت

> **ریسک:** جابجایی اشتباه → orphan node یا حلقه

- [ ] ۲.۱ ماژول `folder-management.ts`: `renameFolder`, `moveFolder`, `deleteFolder` + `isDescendant`
- [ ] ۲.۲ `PATCH /admin/folder/:folderId` — name، cardDescription، parentId
- [ ] ۲.۳ `DELETE /admin/folder/:folderId` — چهار `contentPolicy` طبق design
- [ ] ۲.۴ cascade-delete از سرویس حذف ماژول موجود reuse شود (stop + delete files)
- [ ] ۲.۵ تست خودکار: unit برای درخت تو در تو، حلقه ممنوع، root غیرقابل حذف
- [ ] ۲.۶ تست API: PATCH rename؛ DELETE `reject-if-not-empty` روی پوشهٔ پر → 409
- [ ] ۲.۷ **تموم شدن فاز:** `npm test` سبز برای home-layout

---

## فاز ۳ — دیالوگ و UX

> **ریسک:** کلیک اشتباه کاربر روی ⚙ به‌جای ورود به پوشه — stopPropagation باید درست باشد

- [ ] ۳.۱ `dialog.js`: `showFolderGearDialog` + فرم ویرایش نام/توضیح
- [ ] ۳.۲ tree picker ساده برای جابجایی (لیست تاشو از layout cache)
- [ ] ۳.۳ wizard حذف با انتخاب سیاست محتوا + تأیید نام برای cascade
- [ ] ۳.۴ `script.js`: `openFolderGearMenu` + `handleFolderGearAction` + refresh بعد از موفقیت
- [ ] ۳.۵ اگر URL `?folder=` به پوشهٔ حذف‌شده اشاره کند → redirect به والد
- [ ] ۳.۶ فیلد «توضیح کارت» در تنظیمات ماژول (⚙ ماژول) — ذخیره روی layout node
- [ ] ۳.۷ تست E2E: **E2E-FCM-01** (ویرایش نام و توضیح)
- [ ] ۳.۸ تست E2E: **E2E-FCM-02** (جابجایی)
- [ ] ۳.۹ تست E2E: **E2E-FCM-03** (حذف با سیاست‌های مختلف)
- [x] ۳.۱۰ `behavior.md` + به‌روزرسانی `docs/ui-behavior.md` §۱.۱ و §۲.۵ — [behavior.md](./behavior.md)
- [ ] ۳.۱۱ به‌روزرسانی `openspec/specs/virtual-folder/spec.md`
- [ ] ۳.۱۲ **تموم شدن فاز:** E2E سبز + lint

---

## فاز ۴ — دیزاین استاتیک کارت (بعد از MVP پوشه)

> **ریسک:** XSS با innerHTML؛ شکستن گرید اگر drag/resize برای template فعال بماند

- [ ] ۴.۱ سند `docs/module-hosting-guide.md` — بخش `cardPresentation` و `assets/card.html` استاتیک
- [ ] ۴.۲ manifest schema: `mode: static-template`، `layoutLocked: true`
- [ ] ۴.۳ رندر iframe بدون script در `createCardElement`
- [ ] ۴.۴ edit mode: غیرفعال کردن drag/resize وقتی `layoutLocked`
- [ ] ۴.۵ validation سرور: رد کردن تغییر `cardGridW/H` یا `col/row` برای node قفل‌شده
- [ ] ۴.۶ نمونهٔ ماژول demo با `assets/card.html` استاتیک
- [ ] ۴.۷ تست E2E: کارت template — دستگیرهٔ resize دیده نشود؛ اسکرول بوم روان

---

## پس از اتمام فاز ۱–۴

- [ ] خط در `docs/tasks.md` اصلی — فاز ۷.۹ مدیریت پوشه + ۷.۱۰ دیزاین استاتیک
- [ ] `/sync-docs` → rename پوشه به `1405-XX-XX-folder-card-management`

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
