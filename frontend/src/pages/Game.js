import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import DrawingCanvas from '../components/DrawingCanvas';
import '../styles/Game.css';

function Game() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();  
  const [guessInput, setGuessInput] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const { lobbyData, username, players, currentTurn, targetPlayer, guesses, leaveLobby, makeGuess, getGameState } = useGame();

  const myPlayer = players.find(p => p.username === username) || {};
  const opponents = players.filter(p => p.username !== username && p.status === 'playing');

  useEffect(() => {
    if (!username || !lobbyData || lobbyData.gameStatus !== 'active') {
      navigate(`/lobby/${lobbyId}`);
      return;
    }

    getGameState();
  }, [username, lobbyData, navigate, lobbyId, getGameState]);
  
  const onDrawingModeChange = (drawingMode) => {
    setIsDrawingMode(drawingMode);
  };

  const onSubmitGuess = (e) => {
    e.preventDefault();
    if (!guessInput || !targetPlayer || isDrawingMode) return;
    
    makeGuess(targetPlayer, guessInput);
    setGuessInput('');
  };

  const onLeaveLobbyClick = () => {
    leaveLobby();
    navigate('/');
  };

  return (
    <div className="game-container">
      <DrawingCanvas onDrawingModeChange={onDrawingModeChange}>
        {/* Game header sits above the canvas */}
        <div className="game-header">
          <h1>MIND<span>DIGITS</span></h1>
          
          <div className="turn-indicator">
            {currentTurn === username 
              ? (
                <div>
                  <p>It's your turn!</p>
                  <p>You are guessing <strong>{targetPlayer}</strong>'s number</p>
                </div>
              ) 
              : (
                <div>
                  <p>Waiting for <strong>{currentTurn}</strong> to make a guess...</p>
                  <p><strong>{targetPlayer}</strong>'s number is being targeted</p>
                </div>
              )}
          </div>
        </div>
        
        <div className="game-content">
          <div className={`game-board ${isDrawingMode ? 'drawing-mode' : ''}`}>
            <div className="player-section">
              <div className={`player-card my-card ${username === targetPlayer ? 'is-target' : ''}`}>
                <h2>{username}</h2>
                {username === targetPlayer && (
                  <div className="target-indicator">Your number is being targeted</div>
                )}
                <div className="player-number">{myPlayer.number}</div>
              </div>
            </div>

            <div className="opponents-section">
              {opponents.map((opponent) => (
                <div key={opponent.username} className={`opponent-card ${opponent.username === targetPlayer ? 'is-target' : ''}`}>
                  <h2>{opponent.username}</h2>
                  {opponent.username === targetPlayer && (
                    <div className="target-indicator">Currently targeted</div>
                  )}
                  {currentTurn === username && targetPlayer === opponent.username && (
                    <div className="guess-form">
                      <form onSubmit={onSubmitGuess}>
                        <input type="text" pattern="[0-9]*" maxLength={lobbyData.numberLength} placeholder={`Guess ${opponent.username}'s ${lobbyData.numberLength} digit number`}
                          value={guessInput} onChange={(e) => setGuessInput(e.target.value.replace(/[^0-9]/g, ''))} disabled={isDrawingMode} />
                        <button type="submit" disabled={isDrawingMode || guessInput.length !== lobbyData.numberLength}>
                          Guess
                        </button>
                      </form>
                    </div>
                  )}
                  
                  <div className="guess-history">
                    {guesses
                      .filter(guess => guess.toPlayer === opponent.username)
                      .map((guess, index) => (
                        <div key={index} className="guess-item">
                          <div>
                            <span className="guess-from">{guess.fromPlayer}:</span>
                            <span className="guessed-number">{guess.guessedNumber}</span>
                          </div>
                          <span className="exact-matches">{guess.exactMatches} correct</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="leave-game-button" onClick={onLeaveLobbyClick} disabled={isDrawingMode}>
            Leave Game
          </button>
        </div>
      </DrawingCanvas>
    </div>
  );
}

export default Game;