import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import MatchPage from './pages/MatchPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/match/:matchID" element={<MatchPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;