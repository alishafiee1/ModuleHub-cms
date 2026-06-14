/**
 * folder-admin-help.js — static Super Admin guide for folder cards (gear menu)
 * purpose --- sectioned casual help text; not the card description field ---
 */
(function initFolderAdminHelp() {
  /** @type {Array<{ title: string, body: string }>} */
  const FOLDER_ADMIN_HELP_SECTIONS = [
    {
      title: 'اسم و توضیح',
      body: 'از «اسم و توضیح» می‌تونی نام پوشه و همون خط زیر عنوان کارت رو عوض کنی. مارک‌داون هم جوابه — مثلاً **پررنگ** یا لینک. روی خود کارت فقط دو خط نشون داده می‌شه؛ بقیهٔ متن توی فرم ویرایش می‌مونه.',
    },
    {
      title: 'جابجایی',
      body: 'با «جابجایی» کل پوشه رو می‌بری تو پوشهٔ دیگه. تو حالت ویرایش چیدمان هم می‌تونی از دستهٔ بالای کارت بکشیش روی پوشهٔ مقصد — هر دو روش یکیه.',
    },
    {
      title: 'حذف پوشه',
      body: 'حذف فقط وقتی معنی داره که بدونی داخلش چی هست. اگه پوشه پر باشه باید انتخاب کنی: محتوا بره والد، بره پوشهٔ دیگه، یا همه با هم پاک بشن. برای حذف کامل گاهی باید اسم پوشه رو دقیق تایپ کنی.',
    },
    {
      title: 'ورود به پوشه',
      body: 'برای رفتن تو پوشه روی خود کارت بزن — نه روی ⚙. ⚙ فقط برای مدیریت ادمینه؛ کلیک کارت برای همهٔ بازدیدکننده‌هاست.',
    },
    {
      title: 'ویرایش چیدمان',
      body: 'از نوار بالا «ویرایش چیدمان» رو روشن کن تا کارت‌ها رو جابه‌جا یا اندازه‌شون رو عوض کنی. وقتی تموم شد حتماً ذخیره کن — بدون ذخیره برمی‌گرده حالت قبل.',
    },
  ];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * buildFolderAdminHelpHtml --- sections for SweetAlert body ---
   */
  function buildFolderAdminHelpHtml() {
    return FOLDER_ADMIN_HELP_SECTIONS.map((section) => `
      <section class="folder-help-section">
        <h3 class="folder-help-section__title">${escapeHtml(section.title)}</h3>
        <p class="folder-help-section__body">${escapeHtml(section.body)}</p>
      </section>
    `).join('');
  }

  window.FolderAdminHelp = {
    sections: FOLDER_ADMIN_HELP_SECTIONS,
    buildFolderAdminHelpHtml,
  };
})();
