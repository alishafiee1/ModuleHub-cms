<div dir="rtl" style="text-align:right;">

# تسک‌ها — آپلود ماژول محکم‌تر

اینجا قدم‌های ساخت همان چیزی است که در [proposal.md](./proposal.md) قول دادیم و در [design.md](./design.md) مسیرش را توضیح دادیم: آپلود ZIP باید با بسته‌بندی‌های رایج‌تر کنار بیاید، ماژول SPA آماده را راحت‌تر سرو کند، Docker را با انتخاب اشتباه خراب نکند، و پوشهٔ نیمه‌کاره روی دیسک جا نگذارد.

فرض کن فردا یک نفر تازه وارد پروژه می‌شود و فقط همین فایل را باز می‌کند. باید بفهمد اول پاکسازی و داک را داریم، بعد ZIP و `dist`، بعد ویزارد و cleanup، و در آخر Python. اگر امروز می‌خواهی کد بزنی، اول proposal و design را بخوان، بعد از فاز ۲ شروع کن؛ چون فاز ۱ همین مستندات است.

> چرا: [proposal.md](./proposal.md) · مسیر سیستم: [design.md](./design.md)

---

## فاز ۱ — داک و آماده‌سازی

در این فاز همهٔ مسیر را روشن می‌کنیم تا بعداً کد از روی حدس جلو نرود. تموم شدن فاز یعنی این پوشهٔ change قابل فهم است و از tasks اصلی پروژه لینک دارد.

- [x] ۱.۱ proposal را بنویس تا روشن شود چرا upload فعلی برای ZIPهای رایج و آپلود نیمه‌کاره دردسر می‌سازد.
- [x] ۱.۲ design را بنویس تا رفتار flatten، `dist`، Docker validation و cleanup مشخص باشد.
- [x] ۱.۳ tasks را بنویس تا ترتیب کارها و تست‌ها قابل تیک باشد.
- [x] ۱.۴ لینک این change را به `docs/tasks.md` اصلی اضافه کن تا از نقشهٔ کلی پروژه گم نشود.
- [x] ۱.۵ **تموم شدن فاز:** proposal/design/tasks از چک‌لیست مستندات عبور کنند و مسیر بعدی برای پیاده‌سازی روشن باشد.

---

## فاز ۲ — ZIP و `dist`

در این فاز به سیستم یاد می‌دهیم با دو شکل رایج بسته‌بندی کنار بیاید: ZIPی که همه‌چیز داخل یک پوشهٔ تکی دارد، و SPAیی که خروجی آماده‌اش داخل `dist` است.

- [x] ۲.۱ استخراج ZIP بعد از باز شدن، اگر همهٔ فایل‌ها زیر یک پوشهٔ سطح اول مشترک بودند، محتوا را یک سطح به ریشهٔ ماژول منتقل کند.
- [x] ۲.۲ تست واحد: ZIP با `site/index.html` بعد از extract باید `index.html` را در ریشهٔ ماژول داشته باشد.
- [x] ۲.۳ تست واحد: ZIPی که از اول `index.html` در ریشه دارد نباید تغییر اضافه بخورد.
- [x] ۲.۴ ریشهٔ محتوای ماژول را از ریشه یا `dist` تشخیص بده؛ ریشهٔ اصلی فقط وقتی `dist` را می‌بازد که خودش `index.html` نداشته باشد.
- [x] ۲.۵ سرو فایل static و SPA fallback از همان ریشهٔ تشخیص‌داده‌شده انجام شود.
- [x] ۲.۶ تست: ماژولی با `dist/index.html` از مسیر `/modules/<id>/` صفحه را نشان بدهد.
- [x] ۲.۷ **تموم شدن فاز:** ZIP تک‌پوشه‌ای و SPA داخل `dist` بدون جابه‌جایی دستی کار کنند.

---

## فاز ۳ — ویزارد و پاکسازی

در این فاز جلوی دو دردسر عملی را می‌گیریم: Docker با پورت صفر و پوشهٔ یتیم بعد از cancel.

- [x] ۳.۱ در ویزارد، وقتی Docker روشن شد، گزینهٔ نیاز به پروسه خودکار روشن و قفل شود.
- [x] ۳.۲ در سرور، درخواست `docker: true` و `needsProcess: false` رد شود؛ چون فقط UI کافی نیست.
- [x] ۳.۳ تست واحد یا API: ذخیرهٔ Docker بدون پروسه باید خطای قابل فهم بدهد.
- [x] ۳.۴ endpoint پاکسازی آپلود رها شده اضافه شود؛ فقط Super Admin و فقط برای ماژولی که هنوز در layout ثبت نشده.
- [x] ۳.۵ فرانت بعد از cancel یا خطای ویزارد، اگر upload انجام شده بود، cleanup را صدا بزند.
- [x] ۳.۶ اسکریپت نگهداری برای لیست/حذف پوشه‌های `mod-*` بدون ورودی layout اضافه شود.
- [x] ۳.۷ تست: cleanup نباید ماژولی را که در layout ثبت شده حذف کند.
- [x] ۳.۸ **تموم شدن فاز:** Docker اشتباه ذخیره نشود و آپلود رها شده پوشهٔ بی‌صاحب نگذارد.

---

## فاز ۴ — Python

این فاز بعد از محکم شدن upload می‌آید. هدف این است که اگر ماژول Python با `requirements.txt` آپلود شد، فقط نصب وابستگی نداشته باشیم؛ مسیر start هم روشن باشد.

- [x] ۴.۱ تشخیص start برای Python اضافه شود: `app.py`، `main.py` یا مسیر مشخص‌شده.
- [x] ۴.۲ دستور pip روی ویندوز و لینوکس درست ساخته شود؛ مسیر `venv` در هر سیستم فرق دارد.
- [x] ۴.۳ تست واحد: ماژول Python با `app.py` دستور شروع قابل انتظار بسازد.
- [x] ۴.۴ تست واحد: اگر Python manifest هست ولی فایل start پیدا نشد، خطا انسانی و قابل فهم باشد.
- [x] ۴.۵ **تموم شدن فاز:** ماژول Python ساده بعد از نصب وابستگی، راه شروع شدن داشته باشد.

---

> وقتی این change واقعاً پیاده و تست شد، skill `sync-docs` اجرا می‌شود و پوشه با تاریخ شمسی بسته می‌شود.

</div>

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
