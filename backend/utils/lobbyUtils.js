import Lobby from '../models/Lobby.js';
import { isGameOver, getWinner, advanceToNextTurn, calculateExactMatches } from './gameUtils.js';
import { emitToLobby, emitSystemMessage } from './socketUtils.js';

export async function findLobby(socket, lobbyId) {
    if (!lobbyId) {
        if (socket) socket.emit('error', { message: 'Lobby ID is required' });
        return null;
    }

    const lobby = await Lobby.findOne({ lobbyId });
    if (!lobby) {
        if (socket) socket.emit('error', { message: 'Lobby not found' });
        return null;
    }

    return lobby;
}

export async function startGame(io, lobby) {
    lobby.gameStatus = 'active';
    lobby.players.forEach(p => { 
        if (p.status === 'ready') {
            p.status = 'playing';
        }
    });

    lobby.guesses = [];

    await lobby.save();
}
export function eliminatePlayer(io, lobby, fromPlayer, toPlayer, guessedNumber) {
    const targetIndex = lobby.players.findIndex(p => p.username === toPlayer);
    if (targetIndex === -1) return false;

    lobby.players[targetIndex].status = 'eliminated';

    emitToLobby(io, lobby.lobbyId, 'playerEliminated', { username: toPlayer, eliminatedBy: fromPlayer, players: lobby.players });
    emitSystemMessage(io, lobby.lobbyId, 'playerEliminated', `${fromPlayer} correctly guessed ${toPlayer}'s number (${guessedNumber})! ${toPlayer} has been eliminated.`);

    if (isGameOver(lobby))
        endGame(io, lobby);

    return true;
}
export async function disconnectPlayer(io, userData) {
    const lobby = await findLobby(null, userData.lobbyId);
    if (!lobby) return;

    lobby.players = lobby.players.filter(p => p.username !== userData.username);

    if (lobby.players.length === 0) {
        await Lobby.deleteOne({ lobbyId: userData.lobbyId });
        return;
    }

    if (lobby.gameStatus === 'active' && isGameOver(lobby)) {
        endGame(io, lobby);
    }

    await lobby.save();

    emitToLobby(io, userData.lobbyId, 'playerLeft', { username: userData.username, players: lobby.players });
    emitSystemMessage(io, userData.lobbyId, 'playerLeft', `${userData.username} has left the lobby`);
}
export function endGame(io, lobby) {
    lobby.gameStatus = 'completed';
    const winner = getWinner(lobby);

    lobby.players.forEach(player => {
        if (player.status === 'spectator') {
            player.status = 'waiting';
        }
    });

    emitToLobby(io, lobby.lobbyId, 'gameOver', { winner, lobby });
    emitSystemMessage(io, lobby.lobbyId, 'gameOver', winner ? `Game over! ${winner} is the winner!` : 'Game over! No players remain.');
}

export async function handlePlayerGuess(io, lobby, fromPlayer, toPlayer, guessedNumber) {
    try {
        const targetPlayer = lobby.players.find(p => p.username === toPlayer);
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
        
        if (lobby.gameStatus === 'active') {
            advanceToNextTurn(lobby);            
            emitToLobby(io, lobby.lobbyId, 'turnChange', { username: lobby.currentTurn, targetPlayer: lobby.targetPlayer });
        }
        
        return { guess: newGuess, exactMatches, isCorrect, gameStatus: lobby.gameStatus };
    } catch (err) {
        console.error('Error handling guess:', err);
        return { error: 'Failed to process guess' };
    }
}

