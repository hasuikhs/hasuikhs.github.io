// The Yeoun legal documents (src/content/legal), rendered once at build time. `yarn legal` (also run before
// `yarn start` and `yarn build`) writes documents.json, which the page shows (src/pages/Legal.tsx); copy-routes.js
// also writes the same document into each route's served HTML, so it reads without JavaScript.
// legal.json lists the versions, newest (in force) first; each one is the dated .md file next to it, unchanged.
const fs = require('fs');
const path = require('path');

const { escapeAttr, escapeText, parse, renderBlocks } = require('./markdown');
const LEGAL = require('../src/content/legal/legal.json');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'legal');
const OUTPUT = path.join(CONTENT_DIR, 'documents.json');

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Same as joinDots in src/lib/text.ts: keeps a middle dot on the line of the word before it.
const joinDots = (text) => text.replace(/(\S)·/g, '$1\u2060·');

// '2026-11-20' -> '2026년 11월 20일' (formatDate in src/lib/legal.ts).
const formatDate = (iso) => {
  const [ , year, month, day ] = ISO_DATE.exec(iso).map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

// '{name} 보기' with { name: '이용약관' } -> '이용약관 보기' (fill in src/lib/legal.ts).
const fill = (template, values) =>
  template.replace(/\{(\w+)\}/g, (_, key) => {
    if (!(key in values)) {
      throw new Error(`legal: no value for {${key}} in "${template}"`);
    }
    return values[key];
  });

// The version in force lives at the document's own path; an earlier one under its date.
const versionPath = (doc, date) => (date === doc.versions[0] ? doc.path : `${doc.path}${date}/`);

// '2026년 11월 20일 시행 (현행)' / '2026년 11월 10일 시행': the version links.
const versionLabel = (labels, doc, date) => {
  const label = fill(labels.effective, { date: formatDate(date) });
  return date === doc.versions[0] ? fill(labels.current, { label }) : label;
};

const isRealDate = (iso) => {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    return false;
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === iso;
};

function checkVersions(key, versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error(`legal: ${key} lists no versions`);
  }
  versions.forEach((date, i) => {
    if (!isRealDate(date)) {
      throw new Error(`legal: ${key} version "${date}" is not a YYYY-MM-DD date`);
    }
    if (i > 0 && !(versions[i - 1] > date)) {
      throw new Error(`legal: ${key} versions run newest first, without repeats (${versions[i - 1]}, ${date})`);
    }
  });
}

// One version: its # title as text, the rest as one HTML string per block. The file's own date line has to
// name the date it is filed under, so a copy saved under the wrong name fails here.
function renderDocument(source, date) {
  const blocks = parse(source);
  const [ title, ...rest ] = blocks;
  if (!title || title.type !== 'heading' || title.depth !== 1) {
    throw new Error('legal: a document starts with its # title');
  }
  if (rest.some((block) => block.type === 'heading' && block.depth === 1)) {
    throw new Error('legal: one # title per document');
  }
  if (title.text.includes('**')) {
    throw new Error('legal: the # title is plain text');
  }
  const expected = `시행일: ${formatDate(date)}`;
  const dateLine = rest[0];
  if (!dateLine || dateLine.type !== 'paragraph' || !(dateLine.text === expected || dateLine.text.startsWith(`${expected} `))) {
    throw new Error(`legal: the line after the title reads "${expected}..."`);
  }
  return { title: joinDots(title.text), blocks: renderBlocks(rest, { text: joinDots }) };
}

// { terms: { '2026-11-20': { title, blocks }, ... }, privacy: { ... } } from the .md files legal.json lists.
/**
 * @param {string} [dir]
 * @param {{ documents: Record<string, { versions: string[] }> }} [legal]
 */
