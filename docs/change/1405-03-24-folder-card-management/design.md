<div dir="rtl" style="text-align:right;">

# طراحی — مدیریت کارت پوشه + دیزاین استاتیک

> **مسیر:** `docs/change/1405-03-24-folder-card-management/design.md` · **وضعیت:** ✅ بسته ۱۴۰۵/۰۳/۲۴  
> **پیش‌نیاز:** [proposal.md](./proposal.md)  
> **رفتار UI:** [behavior.md](./behavior.md)  
> **جدا:** کد پویا و realtime → [card-live-customization](../card-live-customization/design.md)

---

## §۱ محدوده

| فاز | محدوده |
|-----|--------|
| **۱** | `cardDescription`، ⚙ پوشه، PATCH/DELETE پوشه، دیالوگ‌های UI |
| **۲** | قالب HTML **استاتیک** از ماژول (`cardPresentation` در manifest) — **بدون** drag/resize روی بوم |

---

## §۲ وضعیت پیاده‌شده (۱۴۰۵/۰۳/۲۴ — مرجع کد)

- رندر کارت: `public/js/card-canvas/modulehub-card-store.js` → `createCardElement`
- پوشه: `folder-card` + `card-desc` (مارک‌داون GFM، `line-clamp` ۲ خط) + ⚙ برای Super Admin
- ماژول: ⚙ + `cardDescription ?? changelog` در `card-desc`
- منوی ⚙: `public/js/gear-floating-menu.js` — آیکون‌های شناور (راهنما، ویرایش چیدمان، پالت، ویرایش، جابجایی، حذف)
- API پوشه: `PATCH` / `DELETE` در `folder-management.ts` + `folder-management-routes.ts`
- جابجایی drag در edit: `layout-node-move.ts` + `public/js/card-canvas/card-transfer.js`
- ایجاد پوشه: `POST /admin/folder` (قبلی) + rename/move/delete (جدید)

---

## §۳ مدل داده

### ۳.۱ فیلد جدید روی `LayoutTreeNode`

```typescript
/** Short subtitle under card title — folders and module placement nodes */
cardDescription?: string;  // max 200 chars recommended
```

- ذخیره در `site-layout.json` روی node مربوط به کارت (نه فقط `modules` map)
- برای node نوع `module`: `name` = عنوان کارت؛ `cardDescription` = زیرعنوان؛ `modules[id].changelog` = یادداشت نسخه (جدا بماند)

### ۳.۲ سیاست حذف

```typescript
type FolderDeleteContentPolicy =
  | 'reject-if-not-empty'
  | 'move-to-parent'
  | 'move-to-folder'
  | 'cascade-delete';

interface DeleteFolderBody {
  contentPolicy: FolderDeleteContentPolicy;
  /** Required when contentPolicy === 'move-to-folder' */
  targetFolderId?: string;
  /** Required when contentPolicy === 'cascade-delete' — must match folder name */
  confirmName?: string;
}
```

---

## §۴ API

همهٔ مسیرها `requireSuperAdminMiddleware`.

| متد | مسیر | بدنه | پاسخ |
|-----|------|------|------|
| `PATCH` | `/admin/folder/:folderId` | `{ name?, cardDescription?, parentId? }` | `{ node }` |
| `DELETE` | `/admin/folder/:folderId` | `DeleteFolderBody` | `{ deletedId, movedChildren?, deletedModules? }` |

### ۴.۱ قوانین `PATCH`

- `folderId === 'root'` → `parentId` قابل تغییر نیست؛ rename مجاز
- `parentId` جدید: باید وجود داشته باشد، نوع `folder`، **نه** خود node و **نه** descendant
- پس از `parentId` تغییر: `cardGrid*` node در parent مقصد **append** با slot خالی (همان الگوی wizard پوشه جدید)
- atomic write `site-layout.json` + backup اختیاری قبل از cascade

### ۴.۲ قوانین `DELETE`

```
reject-if-not-empty:
  if children.length > 0 → 409 { error: 'FOLDER_NOT_EMPTY' }

move-to-parent:
  reparent all direct children to node.parentId
  remove folder node

move-to-folder:
  reparent all direct children to targetFolderId (validate not descendant)
  remove folder node

cascade-delete:
  require confirmName === node.name
  DFS: delete modules via existing module-delete service
  remove folder subtree from tree
```

- ماژول `running` در cascade: **فاز ۱** → auto-stop سپس حذف (همان مسیر delete module)؛ در UI هشدار
- اگر کاربر داخل پوشهٔ حذف‌شده است (`?folder=deleted`) → redirect به `parentId` یا `/`

---

## §۵ UI / رفتار

### ۵.۱ نمایش کارت پوشه

```
card-content
  card-icon → fa-folder + gear (if super admin & !editMode)
  card-title → node.name
  card-desc  → node.cardDescription (if non-empty)
```

