// GitHub Pages serves only static files, so a direct hit on a client route
// (e.g. /yeoun) would 404. Copy the SPA shell into each route directory so it
// is served with 200, and as 404.html for any unknown path.
const fs = require('fs');
const path = require('path');

const ROUTES = [ 'yeoun' ];

const buildDir = path.join(__dirname, '..', 'build');
const shell = path.join(buildDir, 'index.html');

for (const route of ROUTES) {
  const dir = path.join(buildDir, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(shell, path.join(dir, 'index.html'));
}

fs.copyFileSync(shell, path.join(buildDir, '404.html'));
