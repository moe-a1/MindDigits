import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import DrawingCanvas from '../components/DrawingCanvas';
import '../styles/Game.css';

function Game() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();  
  const [guessInput, setGuessInput] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const { lobbyData, username, players, currentTurn, targetPlayer, guesses, winner, leaveLobby, makeGuess, getGameState } = useGame();

  const clearCanvasRef = useRef(null);
  const setBrushColorRef = useRef(null);
  const setBrushSizeRef = useRef(null);

  const myPlayer = players.find(p => p.username === username) || {};
  const opponents = players.filter(p => p.username !== username && p.status === 'playing');
  
  const isGameOver = lobbyData?.gameStatus === 'completed';
  const isWinner = winner === username;

  useEffect(() => {
    if (!username || !lobbyData || (lobbyData.gameStatus !== 'active' && lobbyData.gameStatus !== 'completed')) {
      navigate(`/lobby/${lobbyId}`);
      return;
    }

    getGameState();
  }, [username, lobbyData, navigate, lobbyId, getGameState]);
  
  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  const clearCanvas = () => {
    if (clearCanvasRef.current) {
      clearCanvasRef.current();
    }
  };

  const updateBrushColor = (e) => {
    const newColor = e.target.value;
    setBrushColor(newColor);
    if (setBrushColorRef.current) {
      setBrushColorRef.current(newColor);
    }
  };

  const updateBrushSize = (e) => {
    const newSize = Number(e.target.value);
    setBrushSize(newSize);
    if (setBrushSizeRef.current) {
      setBrushSizeRef.current(newSize);
    }
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
      <DrawingCanvas isDrawingMode={isDrawingMode}
        externalClearCanvas={clearCanvasRef} externalSetBrushColor={setBrushColorRef} externalSetBrushSize={setBrushSizeRef}>
        <div className="game-header">
          <h1>MIND<span>DIGITS</span></h1>
          
          <div className="drawing-tools">
            <button className={`drawing-toggle ${isDrawingMode ? 'active' : ''}`} onClick={toggleDrawingMode}>
              {isDrawingMode ? 'Exit Drawing' : 'Draw'}
            </button>
            
            {isDrawingMode && (
              <>
                <input type="color" value={brushColor} onChange={updateBrushColor} className="color-picker"/>
                <input type="range" min="1" max="20" value={brushSize} onChange={updateBrushSize} className="brush-size-slider"/>
                <button onClick={clearCanvas} className="clear-button">Clear</button>
              </>
            )}
          </div>
          
          {!isGameOver && (
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
          )}
        </div>
        
        <div className="game-content">
          <div className={`game-board ${isDrawingMode ? 'drawing-mode' : ''}`}>
            <div className="player-section">
              <div className={`player-card my-card ${username === targetPlayer ? 'is-target' : ''}`}>
                {username === targetPlayer && !isGameOver && (
                  <span className="target-indicator">TARGETED</span>
                )}
                <h2>{username}</h2>
                <div className="player-number">{myPlayer.number}</div>
              </div>
            </div>

            <div className="opponents-section">
              {opponents.map((opponent) => (
                <div key={opponent.username} className={`opponent-card ${opponent.username === targetPlayer ? 'is-target' : ''}`}>
                  {opponent.username === targetPlayer && !isGameOver && (
                    <span className="target-indicator">TARGETED</span>
                  )}
                  <h2>{opponent.username}</h2>
                  
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
                      
                    {currentTurn === username && targetPlayer === opponent.username && !isGameOver && (
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="leave-game-button" onClick={onLeaveLobbyClick} disabled={isDrawingMode}>
            Leave Game
          </button>
        </div>

        {isGameOver && winner && (
          <WinnerModal winner={winner} isYou={isWinner} onLeaveGame={onLeaveLobbyClick}/>
        )}
      </DrawingCanvas>
    </div>
  );
}

const WinnerModal = ({ winner, isYou, onLeaveGame }) => {
  return (
    <div className="winner-modal-backdrop">
      <div className="winner-modal">
        <h2>Game Over!</h2>
        <div className="winner-username">{winner}</div>
        <p className="winner-message">
          {isYou 
            ? "Congratulations! You've won the game!"
            : `${winner} has won the game by being the last player standing!`}
        </p>
        <div className="winner-buttons">
          <button className="leave-game-winner-button" onClick={onLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game;