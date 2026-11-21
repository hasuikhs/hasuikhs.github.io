// Listens for a media query's changes and returns the unsubscribe. Safari before 14 (iOS 12-13, macOS 13.1),
// still in the browserslist, has only the old addListener/removeListener on MediaQueryList.
export function onMediaChange(mq: MediaQueryList, listener: (event: MediaQueryListEvent) => void): () => void {
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }
  mq.addListener(listener);
  return () => mq.removeListener(listener);
}
