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

# خطاهای عمومی AI — راهنمای ثبت

> خطاهای **مخصوص یک پروژه** → `<project>/docs/AI-common-mistakes/<نام-مدل>.md`  
> قانون Cursor: `AI learning docs/.cursor/rules/log-ai-common-mistakes.mdc`

---

## دو لایه ذخیره‌سازی

| لایه | مسیر | محتوا |
|------|------|--------|
| **عمومی** | `AI learning docs/AI common mistakes/` | اشتباهاتی که در هر repo تکرار می‌شوند |
| **پروژه** | `docs/AI-common-mistakes/` داخل همان repo | deploy، مسیرها، اسکریپت‌ها، تنظیمات همان پروژه |

---

## نام فایل مدل

- یک فایل per مدل: `composer-2.5.md` یا `Composer 2.5.md`
- مدل دیگر: `gpt-5.md`, `claude-opus.md`, …

---

## پیشوند ID

| پیشوند | معنی |
|--------|------|
| `SHELL-` | ترمینال، env، OS |
| `DEPLOY-` | استقرار، سرور (عمومی) |
| `CODE-` | کد / معماری |
| `DOC-` | مستندات |
| `OK-` | مسیر موفق نهایی |

شماره: `001`, `002`, … در **همان فایل**.

---

## قالب (کوتاه — برای agent)

```markdown
### [SHELL-00N] عنوان
- **اشتباه:** یک جمله
- **درست:** یک جمله
- **زمینه:** اختیاری
```

---

## قوانین

1. عمومی vs پروژه را اشتباه مخلوط نکن
2. حداکثر ۳ bullet — بدون داستان
3. تکراری ننویس؛ مشابه را یک ورودی گسترش بده
4. پس از «درست شد» → `OK-` در فایل مناسب

---

## راه‌اندازی پوشه در پروژه جدید

```text
docs/AI-common-mistakes/
├── readme.md           ← از project-readme-template.md کپی
└── composer-2.5.md     ← خالی یا اولین خطا
```

قالب readme پروژه: [`project-readme-template.md`](project-readme-template.md)

---

## فایل‌های این پوشه (عمومی)

| فایل | محتوا |
|------|--------|
| `readme.md` | همین سند |
| `Composer 2.5.md` | خطاهای عمومی Composer |
| `project-readme-template.md` | قالب readme برای `docs/` هر پروژه |


