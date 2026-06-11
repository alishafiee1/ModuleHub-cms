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

درود بر شما! قوانین کاربر (دستورالعمل‌ها و اصول رفتاری دستیار هوش مصنوعی شما) را به زبان فارسی و با حفظ اصطلاحات فنی به انگلیسی برایتان ترجمه و قالب‌بندی کرده‌ام:

---

# قوانین کاربر برای دستیار هوش مصنوعی (User Rules for AI Assistant)

### ۱. برنامه‌ریزی و گردش کار بومی (Native Planning & Workflow)
* **حالت برنامه‌ریزی (Planning Mode):** برای کارهای غیرتکراری و پیچیده، از قابلیت بومی `Planning Mode` استفاده کنید. قبل از شروع کدنویسی، فایل `implementation_plan.md` را برای مشخص کردن معماری، رویکردها و ریسک‌ها ایجاد و پر کنید.
* **زبان مستندات (Language of Artifacts):** محتوای اسناد برنامه‌ریزی خود (`implementation_plan.md`، `task.md`، `walkthrough.md`) را به زبان فارسی بنویسید، اما تمام کلیدواژه‌های فنی، نام متغیرها و اصطلاحات ساختاری را به زبان انگلیسی نگه دارید.
* **تغییرات ساختاری و مخرب (Breaking Changes):** تغییرات بنیادین و مخرب احتمالی را همیشه در طرح پیاده‌سازی خود برجسته کنید و پیش از ادامه کار منتظر تأیید صریح کاربر بمانید.
* **همسان‌سازی مستندات (Document Mirroring):** همیشه یک نسخه یا کپی از پروپوزال یا `implementation_plan.md` را در پوشه مستندات پروژه (مانند `docs/` یا پوشه مستندات ویژگی خاص زیرِ مسیر `openspec/changes/`) کپی/قرینه‌سازی کنید تا در مخزن پروژه به صورت ماندگار و در دسترس باقی بماند.

### ۲. معماری و ماژولار بودن کد (Architecture & Code Modularity)
* **معماری مبتنی بر ویژگی (Feature-Based):** معماری اپلیکیشن باید همیشه مبتنی بر ویژگی (Feature-based) باشد و نه مبتنی بر لایه (Layer-based). فایل‌های جدید را بر اساس دامنه/ویژگی (Domain/Feature) سازماندهی کنید.
* **ماژولار بودن فایل‌ها و محدودیت اندازه (File Modularity & Size Limit):** فایل‌ها را متمرکز و ماژولار نگه دارید و از اصل تک‌مسئولیتی (Single Responsibility Principle) پیروی کنید. به عنوان یک قاعده کلی، از فایل‌های با حجم بیش از **۳۰۰ تا ۴۰۰ خط** کد خودداری کنید. اگر فایلی مسئولیت‌های نامرتبط متعددی را بر عهده دارد، آن را تقسیم کنید. همچنین از تکه‌تکه کردن بیش از حد پایگاه کد به فایل‌های بسیار کوچک (زیر ۵۰ خط) مگر در موارد ضروری خودداری کنید.
* **اصل DRY (عدم تکرار کد):** از تکرار کد خودداری کنید. منطق‌های مشترک را بلافاصله به توابع یا ماژول‌های قابل استفاده مجدد انتقال دهید.
* **قابلیت حمل و استقلال از محیط (Portability & Environment-Independence):** مطمئن شوید تمام کدهای نوشته شده بسیار پرتابل (قابل حمل)، ماژولار و کاملاً کپسوله‌سازی شده باشند. از هاردکد کردن تنظیمات خاص محیطی (مانند مسیرها، نام‌های کاربری، آدرس‌های IP و پورت‌ها) خودداری کنید. تمام متغیرهای خاص محیط باید به صورت پویا از طریق متغیرهای محیطی (Environment Variables)، فایل‌های پیکربندی (مانند JSON/YAML) یا پارامترهای ورودی کلاس‌ها/توابع پیکربندی شوند تا امکان استقرار در سرورها، مسیرها و پیکربندی‌های مختلف کاربران فراهم باشد.

### ۳. استانداردهای کدنویسی و مستندسازی (Coding Standards & Documentation)
* **نام‌گذاری توصیفی (Descriptive Naming):** از نام‌های واضح و توصیفی برای متغیرها و متدها استفاده کنید. هرگز از اختصار استفاده نکنید (مثلاً از `maximumConnectionTimeout` استفاده کنید، نه از `maxConnTO`).
* **تایپ‌ها و داک‌استرینگ‌ها (Types & Docstrings):** همیشه برای پارامترها و مقادیر بازگشتی از Type Hinting استفاده کنید. همچنین برای هر تابع یک docstring بنویسید که هدف آن را توضیح دهد.
* **کامنت‌های انگلیسی (English Comments):** کامنت‌های درون کد باید همیشه به زبان انگلیسی باشند. تمرکز کامنت‌ها باید روی توضیح دادن «چرا» (Why) باشد و نه «چگونه» (How) (به عنوان مثال: `// purpose --- detailed description ------`).
* **به‌روزرسانی README:** پس از انتشار ویژگی‌های بزرگ یا تغییرات معماری مهم، در صورت نیاز فایل `README.md` پروژه را مطابق با استانداردهای گیت‌هاب بررسی و به‌روزرسانی کنید.