function buildDocuments(dir = CONTENT_DIR, legal = LEGAL) {
  const documents = {};
  Object.entries(legal.documents).forEach(([ key, doc ]) => {
    checkVersions(key, doc.versions);
    const files = fs.readdirSync(path.join(dir, key)).filter((file) => file.endsWith('.md')).sort();
    const listed = doc.versions.map((date) => `${date}.md`).sort();
    if (files.join() !== listed.join()) {
      throw new Error(`legal: ${key}/ holds ${files.join(', ')} but legal.json lists ${listed.join(', ')}`);
    }
    documents[key] = {};
    doc.versions.forEach((date) => {
      const file = path.join(dir, key, `${date}.md`);
      try {
        documents[key][date] = renderDocument(fs.readFileSync(file, 'utf8'), date);
      } catch (error) {
        throw new Error(`${key}/${date}.md: ${error.message}`);
      }
    });
  });
  return documents;
}

const serialize = (documents) => `${JSON.stringify(documents, null, 2)}\n`;

// Writes documents.json when it changed (an unchanged file keeps its time, so a running dev server stays put).
function writeDocuments(output = OUTPUT) {
  const next = serialize(buildDocuments());
  const current = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : null;
  if (current !== next) {
    fs.writeFileSync(output, next);
  }
}

const readDocuments = () => JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));

// Every route a document is served at, newest version first.
const legalRoutes = (legal = LEGAL) =>
  Object.entries(legal.documents).flatMap(([ key, doc ]) =>
    doc.versions.map((date, i) => ({ key, date, current: i === 0, path: versionPath(doc, date) })));

// The header's back arrow (components/SiteHeader).
const ARROW =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13 8H3M7.5 3.5 3 8l4.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

const link = (href, text, attrs = '') => `<a href="${escapeAttr(href)}"${attrs}>${escapeText(text)}</a>`;

// What a route's served HTML holds in #root before the script runs: the page's header, notice and document,
// with the same markup as src/pages/Legal.tsx (React replaces it on start, and nothing under the header moves:
// src/pages/Legal.test.tsx compares the two). '' for a path that is not a legal document.
function staticMarkup(sitePath, documents = readDocuments(), legal = LEGAL) {
  const route = legalRoutes(legal).find((candidate) => candidate.path === sitePath);
  if (!route) {
    return '';
  }
  const { app, labels } = legal;
  const doc = legal.documents[route.key];
  const content = documents[route.key][route.date];
  const notice = route.current ? '' : [
    '<p class="legal-notice">',
    `<strong>${escapeText(labels.previous)}</strong> `,
    `<span>${escapeText(fill(labels.previousDetail, { name: doc.name, date: formatDate(doc.versions[0]) }))}</span> `,
    link(doc.path, fill(labels.toCurrent, { name: doc.name })),
    '</p>',
  ].join('');
  const versions = doc.versions.map((date) => {
    const href = versionPath(doc, date);
    return link(href, versionLabel(labels, doc, date), href === route.path ? ' aria-current="page"' : '');
  }).join('');
  const others = Object.entries(legal.documents)
    .filter(([ key ]) => key !== route.key)
    .map(([ , other ]) => link(other.path, fill(labels.toOther, { name: other.name }), ' class="legal-doc__other"'));
  return [
    '<div class="app">',
    '<header class="site-header site-header--text"><div class="container site-header__inner">',
    `<a class="site-header__back" href="${escapeAttr(app.path)}">${ARROW}${escapeText(app.backLabel)}</a>`,
    '</div></header>',
    '<main id="main" class="container legal">',
    `<div class="legal__notice" role="status">${notice}</div>`,
    '<article class="legal-doc">',
    `<h1 class="legal-doc__title">${escapeText(content.title)}</h1>`,
    '<div class="legal-doc__tools">',
    '<div class="legal-doc__versions" role="group" aria-labelledby="legal-versions-label">',
    `<span class="legal-doc__label" id="legal-versions-label">${escapeText(labels.version)}</span>`,
    `<span class="legal-doc__version-links">${versions}</span>`,
    '</div>',
    others.join(''),
    '</div>',
    `<div class="legal-doc__body">${content.blocks.join('')}</div>`,
    '</article>',
    '</main>',
    '</div>',
  ].join('');
}

if (require.main === module) {
  writeDocuments();
}

module.exports = {
  CONTENT_DIR,
  OUTPUT,
  buildDocuments,
  fill,
  formatDate,
  joinDots,
  legalRoutes,
  renderDocument,
  serialize,
  staticMarkup,
  versionLabel,
  versionPath,
  writeDocuments,
};
