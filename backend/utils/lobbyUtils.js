import Lobby from '../models/Lobby.js';
import { isGameOver, getWinner, advanceToNextTurn, calculateExactMatches, initializeTurnSystem, getActivePlayers, advanceToNextTarget } from './gameUtils.js';
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

export async function startGame(lobby) {
    lobby.gameStatus = 'active';
    lobby.players.forEach(p => { 
        if (p.status === 'ready') {
            p.status = 'playing';
        }
    });

    lobby.guesses = [];

    const initializeStatus = initializeTurnSystem(lobby);
    if (!initializeStatus) {
        return { success: false, error: 'Failed to initialize game turns' };
    }

    await lobby.save();
    return { success: true };
}
export function eliminatePlayer(io, lobby, fromPlayer, toPlayer, guessedNumber) {
    const targetIndex = lobby.players.findIndex(p => p.username === toPlayer);
    if (targetIndex === -1) return false;

    lobby.players[targetIndex].status = 'eliminated';

    if (lobby.currentTurn === toPlayer) {
        advanceToNextTurn(lobby);
    }

    if (lobby.targetPlayer === toPlayer) {
        const activePlayers = getActivePlayers(lobby);
        advanceToNextTarget(lobby, activePlayers);
    }

    emitToLobby(io, lobby.lobbyId, 'playerEliminated', { username: toPlayer, eliminatedBy: fromPlayer, players: lobby.players });
    //emitSystemMessage(io, lobby.lobbyId, 'playerEliminated', `${fromPlayer} correctly guessed ${toPlayer}'s number (${guessedNumber})! ${toPlayer} has been eliminated.`);

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

    if (lobby.gameStatus === 'active') {
        const activePlayers = getActivePlayers(lobby);
        
        if (isGameOver(lobby)) {
            endGame(io, lobby);
        }
        else if (lobby.currentTurn === userData.username) {
            advanceToNextTurn(lobby);
            emitToLobby(io, userData.lobbyId, 'turnChange', { username: lobby.currentTurn, targetPlayer: lobby.targetPlayer });
        } 
        else if (lobby.targetPlayer === userData.username) {
            advanceToNextTarget(lobby, activePlayers);
            emitToLobby(io, userData.lobbyId, 'turnChange', { username: lobby.currentTurn, targetPlayer: lobby.targetPlayer });
        }
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
    //emitSystemMessage(io, lobby.lobbyId, 'gameOver', winner ? `Game over! ${winner} is the winner!` : 'Game over! No players remain.');
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

export async function resetLobbyAfterGame(io, lobby, username, socket) {
    if (lobby.gameStatus === 'completed') {
        lobby.players.forEach(player => {
            player.status = 'waiting';
            player.number = null;
        });
        
        lobby.gameStatus = 'waiting';
        lobby.targetPlayer = null;
        lobby.targetSequence = [];
        lobby.currentTurn = null;
        lobby.guessingPlayers = [];
        lobby.guessingOrders = {};
        lobby.currentGuessingIndex = 0;
        lobby.currentTargetIndex = 0;
        lobby.currentRound = 1;
        lobby.guesses = [];

        //emitSystemMessage(io, lobby.lobbyId, 'gameReset', 'The game has been reset. Submit your numbers to play again!');
    }

    await lobby.save();

    const updatedLobby = await findLobby(socket, lobby.lobbyId);
    emitToLobby(io, lobby.lobbyId, 'lobbyUpdated', updatedLobby.toObject());

    return updatedLobby;
}