- استایل `card-desc` از `style.css` موجود — بدون تغییر اساسی
- حداکثر ۲ خط با `line-clamp` (CSS) برای جلوگیری از شکستن گرید

### ۵.۲ `shouldShowGearForCard` — تغییر

```javascript
if (card.nodeType === 'folder') {
  return auth.isSuperAdmin;
}
// module — unchanged
```

### ۵.۳ دیالوگ ⚙ پوشه (`FolderDialogs` یا گسترش `dialog.js`)

عنوان: `مدیریت پوشه: [نام]`

| دکمه | action id |
|------|-----------|
| ویرایش نام و توضیح | `edit-meta` → فرم Swal |
| جابجایی به پوشهٔ دیگر | `move` → tree picker |
| حذف پوشه | `delete` → wizard سیاست محتوا |

الگوی بصری: همان `gear-actions-grid` در `dialog.js`.

### ۵.۴ Tree picker جابجایی

- لیست تاشو از `GET /api/layout` (درخت از قبل در کلاینت)
- غیرفعال: خود پوشه، descendants، `root` اگر جابجایی به root منطقی است → **مجاز** (فقط `parentId: 'root'`)
- نمایش مسیر: `خانه > … > مقصد`

### ۵.۵ Wizard حذف

1. اگر خالی → تأیید ساده
2. اگر پر → radio: انتقال به والد / انتقال به پوشهٔ دیگر / حذف همه (خطر)
3. `cascade-delete` → input تایپ نام پوشه

---

## §۶ یکپارچگی با ماژول (توضیح کارت)

- در دیالوگ ⚙ ماژول → تب تنظیمات: فیلد **«توضیح کارت»** جدا از changelog
- ذخیره: `PATCH` layout node + در صورت نیاز `modules[id]` برای changelog
- نمایش: `cardDescription ?? changelog` روی node ماژول

---

## §۷ فاز ۲ — قالب HTML استاتیک از ماژول

### ۷.۱ manifest

در `module.json`:

```json
{
  "cardPresentation": {
    "mode": "default" | "static-template",
    "templatePath": "assets/card.html",
    "sandbox": "iframe",
    "layoutLocked": true
  }
}
```

- `layoutLocked: true` (پیش‌فرض برای `static-template`) → کارت روی بوم **غیرقابل drag و resize** در edit mode.
- قبل از فعال‌سازی قالب، ادمین یک‌بار جای/اندازه را در حالت `default` تنظیم می‌کند؛ بعد از switch به `static-template` قفل می‌شود.

### ۷.۲ رندر

- CMS فایل را از `standalone-modules/<id>/` سرو می‌کند (`GET /modules/<id>/assets/card.html`)
- **iframe** با `sandbox=""` (بدون script) — فقط HTML/CSS استاتیک
- اندازه iframe = ابعاد slot گرید (`cardGridW` × `cardGridH`) — تغییر نمی‌کند مگر ادمین قالب را موقتاً به `default` برگرداند
- **بدون** `postMessage` و **بدون** polling

### ۷.۳ رفتار edit mode

```javascript
// card-canvas-app.js — پیشنهاد
if (node.cardPresentation?.layoutLocked) {
  disableDragResize(cardEl);
}
```

### ۷.۴ چرا iframe نه innerHTML

- `innerHTML` از JSON = XSS
- iframe جدا = خرابی یک قالب کل بوم را نمی‌گیرد

---

## §۸ امنیت و پایداری سرور

| موضوع | راه‌حل |
|--------|--------|
| حذف cascade | تأیید نام + لاگ audit در `cms.log` |
| جابجایی حلقه | validation در `layout-tree-utils` قبل از write |
| HTML استاتیک | iframe بدون script + CSP `frame-src` محدود |
| قفل چیدمان | `layoutLocked` در validation نوشتن layout |
| race روی JSON | همان mutex/queue نوشتن `writeSiteLayout` فعلی |

---

## §۹ تست

| نوع | سناریو |
|-----|--------|
| unit | `moveFolder`, `deleteFolder`, `validateParent` — درخت‌های تو در تو |
| API | PATCH rename؛ DELETE هر چهار policy |
| E2E | E2E-FCM-01..03 از proposal |
| regression | کارت ماژول ⚙ و changelog fallback بدون شکست |

---

## §۱۰ فایل‌های پیش‌بینی‌شده (فاز ۱–۲)

| لایه | فایل |
|------|------|
| types | `core/src/modules/home-layout/types.ts` |
| logic | `core/src/modules/home-layout/folder-management.ts` (جدید) |
| routes | گسترش `layout-routes.ts` یا router جدا زیر `/admin/folder` |
| UI | `public/dialog.js`, `public/script.js`, `modulehub-card-store.js` |
| spec | `openspec/specs/virtual-folder/spec.md` — سناریوهای جدید |
| docs | `ui-behavior.md` — بخش دیالوگ پوشه |

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
