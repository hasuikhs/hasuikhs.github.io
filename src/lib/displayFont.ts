// The display face (headings, poster and stub names) is requested as a `text=` subset holding only
// the characters the pages draw in it, so one small file loads instead of a whole Korean font.
// Gowun Dodum ships a single weight; every rule on the display face uses this weight, so the
// browser never synthesises a bold.
export const DISPLAY_FONT = { family: 'Gowun Dodum', weight: 400 } as const;

export function displayFontHref(strings: string[]) {
  const chars = Array.from(new Set(strings.join('').replace(/\s/g, ''))).join('');
  const family = `${DISPLAY_FONT.family.replace(/ /g, '+')}:wght@${DISPLAY_FONT.weight}`;
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap&text=${encodeURIComponent(chars)}`;
}

// Resolves once the display face is usable (or as soon as it is clear it will not load),
// so the headline entrance can wait for it. Never rejects.
export function loadDisplayFont(strings: string[]): Promise<void> {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = displayFontHref(strings);

  const settled = new Promise<void>((resolve) => {
    link.addEventListener('load', () => {
      const fonts = document.fonts;
      if (!fonts || typeof fonts.load !== 'function') {
        resolve();
        return;
      }
      fonts
        .load(`${DISPLAY_FONT.weight} 1em "${DISPLAY_FONT.family}"`, strings.join(''))
        .then(() => resolve(), () => resolve());
    });
    link.addEventListener('error', () => resolve());
  });

  document.head.appendChild(link);
  return settled;
}
