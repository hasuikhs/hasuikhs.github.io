// Keeps a middle dot on the line of the word before it. Chrome breaks before U+00B7 between Hangul words even
// with word-break: keep-all, which left lines starting with '·' ('내 티켓 / ·검색·캘린더'). U+2060 WORD JOINER
// forbids that break; the line can still break after the dot. Applied where text renders, so the strings in
// data (and the page descriptions built from them) stay as written. A dot after a space is left alone.
export const joinDots = (text: string) => text.replace(/(\S)·/g, '$1⁠·');
