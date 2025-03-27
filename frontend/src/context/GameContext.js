import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { setupJoinLobbyListeners } from '../utils/setupJoinLobbyListeners';

const GameContext = createContext(null);

export const useGame = () => { return useContext(GameContext); };

export function GameProvider({ children }) {
  const { socket } = useSocket();
  const [username, setUsername] = useState('');
  const [lobbyData, setLobbyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);

  const createLobby = async (lobbyName, username, numberLength = 4) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/lobby/create-lobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: lobbyName,
          createdBy: username,
          numberLength
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create lobby');
      }
      
      setLobbyData(data);
      setUsername(username);
      
      if (socket) {
        socket.emit('joinLobby', { lobbyId: data.lobbyId, username });
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinLobby = async (lobbyId, username) => {
    if (!socket) {
      throw new Error('Socket connection not established');
    }

    setLoading(true);
    setError(null);
    setUsername(username);

    try {
      socket.emit('joinLobby', { lobbyId, username });
      
      const data = await setupJoinLobbyListeners(socket);
      setLobbyData(data);
      setPlayers(data.players || []);

      return data;
    } catch (err) {
      setError(err.message || 'Failed to join lobby');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveLobby = () => {
    setLobbyData(null);
    setPlayers([]);
    setMessages([]);

    if (socket && lobbyData) {
      socket.emit('leaveLobby', { lobbyId: lobbyData.lobbyId, username });
    }
  };

  const sendChatMessage = (message) => {
    if (!socket || !lobbyData) return;
    socket.emit('sendChatMessage', { lobbyId: lobbyData.lobbyId, message: message });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('playerJoinedLobby', (data) => setPlayers(data.players || []));
    socket.on('playerLeft', (data) => setPlayers(data.players || []));
    socket.on('systemMessage', (message) => setMessages(prev => [...prev, { type: 'system', ...message }]));
    socket.on('chatMessage', (message) => setMessages(prev => [...prev, { type: 'chat', sender: message.sender, content: message.message }]));

    return () => {
      socket.off('playerJoinedLobby');
      socket.off('playerLeft');
      socket.off('systemMessage');
      socket.off('chatMessage');
    };
  }, [socket, username]);

  const value = {
    username, setUsername,
    lobbyData, setLobbyData,
    loading, error,
    players, messages,
    createLobby, joinLobby, leaveLobby, sendChatMessage
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
