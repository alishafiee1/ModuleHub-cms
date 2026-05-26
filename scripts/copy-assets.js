const fs = require('fs');
const path = require('path');

const assets = [
  ['core/src/admin/dashboard.html', 'dist/core/src/admin/dashboard.html'],
  ['core/src/public/homepage.css', 'dist/core/src/public/homepage.css'],
];

for (const [srcRel, destRel] of assets) {
  const src = path.join(__dirname, '..', srcRel);
  const dest = path.join(__dirname, '..', destRel);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}
