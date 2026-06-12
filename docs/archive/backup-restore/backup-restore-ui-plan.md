# برنامهٔ UI پشتیبان‌گیری و بازیابی کامل

## مقدمه

فاز ۶ API و CLI بکاپ/ریستور کامل را پیاده کرد؛ UI عمداً به فاز بعد موکول شده بود. این سند پیاده‌سازی **کارت تنظیمات** + endpoint بازیابی از فایل روی سرور + تست route + مستندات را توضیح می‌دهد.

---

## اهداف

1. کارت «پشتیبان‌گیری و بازیابی» در `/admin/settings`
2. دیالوگ: ایجاد بکاپ، لیست (نام/تاریخ/حجم)، دانلود، بازیابی از سرور، آپلود ZIP
3. `POST /admin/backup/restore/:fileName` با `confirm=true`
4. غنی‌سازی `GET /admin/backup/list` → `{ fileName, sizeBytes, createdAt }`
5. تست HTTP route و به‌روزرسانی مستندات

---

## بک‌اند

| مسیر | توضیح |
|------|--------|
| `POST /admin/backup` | ایجاد ZIP کامل (موجود) |
| `GET /admin/backup/list` | لیست غنی‌شده |
| `GET /admin/backup/download/:fileName` | دانلود |
| `POST /admin/backup/restore/:fileName` | بازیابی از `storage/backups/` — فقط `modulehub-full-*.zip` |
| `POST /admin/restore` | آپلود multipart (موجود) |

همه مسیرها: Super Admin + CSRF.

---

## فرانت‌اند

- `public/api-client.js` — متدهای `createFullBackup`, `listFullBackups`, `downloadFullBackup`, `restoreFullBackupFromServer`, `restoreFullBackupFromUpload`
- `public/admin/backup-settings-dialog.js` — دیالوگ SweetAlert
- `public/admin/settings.js` — کارت در `SETTING_CARDS`

---

## تست

`tests/unit/backup-restore/backup-routes.test.ts` — create/list/download/restore/401/403/400

---

## معیار پذیرش

- Super Admin از UI می‌تواند بکاپ بسازد، لیست ببیند، دانلود کند، از سرور یا آپلود restore کند
- قبل از restore، pre-restore خودکار
- پس از restore موفق، redirect به `/` با پیام راهنما
- `npm test` سبز

---

## فایل‌های مرتبط

- `core/src/modules/backup-restore/backup-routes.ts`
- `core/src/modules/backup-restore/backup-service.ts`
- `docs/backup-restore.md`
- `openspec/changes/backup-restore-ui/specs/backup-restore.yaml`

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
</style>
