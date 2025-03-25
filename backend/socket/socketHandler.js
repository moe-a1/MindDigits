import { calculateExactMatches, allPlayersReady, isValidNumber } from '../utils/utils.js';
import { findLobby, emitToLobby, emitSystemMessage, handleError, startGame, eliminatePlayer, disconnectPlayer } from '../utils/socketUtils.js';

export default function setupSocketHandlers(io) {
  const activeConnections = {};

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    activeConnections[socket.id] = { connected: true };

    socket.on('joinLobby', async ({ lobbyId, username }) => {
      try {
        const lobby = await findLobby(socket, lobbyId);
        if (!lobby) return;
        
        activeConnections[socket.id] = { ...activeConnections[socket.id], lobbyId, username };

        socket.join(`lobby:${lobbyId}`);
        lobby.players.push({ username, status: 'waiting'});
        await lobby.save();
        
        emitToLobby(io, lobbyId, 'playerJoinedLobby', { username, players: lobby.players });
        emitSystemMessage(io, lobbyId, 'playerJoined', `${username} has joined the lobby`);
        socket.emit('lobbyData', { ...lobby.toObject() });
      } catch (err) {
        handleError(socket, 'Failed to join lobby', err);
      }
    });

    socket.on('submitNumber', async ({ lobbyId, username, number }) => {
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
        
        emitToLobby(io, lobbyId, 'playerReady', { username, players: lobby.players});
        
        if (allPlayersReady(lobby)) 
          startGame(io, lobby);
      } catch (err) {
        handleError(socket, 'Failed to submit number', err);
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
        
        const exactMatches = calculateExactMatches(targetPlayer.number, guessedNumber);
        const isCorrect = exactMatches === lobby.numberLength;
        
        const newGuess = {
          fromPlayer,
          toPlayer,
          guessedNumber,
          exactMatches
        };
        
        lobby.guesses.push(newGuess);
        
        if (isCorrect) {
          eliminatePlayer(io, lobby, fromPlayer, toPlayer, guessedNumber);
        }
        
        await lobby.save();
        
        emitToLobby(io, lobbyId, 'guessResult', { guess: newGuess, exactMatches, isCorrect,
          players: lobby.players, gameStatus: lobby.gameStatus
        });
        
        if (!isCorrect) {
          emitSystemMessage(io, lobbyId, 'guessResult', 
            `${fromPlayer} guessed ${exactMatches} correct digits in correct position in ${toPlayer}'s number.`);
        }
      } catch (err) {
        handleError(socket, 'Failed to process guess', err);
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
      console.log('Client disconnected:', socket.id);
    });
  });
}