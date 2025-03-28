import { v4 as uuidv4 } from 'uuid';

export function generateLobbyId() {
    return uuidv4().substring(0, 8).toUpperCase();
}

export function isDigitsOnly(str) {
    return /^\d+$/.test(str);
}
export function isValidNumber(number, length) {
    return isDigitsOnly(number) && number.length === length;
}
export function calculateExactMatches(secretNumber, guessedNumber) {
    let exactMatches = 0;
    for (let i = 0; i < secretNumber.length; i++) {
        if (secretNumber[i] === guessedNumber[i]) {
            exactMatches++;
        }
    }
    return exactMatches;
}

export function getActivePlayers(lobby) {
    return lobby.players.filter(p => p.status === 'playing');
}
export function isGameOver(lobby) {
    return getActivePlayers(lobby).length <= 1;
}
export function getWinner(lobby) {
    const activePlayers = getActivePlayers(lobby);
    return activePlayers.length === 1 ? activePlayers[0].username : null;
}
export function allPlayersReady(lobby) {
    return lobby.players.length >= 2 && lobby.players.every(p => p.number && p.status === 'ready');
}

export function initializeTurnSystem(lobby) {
    const activePlayers = getActivePlayers(lobby);
    
    lobby.targetSequence = [...activePlayers].map(p => p.username);
    fisherYatesShuffle(lobby.targetSequence);
    
    lobby.currentRound = 1;
    lobby.currentTargetIndex = 0;
    lobby.targetPlayer = lobby.targetSequence[0];
    
    lobby.guessingOrders = {};
    
    setupGuessingOrder(lobby, activePlayers);
    
    return true;
}
function setupGuessingOrder(lobby, activePlayers) {
    const targetPlayer = lobby.targetPlayer;
    
    if (!lobby.guessingOrders[targetPlayer]) {
        const guessers = activePlayers.filter(p => p.username !== targetPlayer).map(p => p.username);
        lobby.guessingOrders[targetPlayer] = guessers;
    } 
    else {
        lobby.guessingOrders[targetPlayer] = lobby.guessingOrders[targetPlayer].filter(username => activePlayers.some(p => p.username === username));
    }
    
    lobby.guessingPlayers = [...lobby.guessingOrders[targetPlayer]];
    lobby.currentGuessingIndex = 0;
    
    lobby.currentTurn = lobby.guessingPlayers.length > 0 ? lobby.guessingPlayers[0] : null;
}

export function advanceToNextTurn(lobby) {
    const activePlayers = getActivePlayers(lobby);
    
    lobby.currentGuessingIndex = (lobby.currentGuessingIndex + 1) % lobby.guessingPlayers.length;
    
    if (lobby.currentGuessingIndex === 0) {
        advanceToNextTarget(lobby, activePlayers);
    } else {
        lobby.currentTurn = lobby.guessingPlayers[lobby.currentGuessingIndex];
    }
}
function advanceToNextTarget(lobby, activePlayers) {
    lobby.currentTargetIndex = (lobby.currentTargetIndex + 1) % lobby.targetSequence.length;
    
    if (lobby.currentTargetIndex === 0) {
        lobby.currentRound++;
    }
    
    let nextTarget = lobby.targetSequence[lobby.currentTargetIndex];
    
    while (!activePlayers.some(p => p.username === nextTarget)) {
        lobby.currentTargetIndex = (lobby.currentTargetIndex + 1) % lobby.targetSequence.length;
        
        if (lobby.currentTargetIndex === 0) {
            lobby.currentRound++;
        }
        
        nextTarget = lobby.targetSequence[lobby.currentTargetIndex];
    }
    
    lobby.targetPlayer = nextTarget;
    setupGuessingOrder(lobby, activePlayers);
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const random = Math.floor(Math.random() * (i + 1));
        [array[i], array[random]] = [array[random], array[i]];
    }
}