### ۴. استراتژی تست (Testing Strategy)
* **تست‌های کاربردی (Pragmatic Testing):** برای منطق‌های حیاتی، ماژول‌های حساس، یا یکپارچه‌سازی‌های پیچیده، نوشتن یا پیشنهاد تست‌های واحد (Unit Tests) را در کنار پیاده‌سازی در اولویت قرار دهید.
* **ثبت لاگ (Logging):** در کدهای خود قابلیت لاگینگ (Logging) قرار دهید که به طور پیش‌فرض غیرفعال باشد اما برای اهداف عیب‌یابی به راحتی فعال شود.

### ۵. محتوای آموزشی و قوانین ناشناس‌سازی (Educational Content & Anonymization Rules)
* **ایجاد فایل آموزشی:** هنگامی که کاربر سوالات عمومی درباره مفاهیم برنامه‌نویسی، معماری‌ها یا مباحث یادگیری می‌پرسد، فقط در چت پاسخ ندهید. در عوض، یک سند مارک‌داون (markdown) بسیار زیبا و با جزئیات کامل در پوشه‌های دسته‌بندی شده استاندارد زیر ایجاد کنید:
  `D:\2 Curent project git\Ai_projects\AI learning docs`
* **دسته‌بندی موضوعی:** تمام فایل‌های آموزشی را در پوشه‌های سازمان‌دهی شده بر اساس موضوع گروه‌بندی کنید (مانند `01-Network-and-Security`، `02-Linux-and-Server`، `03-AI-and-Workflow` و غیره).
* **به‌روزرسانی فهرست راهنما (README Index):** همیشه بلافاصله پس از افزودن، تغییر نام یا ویرایش فایل‌ها، فایل `README.md` مرکزی (جدول محتوا / فهرست) را در پوشه اسناد آموزشی به‌روزرسانی کنید. دستیارهای هوش مصنوعی باید در شروع هر جلسه ابتدا این فایل `README.md` را بخوانند تا محتوای موجود را نقشه‌برداری کرده و در زمان و توکن‌های متن صرفه‌جویی شود.
* **مفاهیم کوتاه همراه با لینک:** در راهنماهای آموزشی، تعاریف/مفاهیم پایه را خلاصه نگه دارید و لینک‌های مستقیم و قابل کلیک به فایل‌های مستقل و دقیق‌تری که آن مفهوم را توضیح می‌دهند ارائه دهید.
* **ایجاد پیش‌دستانه فایل‌های دقیق:** اگر یک مفهوم ارجاع داده شده هنوز فایل مستقل و دقیق خود را ندارد، باید ابتدا خودتان به طور فعال آن فایل را بر اساس قالب استعاره‌ای عامیانه بسازید و سپس به آن لینک دهید.
* **شروع با استعاره عامیانه:** همیشه اسناد آموزشی را با یک استعاره یا تشبیه حسی و عامیانه بسیار ساده (مانند تشبیه پروکسی به نگهبان ساختمان، Nginx به مدیر پاساژ یا آشپز، سرپرست ساختمان و غیره) شروع کنید تا مفاهیم پیچیده ساده‌سازی شوند.
* **ناشناس‌سازی و عمومی‌سازی:** تمام اسناد آموزشی باید تم عمومی و مناسب برای انتشار داشته باشند تا هر خواننده‌ای خارج از این پروژه بتواند آن‌ها را درک کند. هرگز اطلاعات شخصی کاربر، آی‌پی‌های عمومی واقعی یا نام‌های دامنه شخصی او را وارد نکنید. از مقادیر پیش‌فرض استاندارد استفاده کنید (مانند `example.com`، `my-decoy-site.com`، `192.168.1.100`، `203.0.113.1`).
* **واژگان خنثی:** در داخل فایل‌های آموزشی از واژه‌های حساس قانونی یا تحت نظارت مانند "Starlink" استفاده نکنید. به جای آن از عبارات خنثی مانند «اینترنت بین‌الملل آزاد» یا «دروازه شبکه دوم بدون فیلتر» استفاده کنید.
* **توضیح اصطلاحات فنی:** هر زمان که در چت از اصطلاحات فنی پیشرفته یا متوسط استفاده می‌کنید، آن‌ها را به طور خلاصه توضیح دهید.

### ۶. قوانین نمایش راست‌چین و فارسی (RTL & Persian Display Rules) - بسیار حیاتی
* **تگ چت (Chat Wrapper):** هنگام پاسخ دادن به زبان فارسی در چت، همیشه کل متن خود را در تگ `<div dir="rtl" style="text-align:right;"> ... </div>` قرار دهید تا مطمئن شوید کلمات فنی انگلیسی در کنار متن فارسی به درستی و بدون به‌هم‌ریختگی نمایش داده می‌شوند.
* **کد استایل مارک‌داون (Markdown CSS):** برای هر فایل مارک‌داون فارسی (`.md`) که ایجاد می‌کنید، بلوک CSS زیر را در بالاترین بخش فایل تزریق کنید تا رندر راست‌چین (RTL) آن اصلاح شود:

```html
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
```

### ۷. یادآور کامیت (Commit Reminder)
* پس از تکمیل یک تغییر بزرگ یا اتمام کارها در فایل `task.md`، به کاربر یادآوری کنید که کدهای خود را قبل از رفتن به سراغ ویژگی بعدی، کامیت (Commit) کند.

---

### خلاصه اقدامات انجام شده:
* فایل قوانین شما (`rules.md`) از پوشه مربوط به دانش ذخیره‌شده (Knowledge base) با ابزار خوانده شد.
* محتوای آن به طور دقیق به همراه ساختار زیبای مارک‌داون و تگ راست‌چین جهت سهولت خوانش شما به فارسی ترجمه شد.

