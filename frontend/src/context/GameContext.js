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
  const [currentTurn, setCurrentTurn] = useState('');
  const [targetPlayer, setTargetPlayer] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [winner, setWinner] = useState(null);

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
      setError(err || 'Failed to join lobby');
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
    setGuesses([]);
    setCurrentTurn('');
    setTargetPlayer('');
    setWinner(null);

    if (socket && lobbyData) {
      socket.emit('leaveLobby', { lobbyId: lobbyData.lobbyId, username });
    }
  };

  const submitSecretNumber = (number) => {
    if (!socket || !lobbyData) return;
    socket.emit('submitSecretNumber', { lobbyId: lobbyData.lobbyId, username, number });
  };

  const startGame = () => {
    if (!socket || !lobbyData) return;
    socket.emit('startGame', { lobbyId: lobbyData.lobbyId });
  };

  const makeGuess = (targetPlayer, guessedNumber) => {
    if (!socket || !lobbyData) return;
    socket.emit('makeGuess', { lobbyId: lobbyData.lobbyId, fromPlayer: username, toPlayer: targetPlayer, guessedNumber});
  };

  const sendChatMessage = (message) => {
    if (!socket || !lobbyData) return;
    socket.emit('sendChatMessage', { lobbyId: lobbyData.lobbyId, message: message });
  };

  const getGameState = () => {
    if (!socket || !lobbyData) return;
    socket.emit('getGameState', { lobbyId: lobbyData.lobbyId });
  };

  const returnToLobby = (lobbyId) => {
    if (!socket || !username) return;
    socket.emit('returnToLobby', { lobbyId, username });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('playerJoinedLobby', (data) => setPlayers(data.players || []));
    socket.on('playerLeft', (data) => setPlayers(data.players || []));
    socket.on('playerReady', (data) => setPlayers(data.players || []));
    socket.on('gameStarted', (data) => {
      setLobbyData(prev => ({ ...prev, gameStatus: data.gameStatus }));
      setPlayers(data.players || []);
      setCurrentTurn(data.currentTurn || '');
      setTargetPlayer(data.targetPlayer || '');
      setWinner(null);
    });
    socket.on('turnChange', (data) => {
      setCurrentTurn(data.username || data.currentTurn || '');
      setTargetPlayer(data.targetPlayer || '');
    });
    socket.on('turnInfo', (data) => {
      setCurrentTurn(data.currentTurn || '');
      setTargetPlayer(data.targetPlayer || '');
    });
    socket.on('guessResult', (data) => {
      setGuesses(prev => [...prev, data.guess]);
      setPlayers(data.players || []);
      setCurrentTurn(data.currentTurn || '');
      setTargetPlayer(data.targetPlayer || '');
      if (data.gameStatus) {
        setLobbyData(prev => ({ ...prev, gameStatus: data.gameStatus }));
      }
    });
    socket.on('gameState', (data) => {
      setCurrentTurn(data.currentTurn || '');
      setTargetPlayer(data.targetPlayer || '');
      if (data.guesses) {
        setGuesses(data.guesses);
      }
    });
    socket.on('gameOver', (data) => {
      setLobbyData(data.lobby);
      setPlayers(data.lobby.players || []);
      setWinner(data.winner);
    });
    socket.on('systemMessage', (message) => setMessages(prev => [...prev, { type: 'system', ...message }]));
    socket.on('chatMessage', (message) => setMessages(prev => [...prev, { type: 'chat', sender: message.sender, content: message.message }]));
    socket.on('lobbyData', (data) => {
      setLobbyData(data);
      setPlayers(data.players || []);
      if (data.guesses) {
        setGuesses(data.guesses);
      }
    });
    socket.on('lobbyUpdated', (data) => {
      setLobbyData(data);
      setPlayers(data.players || []);
      setGuesses(data.guesses || []);
      setCurrentTurn(data.currentTurn || '');
      setTargetPlayer(data.targetPlayer || '');
    });

    return () => {
      socket.off('playerJoinedLobby');
      socket.off('playerLeft');
      socket.off('playerReady');
      socket.off('gameStarted');
      socket.off('turnChange');
      socket.off('turnInfo');
      socket.off('guessResult');
      socket.off('gameState');
      socket.off('gameOver');
      socket.off('systemMessage');
      socket.off('chatMessage');
      socket.off('lobbyData');
      socket.off('lobbyUpdated');
    };
  }, [socket]);

  const value = {
    username, setUsername,
    lobbyData, setLobbyData,
    loading, error,
    players, messages,
    currentTurn, targetPlayer, guesses,
    winner,
    createLobby, joinLobby, getLobby, leaveLobby,
    submitSecretNumber, startGame, makeGuess,
    sendChatMessage, getGameState,
    returnToLobby
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
