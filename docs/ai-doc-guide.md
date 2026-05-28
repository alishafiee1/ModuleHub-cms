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

table {
    direction: rtl;
    text-align: right;
    width: 100%;
    border-collapse: collapse;
}

thead th, tbody td {
    text-align: right;
    vertical-align: top;
    padding: 0.35em 0.5em;
}

table td code, table th code {
    direction: ltr;
    unicode-bidi: embed;
    text-align: left;
    display: inline-block;
}
</style>

<div dir="rtl" style="text-align:right;">

# راهنمای مستندسازی برای AI — ModuleHub CMS

> این فایل به **Agent / AI** می‌گوید هر سند چه نقشی دارد و چه اشتباهاتی را مرتکب نشود.  
> انسان‌ها می‌توانند `proposal.md` را بخوانند؛ AI باید **قبل از ویرایش docs** این فایل را ببیند.

---

## اصل طلایی

**یک موضوع → یک جای درست.** تکرار بین فایل‌ها فقط با **ارجاع یک خطی**، نه کپی جدول.

---

## نقش هر فایل

| فایل | مخاطب | سبک | محتوا |
|------|--------|-----|--------|
| `proposal.md` | ادمین / مالک سایت | **روایی** | چالش → راه‌حل → حس کاربری |
| `design plan.md` | توسعه‌دهنده / AI پیاده‌ساز | **فنی** | معماری، جدول، مسیر، محدودیت |
| `tasks.md` | پیاده‌ساز / QA | **چک‌لیست** | فاز، تسک، خروجی، روش تست |
| `system-settings.example.json` | کد | **داده** | پیش‌فرض‌های عددی — منبع حقیقت |
| `site-layout.json` | کد | **نمونه schema** | ساختار ماژول در JSON |
| `server condition.md` | عملیات | **گزارش زنده** | IP، NIC، سرویس‌ها — به‌روز دستی |
| `module-hosting-guide.md` | توسعه‌دهنده | **فنی** | Static/Backend/Docker، base path |
| `code-rolls.md` | AI هنگام کدنویسی | **قواعد کد** | TypeScript، امنیت، تست |

---

## الگوی `proposal.md` — مثال قابل لمس

### ساختار هر بخش روایی

```
1. چالش (یک جمله — مشکل واقعی)
2. پاسخ (یک جمله — ModuleHub چه می‌کند)
3. تجربه کاربر (۲–۴ bullet یا یک پارagraph کوتاه)
4. ارجاع فنی (یک خط به design plan / JSON)
```

### نمونه خوب (تنظیمات سراسری)

> **چالش:** سرور سقف کلی می‌خواهد — ZIP، تعداد ماژول، لاگ، دو خط اینترنت.  
> **پاسخ:** صفحه `/admin/settings` — یک بار تنظیم، CMS رعایت می‌کند.  
> جزئیات: `design plan.md` §۱۰.

### نمونه بد (AI نباید بنوید)

- جدول ۱۲ ردیفی پیش‌فرض‌ها در `proposal.md`
- دستور `ip -o link show up` در proposal
- تکرار کامل بخش کش/لاگ از design plan

---

## قواعد نوشتن به تفکیک فایل

### `proposal.md`
- زبان ساده، دوم شخص («شما»)
- تشبیه کوتاه مجاز (خانه مشترک، کارت روی میز)
- **بدون:** جدول فنی، endpoint، مسیر absolute، عدد دقیق بیش از یک مورد در پارagraph
- وضعیت ماژول: فقط `running` / `stopped` / `crashed` با یک جمله معنی

### `design plan.md`
- جدول، مسیر فایل، دستور shell، محدودیت cgroups
- **بدون:** داستان، «مثل این می‌ماند که…»، تکرار مقدمه proposal
- تنظیمات سراسری: جدول کامل + radio شبکه + ممنوعیت default route دائمی

### `tasks.md`
- ستون: وظیفه | جزئیات | خروجی | روش تست
- **بدون:** توضیح چرایی محصول، پارagraph بلند

### JSON نمونه
- تغییر پیش‌فرض → همزمان `system-settings.example.json` + جدول design plan
- `site-layout.json` فقط برای schema — status نمونه: هر سه حالت

---

## مسیرها — AI معمولاً اشتباه می‌کند

| درست | غلط (ممنوع) |
|------|-------------|
| `/var/cache/modulehub/pkg/<hash>/` | `storage/cache/pkg/` |
| `/var/log/modulehub/modules/<id>.log` | `storage/logs/modules/` |
| `/opt/modulehub-cms/storage/system-settings.json` | حدس در کد بدون JSON |
| پورت خودکار ۴۱۰۰–۴۹۹۹ | پورت random یا 3000 ثابت |

---

## شبکه dual-WAN — خط قرمز

- radio در settings = **فقط** برای npm / docker pull / git — **موقت**
- بعد از عملیات: **restore** metric (`network-metric-toggler`)
- **هرگز** در docs یا کد: «تغییر default route دائمی از پنل» — ریسک Xray / 3x-ui

---

## وقتی کاربر درخواست «به‌روز docs» داد

1. تعیین کن موضوع **روایی** است یا **فنی**
2. روایی → `proposal.md` (خلاصه + ارجاع)
3. فنی → `design plan.md` + در صورت عدد → `system-settings.example.json`
4. تسک جدید → یک ردیف در `tasks.md`
5. `proposal.md` را سنگین نکن

---

## چک قبل از commit docs

- [ ] جدول تکراری بین proposal و design حذف یا ارجاع شد؟
- [ ] مسیر `/var/` برای کش و لاگ ماژول درست است؟
- [ ] پیش‌فرض عددی فقط در design + example JSON است؟
- [ ] proposal هنوز برای غیرفنی قابل خواندن است؟

</div>
