# new-change

<div dir="rtl" style="text-align:right;">

## یه فیچر جدید؟ پوشهٔ change بساز

یه تغییر بزرگ می‌خوای — نذار `proposal` و `design` اصلی شلوغ بشن. برو `docs/change/<اسم>/`.

**مرجع لحن (اجباری قبل از نوشتن):**
- `AI learning docs/00-start-new-project/how-to-write-proposal.md`
- `AI learning docs/00-start-new-project/how-to-write-design.md`
- `AI learning docs/00-start-new-project/how-to-write-task.md`
- `AI learning docs/00-start-new-project/review-checklist.md` → بخش «لحن و سبک»

**نمونهٔ لحن درست:** `docs/change/1405-03-24-folder-card-management/proposal.md`

---

### ورودی

بعد `/new-change` یا **اسم پوشه** (`card-view`) یا **بگو چی می‌خوای** — اگه چیزی نگفت، بپرس.

---

### کارها

1. **اسم** — انگلیسی، kebab-case، **بدون تاریخ**
2. **بساز:** `proposal.md` · `design.md` · `tasks.md` (+ راهنمای عملی اگر لازم بود، مثلاً `module-card-guide.md`)
3. **بنویس به ترتیب:** proposal → design → tasks

---

### لحن `docs/` — حتماً رعایت کن

| بکن | نکن |
|-----|-----|
| شروع با داستان: «فرض کن رضا…» | شروع با جدول §۱ و bullet تلگرافی |
| پاراگراف خودمونی | پشت‌سرهم «\| نقش \| نیاز \|» |
| جملهٔ کامل فارسی | «ریسک: X — mitigation: Y» |
| جدول فقط برای API یا چک‌لیست tasks | هر بخش یک جدول |

`docs-for-ai/` انگلیسی و فشرده — **نه** `docs/`.

---

### یادت باشه

**بکن:** فارسی داستان‌محور · ریسک در proposal · تست در tasks

**نکن:** تاریخ اول اسم · archive برای change فعال · secret · داک تلگرافی

**تموم شد:** `/sync-docs` → `1405-XX-XX-<slug>`

</div>
