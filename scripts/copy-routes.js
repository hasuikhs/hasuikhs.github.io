// GitHub Pages serves only static files, so a direct hit on a client route
// (e.g. /yeoun) would 404. Copy the SPA shell into each route directory so it
// is served with 200, and as 404.html for any unknown path. Each copy carries
// that page's own title and link-preview tags (see page-meta.js); a legal
// document's copy also holds the document itself (see legal-docs.js), so it
// reads without JavaScript.
const fs = require('fs');
const path = require('path');

const { staticMarkup } = require('./legal-docs');
const { PAGES, renderPage } = require('./page-meta');

function writeRoutes(buildDir) {
  // Read once: build/index.html is itself rewritten below, as the hub page.
  const shell = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
  for (const page of Object.values(PAGES)) {
    const file = path.join(buildDir, page.file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderPage(shell, page, undefined, page.path ? staticMarkup(page.path) : ''));
  }
}

if (require.main === module) {
  writeRoutes(path.join(__dirname, '..', 'build'));
}

module.exports = { writeRoutes };
