<div dir="rtl" style="text-align:right;">

# چک‌لیست — هم‌راستاسازی داکیومنت اصلی

> بعد از اتمام: `/sync-docs` → آرشیو `1405-XX-XX-core-docs-sync`

---

## ۱. پوشه change

- [x] `docs/change/core-docs-sync/proposal.md`
- [x] `docs/change/core-docs-sync/design.md`
- [x] `docs/change/core-docs-sync/tasks.md`

---

## ۲. [`docs/proposal.md`](../../proposal.md)

- [x] گزینه «از کتابخانه» → فاز بعد؛ فعلاً ZIP + پوشه
- [x] گسترش چیدمان کارت — per-device برای ادمین
- [x] پاراگراف مدیریت پوشه (⚙، توضیح، حذف با سؤال محتوا)
- [x] تنظیمات سراسری — حذف «تا فاز ۸» و bullet NIC
- [x] لحن داستان‌محور حفظ شود

---

## ۳. [`docs/design.md`](../../design.md)

- [x] §۱ — نصب npm مستقیم؛ بدون toggle NIC در settings
- [x] §۳ — ساختار `core/src/modules/*` + `dist/` + `eslint.config.mjs`
- [x] §۵.۶ — API عمومی `/health`، `/api/layout`، `/api/auth/*`
- [x] §۶ — github-sync، concurrent limit، auto-restart
- [x] §۶.۵ — `POST /admin/wizard/save`
- [x] §۱۱.۵ — per-device fields + breakpoint
- [x] §۱۱.۶ — `PATCH /admin/layout-node/:nodeId` در جدول
- [x] §۱۴ — برچسب تکمیل‌شده / خلاصه
- [x] §۱۳.۲ — CSRF بدون «فاز ۸»

---

## ۴. [`docs/tasks.md`](../../tasks.md)

- [x] header: فاز ۰–۸ ✅
- [x] جدول فاز: ردیف ۸ → ✅ 2026-06-13
- [x] فاز ۷.۵: `MODULEHUB_DEV_SUPER_ADMIN` = bypass اختیاری dev
- [x] لغو ۹.۹ NIC
- [x] ردیف concurrent-limit (۳.۷) + ارجاع unit test
- [x] deliverables: `eslint.config.mjs`

---

## ۵. تأیید نهایی

- [x] اعداد با `system-settings.example.json` و `grid-config.ts`
- [x] هیچ NIC toggle در سه فایل اصلی (به‌جز یادداشت لغو ۹.۹)
- [x] فیچرهای باز فقط لینک `change/` — بدون جزئیات پیاده‌سازی
- [x] `npm test` و `npm run lint`

**فرعی (cross-check):** `docs/developer-guide.md` · `docs-for-ai/project.md`

</div>
