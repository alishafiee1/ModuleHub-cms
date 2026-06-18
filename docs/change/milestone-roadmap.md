<div dir="rtl" style="text-align:right;">

# مایل‌استون و نقشهٔ راه ModuleHub

> این فایل از روی وضعیت فعلی `docs/change/`، کارهای انجام‌شده، کارهای نیمه‌کاره، و کدی که الان واقعاً در پروژه هست نوشته شده.  
> هدفش این است که از اینجا به بعد بدانیم «اول چه چیزی را محکم کنیم، بعد چه چیزی بسازیم، و چه ماژول‌هایی را برای تست و نمایش آماده کنیم».

---

## داستان کوتاه: الان کجای راهیم؟

فرض کن ModuleHub یک ساختمان است. اسکلت ساختمان ساخته شده: صفحهٔ اصلی کارت‌ها دارد، ادمین می‌تواند ZIP آپلود کند، ماژول Static و SPA را نشان می‌دهد، Docker را تا حدی اجرا می‌کند، backup و تنظیمات و login اصلی هم داریم. حتی اخیراً مسیر upload تمیزتر شد: ZIP تک‌پوشه‌ای بهتر باز می‌شود، `dist` شناخته می‌شود، Docker بدون پروسه ذخیره نمی‌شود، و پوشهٔ یتیم بعد از cancel پاک می‌شود.

اما هنوز چند اتاق مهم ساختمان «قرارداد رسمی» ندارند. مهم‌ترینش این است: ماژول‌ها هنوز یک شناسنامهٔ واحد ندارند. بعضی چیزها از wizard می‌آید، بعضی از فایل‌های وابستگی مثل `package.json`، بعضی از حدس سیستم، و بعضی هنوز فقط در داک‌ها نوشته شده‌اند.

رویکرد جدید باید این باشد:

**هر ماژول یک فایل `module.json` دارد که شناسنامهٔ کامل ماژول است. اگر ماژول بک‌اند دارد، داخل Docker اجرا می‌شود. CMS از روی همین شناسنامه می‌فهمد ماژول چیست، چطور نصب می‌شود، چطور اجرا می‌شود، چه پورتی دارد، چه کارت یا UIای دارد، و چطور باید تست شود.**

---

## اصل‌های تصمیم‌گیری از اینجا به بعد

### اصل ۱ — `module.json` منبع حقیقت ماژول است

تا امروز `site-layout.json` منبع حقیقت چیدمان و وضعیت نصب بوده. این همچنان برای کارت‌ها و وضعیت CMS مهم است، اما برای خود بستهٔ ماژول کافی نیست.

از این به بعد هر ZIP معتبر باید در ریشهٔ خودش `module.json` داشته باشد. این فایل باید مشخص کند:

- ماژول چه نام و نسخه‌ای دارد.
- نوعش چیست: static، spa، backend، worker یا hybrid.
- اگر بک‌اند دارد، Docker image چطور ساخته و اجرا می‌شود.
- پورت داخلی، health check، منابع، envهای لازم و card view چیست.
- آیا این ماژول یک template آماده است یا یک ماژول قابل نصب عادی.

### اصل ۲ — بک‌اند بدون Docker نداشته باشیم

الان کد می‌تواند Node و Python را مستقیم با process اجرا کند. این برای dev و انتقال قدیمی قابل تحمل است، ولی برای مسیر آینده خوب نیست. بک‌اند یعنی چیزی که پروسه دارد، پورت دارد، memory می‌خورد، ممکن است crash کند و ممکن است وابستگی عجیب داشته باشد. این‌ها باید داخل Docker باشند تا مرز ماژول و CMS قاطی نشود.

پس سیاست جدید:

- Static و SPA بدون Docker می‌توانند مستقیم از CMS سرو شوند.
- هر چیزی که server، API، worker، WebSocket، SSE یا پردازش پس‌زمینه دارد باید Docker باشد.
- مسیر non-Docker backend فقط تا وقتی نگه داشته می‌شود که ماژول‌های قدیمی migrate شوند یا dev/test ساده نیاز داشته باشد.

### اصل ۳ — قبل از marketplace، چند ماژول واقعی بسازیم

قبل از اینکه «کتابخانهٔ ماژول آماده» بسازیم، باید چند ماژول واقعی و کوچک داشته باشیم. این‌ها هم ابزار تست هستند، هم نمونه برای سازنده‌ها، هم معیار اینکه manifest واقعاً قابل استفاده است.

---

## وضعیت فعلی از نگاه milestone

### انجام‌شده و قابل اتکا

