import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:lobbyId" element={<Lobby />} />
            <Route path="/game/:lobbyId" element={<Game />} />
          </Routes>
        </Router>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;
