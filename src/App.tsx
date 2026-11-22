import React, { useLayoutEffect } from 'react';
import './App.css';
import './styles/ticket.css';
import './styles/stage.css';
import './styles/sections.css';
import './styles/legal.css';
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';

import AccountDeletion from './pages/AccountDeletion';
import Home from './pages/Home';
import Legal from './pages/Legal';
import Yeoun from './pages/Yeoun';
import NotFound from './pages/NotFound';

// A link to another page opens it at the top (React Router keeps the scroll position otherwise: '자세히
// 보기' on the hub opened the app page part way down). Back and forward leave it to the browser's restore.
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useLayoutEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [ pathname, navigationType ]);
  return null;
}

function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={ <Home /> }/>
        <Route path="/yeoun" element={ <Yeoun /> } />
        { /* The version in force at the plain path, earlier ones by date (src/content/legal/legal.json). */ }
        <Route path="/yeoun/terms" element={ <Legal doc="terms" /> } />
        <Route path="/yeoun/terms/:version" element={ <Legal doc="terms" /> } />
        <Route path="/yeoun/privacy" element={ <Legal doc="privacy" /> } />
        <Route path="/yeoun/privacy/:version" element={ <Legal doc="privacy" /> } />
        { /* Deleting the account, in the app or by mail without it (legal.json accountDeletion). */ }
        <Route path="/yeoun/account-deletion" element={ <AccountDeletion /> } />
        <Route path="*" element={ <NotFound /> } />
      </Routes>
      <div className="page-grain" aria-hidden="true" />
    </div>
  );
}

export default App;
