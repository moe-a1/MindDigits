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
  return (
    lobby.players.length >= 2 && 
    lobby.players.every(p => p.status === 'ready')
  );
}

export function formatTimestamp() {
  return new Date().toISOString();
}
