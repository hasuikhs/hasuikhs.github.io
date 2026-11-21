// Link previews and search snippets: messengers (KakaoTalk, Slack, X, Facebook) and crawlers read the
// HTML as served and run no JavaScript, so each route's file carries its own title, description,
// canonical URL and Open Graph / Twitter tags. Written after `react-scripts build` by copy-routes.js;
// the strings come from src/data/pageMeta.json, which the pages also use for document.title.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PAGES = require('../src/data/pageMeta.json');
const { homepage } = require('../package.json');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// The generated block sits between these markers, so running postbuild again replaces it.
const START = '<!--page-meta-->';
const END = '<!--/page-meta-->';

const TITLE = /<title>[^<]*<\/title>/g;
const DESCRIPTION = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/g;
const BLOCK = /<!--page-meta-->[\s\S]*?<!--\/page-meta-->/g;

const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// `path` is site-absolute ('/yeoun/'); previews need the full https URL.
const absoluteUrl = (sitePath, origin = homepage) => new URL(sitePath, `${origin.replace(/\/+$/, '')}/`).href;

// Facebook and KakaoTalk cache a preview image by its URL (Kakao keeps the thumbnail even after a cache
// reset), so the URL carries a hash of the file: a re-rendered card is fetched again under its new URL.
const imageVersion = (imagePath) =>
  crypto.createHash('sha1').update(fs.readFileSync(path.join(PUBLIC_DIR, imagePath))).digest('hex').slice(0, 8);

const tag = (name, attrs) =>
  `<${name} ${Object.entries(attrs).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(' ')}>`;

// The tags for one page, in the order they are written.
function metaTags(page, origin = homepage) {
  const tags = [];
  if (page.noindex) {
    tags.push(tag('meta', { name: 'robots', content: 'noindex' }));
  }
  if (!page.path) {
    return tags;
  }
  const url = absoluteUrl(page.path, origin);
  tags.push(
    tag('link', { rel: 'canonical', href: url }),
    tag('meta', { property: 'og:type', content: 'website' }),
    tag('meta', { property: 'og:locale', content: 'ko_KR' }),
    tag('meta', { property: 'og:url', content: url }),
    tag('meta', { property: 'og:title', content: page.title }),
    tag('meta', { property: 'og:description', content: page.description }),
  );
  if (page.image) {
    const { image } = page;
    const ext = image.path.split('.').pop().toLowerCase();
    if (!IMAGE_TYPES[ext]) {
      throw new Error(`page-meta: unknown image type for ${image.path}`);
    }
    tags.push(
      tag('meta', { property: 'og:image', content: `${absoluteUrl(image.path, origin)}?v=${imageVersion(image.path)}` }),
      tag('meta', { property: 'og:image:type', content: IMAGE_TYPES[ext] }),
      tag('meta', { property: 'og:image:width', content: image.width }),
      tag('meta', { property: 'og:image:height', content: image.height }),
      tag('meta', { property: 'og:image:alt', content: image.alt }),
    );
  }
  tags.push(tag('meta', { name: 'twitter:card', content: page.twitterCard || 'summary' }));
  if (page.image) {
    tags.push(tag('meta', { name: 'twitter:image:alt', content: page.image.alt }));
  }
  return tags;
}

const countOf = (html, pattern) => (html.match(pattern) || []).length;

// The SPA shell with one page's title, description and tags. Throws when the shell does not hold exactly
// one <title> and one description, so a changed index.html fails the build instead of shipping no preview.
function renderPage(shell, page, origin = homepage) {
  const html = shell.replace(BLOCK, '');
  if (countOf(html, TITLE) !== 1 || countOf(html, DESCRIPTION) !== 1) {
    throw new Error('page-meta: the shell needs exactly one <title> and one <meta name="description">');
  }
  const description = tag('meta', { name: 'description', content: page.description });
  const block = `${START}${metaTags(page, origin).join('')}${END}`;
  return html
    .replace(TITLE, () => `<title>${escapeHtml(page.title)}</title>`)
    .replace(DESCRIPTION, () => `${description}${block}`);
}

module.exports = { PAGES, absoluteUrl, imageVersion, metaTags, renderPage };
