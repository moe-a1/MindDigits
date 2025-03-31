import { isValidNumber, allPlayersReady, generateLobbyId, initializeTurnSystem } from '../utils/gameUtils.js';
import { findLobby, disconnectPlayer, startGame, handlePlayerGuess } from '../utils/lobbyUtils.js';
import { emitToLobby, emitSystemMessage, handleError } from '../utils/socketUtils.js';
import Lobby from '../models/Lobby.js';

export default function setupSocketHandlers(io) {
  const activeConnections = {};

  io.on('connection', (socket) => {
    activeConnections[socket.id] = { connected: true };

    socket.on('createLobby', async ({ name, createdBy, numberLength = 4 }) => {
      try {
        if (!name || !createdBy) {
          handleError(socket, 'Name and creator are required');
          return;
        }
        
        const lobby = new Lobby({
          lobbyId: generateLobbyId(),
          name,
          createdBy,
          numberLength,
          players: [{ username: createdBy, status: 'waiting' }]
        });
        
        const newLobby = await lobby.save();
        
        activeConnections[socket.id] = { ...activeConnections[socket.id], lobbyId: lobby.lobbyId, username: createdBy };
        
        socket.join(`lobby:${lobby.lobbyId}`);
                
        socket.emit('lobbyCreated', newLobby.toObject());
      } catch (err) {
        handleError(socket, 'Failed to create lobby', err);
      }
    });

    socket.on('joinLobby', async ({ lobbyId, username }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        activeConnections[socket.id] = { ...activeConnections[socket.id], lobbyId, username };

        socket.join(`lobby:${lobbyId}`);
        
        if (lobby.gameStatus === 'active') {
          lobby.players.push({ username, status: 'spectator'});
          await lobby.save();
        } 
        else {
          lobby.players.push({ username, status: 'waiting'});
          await lobby.save();
        }

        emitToLobby(io, lobbyId, 'playerJoinedLobby', { username, players: lobby.players });
        emitSystemMessage(io, lobbyId, 'playerJoined', `${username} has joined the lobby`);
        
        socket.emit('lobbyData', { ...lobby.toObject() });
      } catch (err) {
        handleError(socket, 'Failed to join lobby', err);
      }
    });
    
    socket.on('getLobby', async ({ lobbyId }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        socket.emit('lobbyData', { ...lobby.toObject() });
      } catch (err) {
        handleError(socket, 'Failed to get lobby data', err);
      }
    });

    socket.on('submitSecretNumber', async ({ lobbyId, username, number }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        if (!isValidNumber(number, lobby.numberLength)) {
          socket.emit('error', { message: `Number must be ${lobby.numberLength} digits` });
          return;
        }
        
        const playerIndex = lobby.players.findIndex(p => p.username === username);
        if (playerIndex === -1) {
          socket.emit('error', { message: 'Player not found in lobby' });
          return;
        }
        
        lobby.players[playerIndex].number = number;
        lobby.players[playerIndex].status = 'ready';
        
        await lobby.save();
        
        emitToLobby(io, lobbyId, 'playerReady', { username, players: lobby.players });
        
        if (allPlayersReady(lobby)) {
          socket.emit('allPlayersReady', { lobbyId });
        }
      } catch (err) {
        handleError(socket, 'Failed to submit number', err);
      }
    });

    socket.on('startGame', async ({ lobbyId }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        const startResult = await startGame(lobby);
        if (!startResult.success) {
          socket.emit('error', { message: startResult.error || 'Failed to start game' });
          return;
        }
        
        emitToLobby(io, lobbyId, 'gameStarted', { players: lobby.players, currentTurn: lobby.currentTurn, targetPlayer: lobby.targetPlayer, gameStatus: lobby.gameStatus });
        emitSystemMessage(io, lobbyId, 'gameStarted', `The game has started! ${lobby.targetPlayer}'s number is being targeted. It's ${lobby.currentTurn}'s turn to make a guess.`);
      } catch (err) {
        handleError(socket, 'Failed to start game', err);
      }
    });

    socket.on('getGameState', async ({ lobbyId }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        if (lobby.gameStatus !== 'active') {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }
        
        socket.emit('gameState', { 
          players: lobby.players,
          currentTurn: lobby.currentTurn,
          targetPlayer: lobby.targetPlayer,
          guesses: lobby.guesses
        });
        
        emitToLobby(io, lobbyId, 'turnInfo', { currentTurn: lobby.currentTurn, targetPlayer: lobby.targetPlayer });
      } catch (err) {
        handleError(socket, 'Failed to get game state', err);
      }
    });

    socket.on('makeGuess', async ({ lobbyId, fromPlayer, toPlayer, guessedNumber }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        const targetPlayer = lobby.players.find(p => p.username === toPlayer);
        
        if (!isValidNumber(guessedNumber, lobby.numberLength)) {
          socket.emit('error', { message: `Guess must be ${lobby.numberLength} digits` });
          return;
        }
        
        const result = await handlePlayerGuess(io, lobby, fromPlayer, toPlayer, guessedNumber);
        
        if (result.error) {
          socket.emit('error', { message: result.error });
          return;
        }
        
        await lobby.save();
        
        emitToLobby(io, lobbyId, 'guessResult', { 
          guess: result.guess, 
          exactMatches: result.exactMatches, 
          isCorrect: result.isCorrect,
          currentTurn: lobby.currentTurn,
          targetPlayer: lobby.targetPlayer,
          players: lobby.players, 
          gameStatus: lobby.gameStatus
        });
      } catch (err) {
        handleError(socket, 'Failed to process guess', err);
      }
    });

    socket.on('leaveLobby', async ({ lobbyId, username }) => {
      try {
        const userData = { lobbyId, username };
        
        await disconnectPlayer(io, userData);
        
        if (activeConnections[socket.id])
          activeConnections[socket.id] = { connected: true, username: username};
        
        socket.leave(`lobby:${lobbyId}`);
      } catch (err) {
        handleError(socket, 'Failed to leave lobby', err);
      }
    });

    socket.on('sendChatMessage', ({ lobbyId, message }) => {
      const userData = activeConnections[socket.id];
      if (!userData || !userData.username || !lobbyId) return;
      
      emitToLobby(io, lobbyId, 'chatMessage', { sender: userData.username, message });
    });

    socket.on('disconnect', async () => {
      const userData = activeConnections[socket.id];
      
      if (userData && userData.lobbyId) {
        try {
          await disconnectPlayer(io, userData);
        } catch (err) {
          console.error('Error handling disconnect:', err);
        }
      }
      
      delete activeConnections[socket.id];
    });
  });
}