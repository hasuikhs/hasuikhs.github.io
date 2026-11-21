import { readFileSync } from 'fs';
import path from 'path';

// Aliased: the testing-library lint rules take any `render*` call for a component render.
import { parse, renderMarkdown as markdownHtml } from '../../scripts/markdown';

const CONTENT = path.join(__dirname, '..', 'content', 'legal');
const FILES = [ 'terms/2026-11-20.md', 'terms/2026-11-10.md', 'privacy/2026-11-20.md', 'privacy/2026-11-10.md' ];
const read = (file: string) => readFileSync(path.join(CONTENT, file), 'utf8');

// The rendered blocks as a DOM, to count and read them the way a browser does.
const dom = (html: string[]) => {
  const holder = document.createElement('div');
  holder.innerHTML = html.join('');
  return holder;
};

const linesOf = (source: string) => source.split('\n');
const count = (source: string, pattern: RegExp) => linesOf(source).filter((line) => pattern.test(line)).length;

// What a reader should see of a source line: the line without its markdown.
const plainParts = (line: string) => {
  if (/^\|(?: *:?-{3,}:? *\|)+$/.test(line)) {
    return [];
  }
  if (line.startsWith('|')) {
    return line.slice(1, -1).split('|').map((cell) => cell.trim().replace(/\*\*/g, ''));
  }
  return [ line.replace(/^#{1,6} /, '').replace(/^ *(?:-|\d+\.) /, '').replace(/\*\*/g, '') ];
};

describe.each(FILES)('%s', (file) => {
  const source = read(file);
  const html = markdownHtml(source);
  const root = dom(html);
  const text = root.textContent ?? '';

  test('every heading is a heading element of its level', () => {
    expect(root.querySelectorAll('h1')).toHaveLength(count(source, /^# /));
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.querySelectorAll('h2')).toHaveLength(count(source, /^## /));
    expect(root.querySelectorAll('h3')).toHaveLength(count(source, /^### /));
    expect(root.querySelectorAll('h2').length).toBeGreaterThan(10);
  });

  test('every list item is an li, in an ol for numbered lines and a ul for dashes', () => {
    expect(root.querySelectorAll('li')).toHaveLength(count(source, /^ *(?:-|\d+\.) /));
    expect(root.querySelectorAll('ol > li')).toHaveLength(count(source, /^ *\d+\. /));
    expect(root.querySelectorAll('ul > li')).toHaveLength(count(source, /^ *- /));
    // Each run of lines is one list, so numbering restarts per list as written (every list starts at 1).
    expect(root.querySelectorAll('ol[start]')).toHaveLength(0);
  });

  test('bold text is strong, e-mail addresses are mailto links, and tables are tables', () => {
    const pairs = linesOf(source).reduce((sum, line) => sum + (line.match(/\*\*/g) ?? []).length / 2, 0);
    expect(root.querySelectorAll('strong')).toHaveLength(pairs);
    const emails = source.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
    expect(emails.length).toBeGreaterThan(0);
    const links = Array.from(root.querySelectorAll('a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(emails.map((email) => `mailto:${email}`));
    const tableLines = linesOf(source).filter((line) => line.startsWith('|'));
    expect(root.querySelectorAll('tr')).toHaveLength(Math.max(tableLines.length - 1, 0));
  });

  test('no markdown is left in the text', () => {
    expect(text).not.toContain('**');
    expect(text).not.toContain('|');
    // A heading may start with its own number ('## 1. 개요'); nothing starts with a heading mark, and no
    // paragraph or cell with a list marker.
    const ownText = (el: Element) =>
      Array.from(el.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('');
    Array.from(root.querySelectorAll('h1, h2, h3, p, li, th, td')).forEach((el) => expect(ownText(el)).not.toMatch(/^\s*#/));
    Array.from(root.querySelectorAll('p, li, th, td')).forEach((el) => expect(ownText(el)).not.toMatch(/^\s*(- |\d+\. )/));
  });

  test('every line of the source reads in full, in order', () => {
    let from = 0;
    linesOf(source).filter((line) => line.trim() !== '').flatMap(plainParts).forEach((part) => {
      const at = text.indexOf(part, from);
      expect({ part, found: at >= 0 }).toEqual({ part, found: true });
      from = at + part.length;
    });
  });

  test('the parse is all headings, paragraphs, lists and tables', () => {
    const types = new Set(parse(source).map((block: { type: string }) => block.type));
    types.forEach((type) => expect([ 'heading', 'paragraph', 'list', 'table' ]).toContain(type));
  });
});

describe('the nested list and the table', () => {
  test("the terms' list under 제10조 제1항 is nested in that item", () => {
    const root = dom(markdownHtml(read('terms/2026-11-20.md')));
    const nested = root.querySelector('ol > li > ul');
    expect(nested?.parentElement?.firstChild?.textContent).toBe('이용자는 다음 행위를 해서는 안 됩니다.');
    expect(nested?.querySelectorAll('li')).toHaveLength(4);
  });

  test("the privacy policy's table has column headers, a row header per row and labelled cells", () => {
    const root = dom(markdownHtml(read('privacy/2026-11-20.md')));
    const table = root.querySelector('.legal-doc__table > table');
    expect(table).not.toBeNull();
    const heads = Array.from(table?.querySelectorAll('thead th') ?? []);
    expect(heads.map((th) => th.textContent)).toEqual([ '수탁·이전받는 자', '국가', '항목', '목적', '보유 기간' ]);
    heads.forEach((th) => expect(th).toHaveAttribute('scope', 'col'));
    const rows = Array.from(table?.querySelectorAll('tbody tr') ?? []);
    expect(rows).toHaveLength(4);
    rows.forEach((row) => {
      expect(row.querySelector('th')).toHaveAttribute('scope', 'row');
      // The phone cards hide the header row: the first column names itself too.
      expect(row.querySelector('th')).toHaveAttribute('data-label', '수탁·이전받는 자');
      expect(Array.from(row.querySelectorAll('td')).map((td) => td.getAttribute('data-label'))).toEqual([ '국가', '항목', '목적', '보유 기간' ]);
    });
    expect(rows[0].querySelector('th')?.textContent).toBe('Railway Corp. (서버 호스팅)');
  });

  test('the phone cards draw every column name, the first column\'s included', () => {
    const css = readFileSync(path.join(__dirname, '..', 'styles', 'legal.css'), 'utf8');
    const phones = css.slice(css.indexOf('@media (max-width: 767px)'));
    expect(phones).toMatch(/\.legal-doc__table thead \{[^}]*clip: rect\(0, 0, 0, 0\);/);
    expect(phones).toMatch(/\.legal-doc__table th\[data-label\]::before,\s*\.legal-doc__table td::before \{\s*content: attr\(data-label\);/);
  });
});

describe('renderer', () => {
  test('escapes text and runs the text transform on text only, never on a link', () => {
    const html = markdownHtml('a < b & "c" · d@example.com·e\n', { text: (value: string) => value.replace(/·/g, '[dot]') }).join('');
    expect(html).toBe('<p>a &lt; b &amp; "c" [dot] <a href="mailto:d@example.com">d@example.com</a>[dot]e</p>');
  });

  test('a numbered list that does not start at 1 keeps its number', () => {
    expect(markdownHtml('3. c\n4. d\n').join('')).toBe('<ol start="3"><li>c</li><li>d</li></ol>');
  });

  test.each([
    [ 'blockquote', '> 인용\n' ],
    [ 'code fence', '```\ncode\n```\n' ],
    [ 'indented code', '    code\n' ],
    [ 'thematic break', '---\n' ],
    [ 'setext heading', '제목\n===\n' ],
    [ 'star bullet', '* 항목\n' ],
    [ 'numbered list with )', '1) 항목\n' ],
    [ 'HTML block', '<div>x</div>\n' ],
    [ 'inline HTML', '글 <b>굵게</b>\n' ],
    [ 'link', '[여운](https://example.com)\n' ],
    [ 'image', '![x](y.png)\n' ],
    [ 'bare URL', '주소 https://example.com\n' ],
    [ 'emphasis', '*기울임*\n' ],
    [ 'underscore emphasis', '_기울임_\n' ],
    [ 'code span', '`code`\n' ],
    [ 'strikethrough', '~~취소~~\n' ],
    [ 'backslash escape', '\\*별\n' ],
    [ 'HTML entity', '&amp;\n' ],
    [ 'unclosed strong', '**굵게\n' ],
    [ 'heading level 4', '# a\n\n## b\n\n### c\n\n#### d\n' ],
    [ 'skipped heading level', '# a\n\n### c\n' ],
    [ 'closing hashes', '## 제목 ##\n' ],
    [ 'loose list', '- a\n\n- b\n' ],
    [ 'lazy continuation', '- a\n이어지는 줄\n' ],
    [ 'mixed markers', '- a\n1. b\n' ],
    [ 'two nested levels', '1. a\n   - b\n     - c\n' ],
    [ 'paragraph running into a list', '문단\n- 항목\n' ],
    [ 'table row with a missing cell', '| a | b |\n| --- | --- |\n| 1 |\n' ],
    [ 'table without a delimiter row', '| a | b |\n| 1 | 2 |\n| 3 | 4 |\n' ],
    [ 'tab', '\t들여쓰기\n' ],
  ])('throws on %s instead of showing it raw', (_name, source) => {
    expect(() => markdownHtml(source)).toThrow(/^markdown: /);
  });
});