- هستهٔ کارت‌ها، پوشه‌ها و چیدمان per-device آماده است.
- upload ZIP، package cache، start/stop، log، backup و settings آماده‌اند.
- `module-upload-hardening` انجام شده و مسیر upload قابل اعتمادتر شده.
- Super Admin و Module Manager پایه آماده‌اند.
- Docker runner وجود دارد، ولی هنوز فقط `Dockerfile` را می‌شناسد و manifest محور نیست.

### نیمه‌کاره یا نیازمند تصمیم جدید

- `add manifest` طراحی دارد، اما در کد مسیر نصب و validation اصلی نشده.
- `docker-module` پروپزال دارد، اما استاندارد نهایی Docker و manifest هنوز کدی نشده.
- `card-view` و `card-live-customization` هر دو باز هستند و باید با رویکرد manifest یکی شوند.
- `admin-access-roles` باز است و هنوز نقش‌ها و مدیریت کاربر کامل نشده.
- ماژول‌های template آماده و ماژول‌های تست متنوع وجود ندارند.
- docs قدیمی هنوز جاهایی می‌گویند بک‌اند Node/Python مستقیم اجرا می‌شود؛ این باید با سیاست Docker-only هماهنگ شود.

---

## نقشهٔ راه پیشنهادی

## مایل‌استون ۱ — قرارداد رسمی ماژول

**هدف:** قبل از ساختن قابلیت‌های جدید، یک زبان مشترک برای همهٔ ماژول‌ها بسازیم.

در این milestone، `module.json` نسخه ۱ را نهایی می‌کنیم. فایل باید کوتاه بماند، اما برای تصمیم‌های حیاتی کافی باشد: نوع ماژول، Docker، پورت، health check، card view، env، منابع و نسخه.

کارهای اصلی:

- `docs/change/add manifest/` را با رویکرد جدید بازنویسی و کامل کنیم.
- اسم استاندارد را یکدست کنیم: `module.json`، نه `manifest.json`.
- schema و validator برای `module.json` بسازیم.
- upload wizard را از حالت سؤال‌محور خام به حالت «خواندن manifest + تکمیل چیزهای کم» ببریم.
- اگر manifest نیست، فقط برای legacy یا dev اجازه دهیم؛ نصب رسمی باید manifest داشته باشد.

**تموم شدن milestone:** یک ZIP با `module.json` معتبر آپلود می‌شود، CMS قبل از ثبت آن را validate می‌کند، و `site-layout.json` فقط خروجی ثبت‌شده و وضعیت CMS را نگه می‌دارد.

---

## مایل‌استون ۲ — Docker برای همهٔ بک‌اندها

**هدف:** هر ماژولی که پروسه دارد از CMS جدا شود و داخل Docker اجرا شود.

الان Docker runner هست، اما رفتار آن هنوز ساده است: Dockerfile را build می‌کند و پورت را map می‌کند. milestone دوم باید این مسیر را رسمی کند.

کارهای اصلی:

- `docker-module` را با `module.json` یکی کنیم؛ Docker دیگر یک گزینهٔ پراکنده در wizard نباشد.
- برای `type: backend`, `worker`, `hybrid` وجود Docker اجباری شود.
- `docker.compose` یا `dockerfile` را در manifest تعریف کنیم؛ فاز اول می‌تواند فقط Dockerfile باشد، اما تصمیم باید در manifest ثبت شود.
- health check Docker از manifest خوانده شود.
- سیاست volume و data directory روشن شود؛ مخصوصاً برای SQLite، uploads و فایل‌های کاربر.
- مسیر non-Docker backend در docs به «legacy/dev» منتقل شود.

**تموم شدن milestone:** Node API، Python API و WebSocket demo همگی داخل Docker اجرا شوند و CMS فقط proxy، start/stop، status و log را مدیریت کند.

---

## مایل‌استون ۳ — کیت تمپلیت ماژول‌ها

**هدف:** سازندهٔ ماژول از صفر شروع نکند. چند قالب آماده داشته باشد که فقط کپی کند و تغییر دهد.

این milestone باید چند template رسمی بسازد. template یعنی پروژهٔ آماده با `module.json`، ساختار درست ZIP، README کوتاه، و اگر لازم است Dockerfile.

تمپلیت‌های پیشنهادی:

- **Static Landing Template:** فقط `index.html` و assets؛ برای سایت معرفی، نمونه‌کار، صفحهٔ ساده.
- **SPA Dashboard Template:** خروجی `dist`، مناسب React/Vue/Vite؛ بدون بک‌اند.
- **Docker Node API Template:** Express ساده با `/health` و یک endpoint نمونه.
- **Docker Python API Template:** Flask یا FastAPI ساده با `/health`.
- **Docker Worker Template:** کاری که صفحه ندارد ولی پس‌زمینه پردازش می‌کند؛ مثل sync یا cron سبک.
- **WebSocket Live Template:** یک سرویس کوچک که داده زنده می‌دهد و برای card-live آینده مفید است.
- **Hybrid Template:** یک SPA ساده + بک‌اند Docker؛ برای ماژول‌هایی که هم UI دارند هم API.

