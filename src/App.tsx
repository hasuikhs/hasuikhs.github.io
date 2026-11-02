import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Yeoun from './pages/Yeoun';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={ <Home /> }/>
        <Route path="/yeoun" element={ <Yeoun /> } />
        <Route path="*" element={ <NotFound /> } />
      </Routes>
    </div>
  );
}

export default App;
