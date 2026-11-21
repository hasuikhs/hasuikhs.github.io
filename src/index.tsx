import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { DISPLAY_STRINGS } from './data/apps';
import { loadDisplayFont } from './lib/displayFont';
import { initTheme } from './lib/theme';

import { BrowserRouter } from 'react-router-dom';

// `.js` lets CSS hide scroll-reveal content only when a script will reveal it again.
// `.fonts-ready` releases the paused entrance animations; the timer caps the wait at 1.5s.
const html = document.documentElement;
html.classList.add('js');
// public/index.html already set data-theme before paint; this keeps it and follows later system changes.
initTheme();
const markFontsReady = () => html.classList.add('fonts-ready');
const displayFont = loadDisplayFont(DISPLAY_STRINGS);
Promise.all([ document.fonts?.ready, displayFont ]).then(markFontsReady, markFontsReady);
window.setTimeout(markFontsReady, 1500);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter basename={ process.env.PUBLIC_URL }>
    <App />
  </BrowserRouter>
);