**تموم شدن milestone:** هر template به‌تنهایی ZIP می‌شود، در CMS نصب می‌شود، و سازنده می‌تواند از روی آن ماژول واقعی بسازد.

---

## مایل‌استون ۴ — باغچهٔ ماژول‌های تست

**هدف:** قبل از اینکه کاربر واقعی ماژول بسازد، خودمان چند ماژول کوچک بسازیم که هر نوع رفتار مهم را تست کند.

این‌ها با template فرق دارند. template برای کپی کردن است؛ test module برای شکستن و تست کردن CMS است.

ماژول‌های تست پیشنهادی:

- **hello-static:** یک HTML ساده با asset نسبی؛ تست پایه Static.
- **hello-spa-dist:** فقط `dist/index.html`؛ تست تشخیص `dist`.
- **bad-zip-shapes:** چند ZIP با شکل‌های مختلف؛ تست flatten و خطاهای upload.
- **docker-node-health:** API کوچک Node داخل Docker؛ تست start، proxy، health و log.
- **docker-python-health:** API کوچک Python داخل Docker؛ تست Python در مسیر جدید Docker-only.
- **docker-websocket-counter:** شمارنده زنده با WebSocket؛ تست proxy و card-live آینده.
- **docker-worker-log:** worker بدون UI که فقط لاگ تولید می‌کند؛ تست worker و status.
- **storage-demo:** ماژولی که داخل data/uploads فایل می‌سازد؛ تست سیاست volume و backup.
- **crash-demo:** ماژولی که عمدی crash می‌کند؛ تست status crashed و log.

**تموم شدن milestone:** این ماژول‌ها در `tests/fixtures/modules/` یا مسیر جداگانهٔ نمونه‌ها قرار می‌گیرند و حداقل smoke نصب و start/stop دارند.

---

## مایل‌استون ۵ — کارت ماژول و live card

**هدف:** صفحهٔ اصلی فقط عنوان و آیکون نباشد؛ هر ماژول بتواند یک کارت قشنگ و گاهی زنده داشته باشد.

اینجا باید `card-view` و `card-live-customization` را با هم آشتی بدهیم. الان یکی می‌گوید سازنده کارت خودش را بدهد، یکی از درگاه live CMS حرف می‌زند. رویکرد جدید بهتر است این باشد:

- manifest مشخص کند کارت ماژول چیست: default، static card، یا live card.
- کارت Static می‌تواند داخل خود ZIP باشد و بدون بک‌اند کار کند.
- کارت Live اگر به داده زنده نیاز دارد، باید از بک‌اند Docker همان ماژول بیاید.
- CMS فقط نمایش امن، sandbox، timeout و fallback را مدیریت کند.

**تموم شدن milestone:** حداقل یک template کارت Static و یک template کارت Live داریم، و اگر ماژول stopped شد کارت fallback نشان داده می‌شود.

---

## مایل‌استون ۶ — کتابخانهٔ ماژول آماده

**هدف:** ادمین فقط ZIP دستی آپلود نکند؛ بتواند از چند ماژول آماده انتخاب کند.

این مرحله را نباید قبل از manifest و template شروع کنیم. کتابخانهٔ ماژول بدون manifest مثل قفسه‌ای است که روی جعبه‌ها برچسب ندارد.

کارهای اصلی:

- catalog ساده بسازیم؛ اول local، بعد شاید GitHub یا registry.
- هر آیتم catalog یک `module.json`، preview، نسخه و compatibility داشته باشد.
- نصب از catalog همان مسیر upload/wizard را طی کند، فقط فایل از منبع آماده می‌آید.
- چند ماژول آمادهٔ اولیه پیشنهاد شود: landing، gallery، blog، dashboard، contact form، IoT live card، simple CRUD.

**تموم شدن milestone:** Super Admin در صفحهٔ Add module بین «آپلود ZIP» و «انتخاب از کتابخانه» یکی را انتخاب می‌کند.

---

## مایل‌استون ۷ — نقش‌ها و مدیریت ادمین‌ها

**هدف:** وقتی ماژول‌ها جدی‌تر و قابل انتشار شدند، دسترسی‌ها هم باید جدی‌تر شوند.

`admin-access-roles` باز است و باید بعد از manifest و module library کامل شود. چون وقتی template و catalog داریم، افراد بیشتری درگیر نصب، تست و مدیریت ماژول می‌شوند.

کارهای اصلی:

