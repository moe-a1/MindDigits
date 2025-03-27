import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import '../styles/Lobby.css';

function Lobby() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const { socket, connected } = useSocket();
  const { lobbyData, username, players, messages, sendChatMessage, leaveLobby } = useGame();
  const [copySuccess, setCopySuccess] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }
    
    if (!lobbyData && socket && connected) {
      navigate('/');
    }
  }, [username, lobbyData, socket, connected, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyLobbyIdToClipboard = () => {
    navigator.clipboard.writeText(lobbyId)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setCopySuccess('Failed to copy');
      });
  };

  const onSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    sendChatMessage(chatMessage);
    setChatMessage('');
  };

  const onLeaveLobbyClick = () => {
    leaveLobby();
    navigate('/');
  };

  if (!connected || !lobbyData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{!connected ? "Connecting to server..." : "Loading lobby data..."}</p>
      </div>
    );
  }
  
  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>{lobbyData.name}</h1>
        <div className="lobby-info">
          <div className="lobby-id-container">
            <span className="label">Lobby ID:</span>
            <span className="lobby-id">{lobbyId}</span>
            <button className="copy-button" onClick={copyLobbyIdToClipboard}>
              {copySuccess || 'Copy'}
            </button>
          </div>
          <div className="game-settings">
            <span className="label">Number Length:</span>
            <span className="value">{lobbyData.numberLength} digits</span>
          </div>
          <button className="leave-button" onClick={onLeaveLobbyClick}>
            Leave Lobby
          </button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="players-list">
          <h2>Players ({players.length})</h2>
          <ul>
            {players.map((player, index) => (
              <li key={index} className={`player-item ${player.status || 'waiting'}`}>
                <span className="player-name">
                  {player.username}
                  {player.username === username && ' (You)'}
                </span>
                <span className="player-status">{player.status || 'waiting'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="game-area">
          <div className="game-status">
            <h2>Game Status: {lobbyData.gameStatus || 'waiting'}</h2>
            <p>
              {(lobbyData.gameStatus === 'waiting' || !lobbyData.gameStatus)
                ? 'Waiting for players to join and get ready...' 
                : lobbyData.gameStatus === 'active'
                    ? 'Game is in progress!' : 'Game has ended!'
              }
            </p>
          </div>

          <div className="action-buttons">
            <button className="main-action-button">
              {(lobbyData.gameStatus === 'waiting' || !lobbyData.gameStatus) ? 'Get Ready' : 'Start New Game'}
            </button>
          </div>
        </div>

        <div className="chat-area">
          <h2>Chat</h2>
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="no-messages">No messages yet. Say hello!</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} 
                  className={`message ${msg.type === 'system' ? 'system-message' : 'chat-message'} ${msg.sender === username ? 'own-message' : ''}`}>
                  {msg.type === 'chat' && <span className="sender">{msg.sender}:</span>}
                  <span className="content">{msg.content || msg.message}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input" onSubmit={onSendMessage}>
            <input type="text" placeholder="Type a message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}/>
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
