/**
 * module-admin-help.js — static guide for module cards (gear floating menu)
 * purpose --- sectioned casual help text; not the card description field ---
 */
(function initModuleAdminHelp() {
  /** @type {Array<{ title: string, body: string }>} */
  const MODULE_ADMIN_HELP_SECTIONS = [
    {
      title: 'ورود به ماژول',
      body: 'برای باز کردن ماژول روی خود کارت بزن — نه روی ⚙. ⚙ فقط برای مدیریت ادمینه.',
    },
    {
      title: 'مدیریت ماژول',
      body: 'از آیکون «مدیریت» می‌تونی ماژول رو Start/Stop کنی، لاگ ببینی، تنظیمات و پشتیبان بگیری. نام و توضیح کارت هم از همون دیالوگ «ویرایش تنظیمات» عوض می‌شه.',
    },
    {
      title: 'اسم و توضیح کارت',
      body: 'توضیح زیر عنوان از «ویرایش تنظیمات» در دیالوگ مدیریت — مارک‌داون هم جوابه: **پررنگ**، لینک، لیست و ... روی کارت فقط بخشی از متن دیده می‌شه.',
    },
    {
      title: 'جابجایی',
      body: 'با «جابجایی» کارت ماژول رو می‌بری تو پوشهٔ دیگه. تو حالت ویرایش چیدمان هم می‌تونی از دستهٔ بالای کارت بکشیش روی پوشهٔ مقصد.',
    },
    {
      title: 'ویرایش چیدمان و پس‌زمینه',
      body: 'از منوی ⚙ «ویرایش چیدمان» یا نوار بالا روشن کن تا جابه‌جا و اندازه عوض کنی. «پالت» پس‌زمینهٔ اختصاصی همون کارت رو تنظیم می‌کنه.',
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
   * buildModuleAdminHelpHtml --- sections for SweetAlert body ---
   */
  function buildModuleAdminHelpHtml() {
    return MODULE_ADMIN_HELP_SECTIONS.map((section) => `
      <section class="folder-help-section">
        <h3 class="folder-help-section__title">${escapeHtml(section.title)}</h3>
        <p class="folder-help-section__body">${escapeHtml(section.body)}</p>
      </section>
    `).join('');
  }

  window.ModuleAdminHelp = {
    sections: MODULE_ADMIN_HELP_SECTIONS,
    buildModuleAdminHelpHtml,
  };
})();