- ورود با ایمیل.
- نقش‌های Super Admin، Module Manager، Viewer یا Operator.
- مدیریت کاربران.
- بازیابی رمز با ایمیل.
- محدود کردن نصب، حذف، backup، start/stop و log بر اساس نقش.

**تموم شدن milestone:** یک نفر بتواند فقط یک ماژول یا یک دسته ماژول را مدیریت کند، بدون اینکه به کل CMS دسترسی داشته باشد.

---

## مایل‌استون ۸ — integration و آماده‌سازی انتشار

**هدف:** همهٔ قطعه‌ها کنار هم مثل محصول واقعی تست شوند.

اینجا دیگر فقط unit test کافی نیست. باید مسیر واقعی را تست کنیم: انتخاب template، نصب از catalog، validate manifest، Docker build/run، card view، backup، restore، role access و log.

کارهای اصلی:

- smoke کامل برای نصب چند نوع ماژول.
- E2E مسیر Super Admin از login تا نصب و start.
- backup/restore با ماژول Docker و data.
- تست load سبک: چند کارت live و چند ماژول running.
- راهنمای release برای سازندهٔ ماژول.

**تموم شدن milestone:** یک نسخهٔ قابل معرفی داریم که با چند ماژول نمونه نشان می‌دهد ModuleHub فقط ایده نیست؛ واقعاً یک CMS ماژولار قابل توسعه است.

---

## ترتیب پیشنهادی اجرا

۱. اول `module.json` را رسمی کن. بدون شناسنامه، بقیهٔ کارها دوباره حدسی می‌شوند.

۲. بعد Docker-only برای بک‌اندها را قفل کن. هر چیزی که پروسه دارد باید از CMS جدا شود.

۳. بعد templateها را بساز. templateها همان الگوی طلایی برای سازنده‌ها و تست‌ها هستند.

۴. بعد test moduleها را اضافه کن. این‌ها باعث می‌شوند هر بار تغییر می‌زنیم، بفهمیم کدام نوع ماژول شکسته.

۵. بعد card-view و card-live را روی manifest سوار کن. کارت بدون manifest دوباره تبدیل به چند قرارداد پراکنده می‌شود.

۶. بعد catalog یا کتابخانهٔ ماژول آماده را بساز. catalog بدون template و manifest زودرس است.

۷. بعد نقش‌ها و integration نهایی را کامل کن.

---

## تصمیم‌های مهمی که همین حالا باید ثبت شوند

- بک‌اند مستقیم با `systemd-run` از مسیر محصول آینده خارج شود و فقط legacy/dev بماند.
- `module.json` برای نصب رسمی اجباری شود.
- Dockerfile فاز اول باشد؛ docker-compose اگر لازم شد فاز بعدی.
- هر template باید با یک test module متناظر همراه باشد.
- هیچ ماژول آماده‌ای وارد catalog نشود مگر health check، manifest و تست نصب داشته باشد.
- card-live فقط برای ماژولی مجاز باشد که backend Docker و health check دارد.

---

## پیشنهاد ماژول‌های آماده برای شروع catalog

### ۱. گالری ساده

یک ماژول Static برای عکس‌ها و توضیح کوتاه. مناسب تست upload، asset نسبی، card default و backup.

### ۲. وبلاگ کوچک

یک SPA ساده با چند پست نمونه. مناسب تست `dist`، routing داخلی و base path.

### ۳. فرم تماس Docker

یک Node یا Python backend داخل Docker با فرم ساده و health check. مناسب تست Docker، env و log.

### ۴. داشبورد IoT نمایشی

یک Docker WebSocket یا polling demo که چند عدد زنده نشان می‌دهد. مناسب card-live و تست فشار سبک.

### ۵. ابزار تبدیل فایل

یک backend Docker که فایل می‌گیرد و خروجی ساده می‌دهد. مناسب تست uploads، volume، منابع و محدودیت RAM.

### ۶. ماژول CRUD خیلی کوچک

یک ماژول hybrid با UI و API؛ برای تست کامل‌تر مسیر module → backend → storage → backup.

---

## خروجی مطلوب این نقشهٔ راه

در پایان این مسیر، ModuleHub باید به جایی برسد که اگر یک نفر بگوید «من یک ماژول جدید دارم»، جواب ما این نباشد که «بیا ببینیم چطور ساخته شده». جواب باید این باشد:

«فایل `module.json` را بگذار، اگر بک‌اند داری Dockerfile بده، یکی از templateها را الگو بگیر، ZIP را آپلود کن یا از catalog منتشرش کن. CMS بقیهٔ مسیر نصب، اجرا، کارت، log، backup و health را با قرارداد مشخص مدیریت می‌کند.»

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
