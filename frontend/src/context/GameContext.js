import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { setupCreateLobbyListeners, setupJoinLobbyListeners, setupGetLobbyListeners } from '../utils/setupJoinLobbyListeners';

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
    setUsername(username);
    
    try {
      const data = await setupCreateLobbyListeners(socket, { name: lobbyName, createdBy: username, numberLength });

      setLobbyData(data);
      setPlayers(data.players || []);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to create lobby');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinLobby = async (lobbyId, username) => {
    setLoading(true);
    setError(null);
    setUsername(username);

    try {
      const data = await setupJoinLobbyListeners(socket, { lobbyId, username });
      
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

  const getLobby = async (lobbyId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await setupGetLobbyListeners(socket, { lobbyId });
      
      setLobbyData(data);
      setPlayers(data.players || []);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to get lobby data');
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
  }, [socket]);

  const value = {
    username, setUsername,
    lobbyData, setLobbyData,
    loading, error,
    players, messages,
    createLobby, joinLobby, getLobby, leaveLobby, sendChatMessage
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
