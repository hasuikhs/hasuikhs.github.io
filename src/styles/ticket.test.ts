import { readFileSync } from 'fs';
import path from 'path';

const ticketCss = readFileSync(path.join(__dirname, 'ticket.css'), 'utf8');

describe('ticket punch holes', () => {
  const ruleOf = (selector: string) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A rule starts after the previous rule's brace or after a comment.
    return Array.from(ticketCss.matchAll(new RegExp(`(?:^|\\}|\\*/)\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[1]).join('');
  };
  const appCss = readFileSync(path.join(__dirname, '..', 'App.css'), 'utf8');

  // Painted discs could not take the shade of the shadow around them and read as pale or grey coins, with
  // a seam line through them (2026-11-21 owner): the holes are cut out of the faces instead.
  test('holes are cut out of the faces, not painted over them', () => {
    expect(ticketCss).not.toMatch(/\.ticket__piece::(before|after)/);
    const face = ruleOf('.ticket:not(.ticket--solo) .ticket__face');
    [ 'mask', '-webkit-mask' ].forEach((property) => {
      const value = face.match(new RegExp(`(?:^|;)\\s*${property}:([^;]*);`))?.[1] ?? '';
      expect(value).toMatch(/radial-gradient\(circle var\(--hole-r\) at var\(--hole-at-1\), var\(--hole-cut\)\)/);
      expect(value).toMatch(/radial-gradient\(circle var\(--hole-r\) at var\(--hole-at-2\), var\(--hole-cut\)\)/);
      expect(value).toMatch(/var\(--tear, linear-gradient\(#000, #000\)\)/);
    });
    // One operator per layer, and no hand-written -webkit- list: autoprefixer derives it (a lone 'intersect'
    // came out as '-webkit-mask-composite: source-in, xor', which blanks the faces in older engines).
    expect(face).toMatch(/(^|;)\s*mask-composite:\s*intersect, intersect, add;/);
    expect(face).not.toMatch(/-webkit-mask-composite/);
    // The cut takes the face border with it; a ring in the edge colour redraws that edge round the cut.
    expect(face).toMatch(/--hole-edge:\s*var\(--ticket-edge\)/);
    expect(face).toMatch(/radial-gradient\(circle calc\(var\(--hole-r\) \+ 1px\) at var\(--hole-at-1\), var\(--hole-edge\)\) border-box/);
  });

  test('the holes sit on both ends of the seam, across for a horizontal ticket and down for a vertical one', () => {
    const at = (selector: string) => [ 1, 2 ].map((n) => ruleOf(selector).match(new RegExp(`--hole-at-${n}:\\s*([^;]+);`))?.[1]);
    expect(at('.ticket__piece--main .ticket__face')).toEqual([ '100% 0', '100% 100%' ]);
    expect(at('.ticket__piece--stub .ticket__face')).toEqual([ '0 0', '0 100%' ]);
    expect(at('.ticket--v .ticket__piece--main .ticket__face')).toEqual([ '0 100%', '100% 100%' ]);
    expect(at('.ticket--v .ticket__piece--stub .ticket__face')).toEqual([ '0 0', '100% 0' ]);
  });

  // A torn edge used to replace the face's mask; now it is one more layer, so the holes stay cut.
  test('a torn edge is cut together with the holes', () => {
    [
      '.is-torn .ticket__piece--main .ticket__face',
      '.is-torn .ticket__piece--stub .ticket__face',
      '.ticket--v.is-torn .ticket__piece--main .ticket__face',
      '.ticket--v.is-torn .ticket__piece--stub .ticket__face',
    ].forEach((selector) => {
      const rule = ruleOf(selector);
      expect({ selector, tear: /--tear:\s*radial-gradient\(circle 3px/.test(rule), mask: /(^|;)\s*(-webkit-)?mask:/.test(rule) })
        .toEqual({ selector, tear: true, mask: false });
    });
  });

  // One shadow for the whole outline (a filter): it runs round the holes and a torn edge, and a piece's
  // shadow no longer lies over the other piece at the seam.
  test('the ticket casts one shadow that follows its cut outline, in both themes', () => {
    expect(ruleOf('.ticket')).toMatch(/filter:\s*var\(--ticket-shadow\);/);
    expect(ruleOf('.ticket__piece')).not.toMatch(/box-shadow/);
    const light = appCss.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
    const dark = appCss.match(/:root\[data-theme='dark'\]\s*\{([^}]*)\}/)?.[1] ?? '';
    // Dark tickets cast a dark shadow too (2026-11-21 owner: not a light glow).
    [ light, dark ].forEach((tokens) => expect(tokens).toMatch(/--ticket-shadow:\s*drop-shadow\(0 [^;]*rgba\((28, 21, 16|0, 0, 0),/));
  });

  test('a ticket without a stub has no holes', () => {
    expect(ticketCss).toMatch(/\.ticket:not\(\.ticket--solo\) \.ticket__face \{/);
  });
});
