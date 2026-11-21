// Markdown for exactly what the Yeoun legal documents use (src/content/legal): ATX headings (# to ###),
// paragraphs, '-' and '1.' lists with one nested level, GFM tables, **strong**, and e-mail addresses as
// mailto links. Anything else markdown would turn into markup throws, so a new version written with it
// fails the build and the tests instead of shipping stray '>' or '[...](...)' to readers.
// Runs in node (scripts/legal-docs.js renders the documents at build time); the page only inserts the result.

const HEADING = /^(#{1,6}) +(.*)$/;
const ITEM = /^( *)(?:(-)|(\d{1,9})\.) (.*)$/;
const DELIMITER_CELL = /^:?-{3,}:?$/;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

// Line starts markdown reads as a block this renderer does not draw.
const UNSUPPORTED_BLOCKS = [
  [ /^ {0,3}>/, 'blockquote' ],
  [ /^ {0,3}(```|~~~)/, 'code fence' ],
  [ /^ {4}/, 'indented code' ],
  [ /^ {0,3}([-*_])(?: *\1){2,} *$/, 'thematic break or setext heading' ],
  [ /^ {0,3}=+ *$/, 'setext heading' ],
  [ /^ {0,3}[*+] /, "list marker other than '-'" ],
  [ /^ {0,3}\d{1,9}\) /, "numbered list with ')'" ],
  [ /^ {0,3}</, 'HTML block' ],
  [ /^ {1,3}\S/, 'indented line' ],
];

// Inline markdown this renderer does not draw. Checked on the text left once the ** pairs are taken out.
const UNSUPPORTED_INLINE = [
  [ /`/, 'code span' ],
  [ /!?\[[^\]]*\]\(/, 'link or image' ],
  [ /\[[^\]]*\]\[/, 'reference link' ],
  [ /<[A-Za-z/!?]/, 'inline HTML or autolink' ],
  [ /\*/, 'emphasis' ],
  [ /(^|[\s(])_\S|\S_($|[\s).,])/, 'emphasis' ],
  [ /~~/, 'strikethrough' ],
  [ /\\[!-/:-@[-`{-~]/, 'backslash escape' ],
  [ /&(?:[A-Za-z][A-Za-z0-9]*|#\d+|#x[0-9A-Fa-f]+);/, 'HTML entity' ],
  [ /https?:\/\/|www\./, 'bare URL' ],
];

const escapeText = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (value) => escapeText(value).replace(/"/g, '&quot;');

const fail = (where, message) => {
  throw new Error(`markdown: ${where}: ${message}`);
};

const checkInline = (text, where) => {
  for (const [ pattern, name ] of UNSUPPORTED_INLINE) {
    if (pattern.test(text)) {
      fail(where, `unsupported ${name} in "${text}"`);
    }
  }
};

// Text with e-mail addresses as mailto links; `transform` runs on the escaped text only, never on a link.
function linkify(text, transform, where) {
  checkInline(text, where);
  let html = '';
  let last = 0;
  for (const match of text.matchAll(EMAIL)) {
    html += transform(escapeText(text.slice(last, match.index)));
    html += `<a href="mailto:${escapeAttr(match[0])}">${escapeText(match[0])}</a>`;
    last = match.index + match[0].length;
  }
  return html + transform(escapeText(text.slice(last)));
}

// **strong** and e-mail links.
function renderInline(text, transform, where) {
  const parts = text.split('**');
  if (parts.length % 2 === 0) {
    fail(where, `unclosed ** in "${text}"`);
  }
  return parts.map((part, i) => {
    if (i % 2 === 0) {
      return linkify(part, transform, where);
    }
    if (part === '' || /^\s|\s$/.test(part)) {
      fail(where, `** needs text right inside it in "${text}"`);
    }
    return `<strong>${linkify(part, transform, where)}</strong>`;
  }).join('');
}

// The text a reader sees, for attributes (the stacked table's column labels).
const plainText = (text) => text.replace(/\*\*/g, '');

const checkBlock = (line, where) => {
  for (const [ pattern, name ] of UNSUPPORTED_BLOCKS) {
    if (pattern.test(line)) {
      fail(where, `unsupported ${name}: "${line}"`);
    }
  }
};

const itemOf = (line) => {
  const match = ITEM.exec(line);
  if (!match) {
    return null;
  }
  const [ , indent, bullet, number, text ] = match;
  const ordered = !bullet;
  return {
    indent: indent.length,
    ordered,
    number: ordered ? Number(number) : null,
    // Where the item's own text starts: nested items sit exactly there.
    offset: indent.length + (ordered ? number.length + 2 : 2),
    text,
  };
};

// A tight list: every line an item, the top level at column 0, one nested level under an item's text.
function parseList(lines, firstLine) {
  const first = itemOf(lines[0]);
  if (first.indent !== 0) {
    fail(`line ${firstLine}`, 'a list starts at the left edge');
  }
  const list = { type: 'list', ordered: first.ordered, start: first.number, items: [] };
  lines.forEach((line, i) => {
    const where = `line ${firstLine + i}`;
    const item = itemOf(line);
    if (!item) {
      fail(where, `text inside a list that is not an item: "${line}"`);
    }
    if (item.indent === 0) {
      if (item.ordered !== list.ordered) {
        fail(where, "a list mixes '-' and '1.' items");
      }
      list.items.push({ text: item.text, where, offset: item.offset, children: null });
      return;
    }
    const parent = list.items[list.items.length - 1];
    if (item.indent !== parent.offset) {
      fail(where, `a nested item sits under its parent's text (column ${parent.offset}), one level only`);
    }
    if (!parent.children) {
      parent.children = { type: 'list', ordered: item.ordered, start: item.number, items: [] };
    } else if (parent.children.ordered !== item.ordered) {
      fail(where, "a nested list mixes '-' and '1.' items");
    }
    parent.children.items.push({ text: item.text, where, children: null });
  });
  return list;
}

function parseTable(rows, firstLine) {
  const cellsOf = (row, i) => {
    const where = `line ${firstLine + i}`;
    if (!/^\|.*\|$/.test(row)) {
      fail(where, `a table row starts and ends with '|': "${row}"`);
    }
    if (row.includes('\\|')) {
      fail(where, 'escaped | in a table cell');
    }
    return row.slice(1, -1).split('|').map((cell) => cell.trim());
  };
  if (rows.length < 3) {
    fail(`line ${firstLine}`, 'a table has a header row, a delimiter row and at least one row');
  }
  const head = cellsOf(rows[0], 0);
  const delimiter = cellsOf(rows[1], 1);
  if (delimiter.length !== head.length || !delimiter.every((cell) => DELIMITER_CELL.test(cell))) {
    fail(`line ${firstLine + 1}`, 'the second table row is the delimiter row, one cell per column');
  }
  const body = rows.slice(2).map((row, i) => {
    const cells = cellsOf(row, i + 2);
    if (cells.length !== head.length) {
      fail(`line ${firstLine + i + 2}`, `a table row has ${cells.length} cells, the header ${head.length}`);
    }
    return cells;
  });
  return { type: 'table', head, rows: body, where: `line ${firstLine}` };
}

// Blocks in source order: heading, paragraph, list, table.
function parse(source) {
  if (/[\r\t]/.test(source)) {
    fail('source', 'carriage returns and tabs are not supported');
  }
  const lines = source.split('\n');
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  const blocks = [];
  let i = 0;
  const lineNo = () => i + 1;
  const isBlank = (line) => line.trim() === '';
  const startsBlock = (line) => HEADING.test(line) || line.startsWith('|') || ITEM.test(line);

  while (i < lines.length) {
    const line = lines[i];
    const where = `line ${lineNo()}`;
    if (isBlank(line)) {
      i += 1;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const depth = heading[1].length;
      if (depth > 3) {
        fail(where, 'headings go down to ### only');
      }
      if (/(^| )#+ *$/.test(heading[2]) || heading[2].trim() === '') {
        fail(where, 'a heading has text and no closing #');
      }
      blocks.push({ type: 'heading', depth, text: heading[2].trim(), where });
      i += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const start = lineNo();
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && !isBlank(lines[i])) {
        fail(`line ${lineNo()}`, 'a blank line follows a table');
      }
      blocks.push(parseTable(rows, start));
      continue;
    }
    if (ITEM.test(line)) {
      const start = lineNo();
      const rows = [];
      while (i < lines.length && !isBlank(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      blocks.push(parseList(rows, start));
      continue;
    }
    checkBlock(line, where);
    const text = [];
    while (i < lines.length && !isBlank(lines[i])) {
      if (text.length > 0 && startsBlock(lines[i])) {
        fail(`line ${lineNo()}`, 'a blank line separates a paragraph from the block after it');
      }
      checkBlock(lines[i], `line ${lineNo()}`);
      text.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: text.join('\n'), where });
  }

  // Two lists of the same kind with only a blank line between them are one loose list in markdown.
  blocks.forEach((block, k) => {
    const previous = blocks[k - 1];
    if (block.type === 'list' && previous && previous.type === 'list' && previous.ordered === block.ordered) {
      fail(block.items[0].where, 'loose lists (a blank line between items) are not supported');
    }
  });
  // h1 -> h3 skips a level of the outline.
  let depth = 0;
  blocks.filter((block) => block.type === 'heading').forEach((block) => {
    if (block.depth > depth + 1) {
      fail(block.where, `heading level ${block.depth} follows level ${depth}`);
    }
    depth = block.depth;
  });
  return blocks;
}

function renderList(list, transform) {
  const tag = list.ordered ? 'ol' : 'ul';
  const start = list.ordered && list.start !== 1 ? ` start="${list.start}"` : '';
  const items = list.items.map((item) => {
    const children = item.children ? renderList(item.children, transform) : '';
    return `<li>${renderInline(item.text, transform, item.where)}${children}</li>`;
  });
  return `<${tag}${start}>${items.join('')}</${tag}>`;
}

// On phones each row is a card and the header row is hidden (legal.css): every cell, the row's own header first,
// carries its column's name in data-label for the label drawn above it.
function renderTable(table, transform) {
  const head = table.head.map((cell) => `<th scope="col">${renderInline(cell, transform, table.where)}</th>`);
  const label = (j) => ` data-label="${escapeAttr(plainText(table.head[j]))}"`;
  const rows = table.rows.map((cells) => {
    const [ first, ...rest ] = cells;
    const header = `<th scope="row"${label(0)}>${renderInline(first, transform, table.where)}</th>`;
    const data = rest.map((cell, j) => `<td${label(j + 1)}>${renderInline(cell, transform, table.where)}</td>`);
    return `<tr>${header}${data.join('')}</tr>`;
  });
  return `<div class="legal-doc__table"><table><thead><tr>${head.join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

// One HTML string per block. `text` transforms escaped text (never tags or links), e.g. the site's joinDots.
function renderBlocks(blocks, { text: transform = (value) => value } = {}) {
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading':
        return `<h${block.depth}>${renderInline(block.text, transform, block.where)}</h${block.depth}>`;
      case 'paragraph':
        return `<p>${renderInline(block.text, transform, block.where)}</p>`;
      case 'list':
        return renderList(block, transform);
      case 'table':
        return renderTable(block, transform);
      default:
        throw new Error(`markdown: unknown block ${block.type}`);
    }
  });
}

const renderMarkdown = (source, options) => renderBlocks(parse(source), options);

module.exports = { escapeAttr, escapeText, parse, renderBlocks, renderInline, renderMarkdown };
