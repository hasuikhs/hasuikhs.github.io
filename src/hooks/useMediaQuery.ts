import { useEffect, useState } from 'react';

import { onMediaChange } from '../lib/mediaQuery';

const read = (query: string) => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false);

// Live media query match. Without matchMedia (jsdom, old browsers) it is always false.
function useMediaQuery(query: string) {
  const [ matches, setMatches ] = useState(() => read(query));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    return onMediaChange(mq, onChange);
  }, [ query ]);

  return matches;
}

export default useMediaQuery;
