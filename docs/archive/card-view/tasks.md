<div dir="rtl" style="text-align:right;">

# کارهایی که باید انجام بشه — نمای کارت ماژول

**خلاصه:** این change می‌خواهد کاری کند که سازندهٔ ماژول بتواند کارت خودش را برای صفحهٔ اصلی بسازد؛ CMS فقط کارت را امن و قابل اندازه‌گیری نشان می‌دهد، اما داده و دکمه‌ها مال خود ماژول است.

فرض کن فردا یک سازندهٔ ماژول IoT پشت میز می‌نشیند. می‌خواهد روی کارت خانه نشان بدهد چند دستگاه آنلاین است و یک دکمهٔ روشن/خاموش داشته باشد. نباید مجبور شود CMS را دستکاری کند یا از یک درگاه مرکزی عجیب استفاده کند. باید بتواند داخل ZIP خودش `card.html` بگذارد و اگر لازم داشت با polling، WebSocket یا هر روش دیگری به سرویس خودش وصل شود.

این فایل چک‌لیست ساخت همین مسیر است. اگر امروز تازه وارد این change شدی، اول [proposal.md](./proposal.md) را بخوان تا بفهمی چرا این قابلیت لازم است، بعد [design.md](./design.md) را ببین تا نقش CMS و ماژول روشن شود، و بعد از اولین تیک باز همین فایل شروع کن.

> چرا: [proposal.md](./proposal.md) · طراحی: [design.md](./design.md) · راهنمای سازنده: [module-card-guide.md](./module-card-guide.md)

---

## فاز ۱ — داکیومنت و هم‌خوانی

در این فاز هنوز کد نمی‌زنیم؛ اول باید همه بفهمند قرار است چه چیزی ساخته شود. هدف این است که سازندهٔ ماژول، ادمین و تیم CMS از یک داستان مشترک شروع کنند.

- [x] proposal با لحن داستان‌محور نوشته شد تا روشن کند چرا کارت باید مال خود سازندهٔ ماژول باشد.
- [x] design نقش CMS در برابر ماژول، داکر، و امنیت سرور اصلی را توضیح داد.
- [x] module-card-guide سه داستان ساده دارد و polling و WebSocket را به‌عنوان انتخاب سازنده توضیح می‌دهد.
- [ ] [card-live-customization](../card-live-customization/proposal.md) باید با این change هم‌خوان شود تا روشن باشد درگاه CMS برای static/backend این مسیر جایگزین نیست مگر در یک استثنای خیلی مشخص.
- [x] لینک در developer-guide اضافه شد تا سازندهٔ ماژول راهنمای کارت را پیدا کند.

---

## فاز ۲ — نمونه در کد

اینجا ایده را با نمونهٔ واقعی ثابت می‌کنیم. باید هم یک کارت سادهٔ استاتیک داشته باشیم، هم یک نمونهٔ IoT که نشان بدهد دادهٔ زنده می‌تواند از خود ماژول بیاید، نه از هستهٔ CMS.

- [ ] ZIP نمونهٔ استاتیک با `card.html` در fixtures بساز تا ساده‌ترین حالت کارت سفارشی قابل تست باشد.
- [ ] ZIP نمونهٔ IoT بساز؛ یک کارت با polling و یک کارت با WebSocket کار کند و هر دو زیر مسیر `/modules/<id>/` بمانند.
- [ ] `modulehub-card-store` وقتی `card.html` دید، آن را داخل iframe امن روی بوم نشان دهد.
- [ ] وقتی ماژول stopped است، CMS کارت پیش‌فرض را نشان دهد تا کاربر iframe خالی یا خطای عجیب نبیند.
- [ ] فیلد `cardView` در schema مربوط به `module.json` فقط بگوید کارت سفارشی وجود دارد؛ نوع ارتباط مثل polling یا WebSocket را قفل نکند.
- [ ] مسیر با [docker-module](../docker-module/proposal.md) هم‌راستا شود تا ماژول backend در کانتینر اجرا شود و بار اضافه روی هستهٔ CMS نیفتد.
- [ ] تست smoke روی بوم انجام شود: چند کارت کنار هم سالم بمانند، حتی اگر یک ماژول crash کند.

---

## فاز ۳ — skill و بستن

وقتی نمونهٔ کد جواب داد، باید همین تجربه تبدیل به راهنمای دائمی شود تا هر بار از اول توضیح ندهیم کارت ماژول چطور ساخته می‌شود.

- [ ] module-card-guide به `new-module-rolls/Card-view/SKILL.md` تبدیل شود تا AI و سازندهٔ ماژول یک مسیر ثابت داشته باشند.
- [ ] یک بخش کوتاه در module-hosting-guide اضافه شود تا کسانی که ماژول می‌سازند سریع بفهمند کارت سفارشی از کجا شروع می‌شود.
- [ ] بعد از فاز ۲، skill `sync-docs` اجرا شود تا داک با کد واقعی یکی بماند.

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
