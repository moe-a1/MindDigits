import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const { createLobby, joinLobby, error, loading } = useGame();
  const [username, setUsername] = useState('');
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [selectedTab, setSelectedTab] = useState('create');
  const [numberLength, setNumberLength] = useState(4);
  const [userEditedLobbyName, setUserEditedLobbyName] = useState(false);

  useEffect(() => {
    if (username && !userEditedLobbyName) {
      setLobbyName(`${username}'s Lobby`);
    }
  }, [username, userEditedLobbyName]);

  const onLobbyNameChange = (e) => {
    setLobbyName(e.target.value);
    setUserEditedLobbyName(true);
  };

  const onCreateLobbyClick = async (e) => {
    e.preventDefault();
    if (!username || !lobbyName) return;

    const result = await createLobby(lobbyName, username, numberLength);
    if (result) {
      navigate(`/lobby/${result.lobbyId}`);
    }
  };

  const onJoinLobbyClick = async (e) => {
    e.preventDefault();
    if (!username || !lobbyId) return;

    try {
      await joinLobby(lobbyId, username);
      navigate(`/lobby/${lobbyId}`);
    } catch (error) {
      console.error('Failed to join lobby:', error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="logo-container">
          <h1 className="game-title">MIND<span>DIGITS</span></h1>
          <p className="game-tagline">Crack the code, outsmart your friends!</p>
        </div>

        <div className="card">
          <div className="tabs">
            <button className={`tab ${selectedTab === 'create' ? 'active' : ''}`} onClick={() => setSelectedTab('create')}>
              Create Lobby
            </button>
            <button className={`tab ${selectedTab === 'join' ? 'active' : ''}`} onClick={() => setSelectedTab('join')}>
              Join Lobby
            </button>
          </div>

          <div className="card-content">
            {selectedTab === 'create' ? (
              <form onSubmit={onCreateLobbyClick}>
                <div className="form-group">
                  <label htmlFor="username">Your Username</label>
                  <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username" required/>
                </div>
                <div className="form-group">
                  <label htmlFor="lobbyName">Lobby Name</label>
                  <input type="text" id="lobbyName" value={lobbyName} onChange={onLobbyNameChange}
                    placeholder="Enter lobby name" required/>
                </div>
                <div className="form-group">
                  <label htmlFor="numberLength">Number Length</label>
                  <select id="numberLength" value={numberLength} onChange={(e) => setNumberLength(Number(e.target.value))}>
                    <option value="3">3 Digits</option>
                    <option value="4">4 Digits</option>
                    <option value="5">5 Digits</option>
                    <option value="6">6 Digits</option>
                  </select>
                </div>
                <button type="submit" className="submit-btn" disabled={loading || !username}>
                  {loading ? 'Creating...' : 'Create Lobby'}
                </button>
              </form>
            ) : (
              <form onSubmit={onJoinLobbyClick}>
                <div className="form-group">
                  <label htmlFor="username-join">Your Username</label>
                  <input type="text" id="username-join" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username" required/>
                </div>
                <div className="form-group">
                  <label htmlFor="lobbyId">Lobby ID</label>
                  <input type="text" id="lobbyId" value={lobbyId} onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                    placeholder="Enter lobby ID" required/>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Lobby'}
                </button>
              </form>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;