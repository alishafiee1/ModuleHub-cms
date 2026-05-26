const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../core/src/admin/dashboard.html');
const dest = path.join(__dirname, '../dist/core/src/admin/dashboard.html');

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}
