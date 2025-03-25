import express from 'express';
import Lobby from '../models/Lobby.js';
import { calculateExactMatches, generateLobbyId, isValidNumber, getActivePlayers } from '../utils/utils.js';

const router = express.Router();

router.post('/create-lobby', async (req, res) => {
  const { name, createdBy, numberLength = 4 } = req.body;
  
  if (!name || !createdBy) {
    return res.status(400).json({ message: 'Name and creator are required' });
  }
  
  try {
    const lobby = new Lobby({
      lobbyId: generateLobbyId(),
      name,
      createdBy,
      numberLength,
      players: [{ username: createdBy }]
    });
    
    const newLobby = await lobby.save();
    res.status(201).json(newLobby);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/join-lobby', async (req, res) => {
  const { lobbyId, username } = req.body;
  
  if (!lobbyId || !username) {
    return res.status(400).json({ message: 'Lobby ID and username are required' });
  }
  
  try {
    const lobby = await Lobby.findOne({ lobbyId });
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    if (lobby.gameStatus !== 'waiting') {
      return res.status(400).json({ message: 'Game has already started or ended' });
    }
    
    if (lobby.players.some(p => p.username === username)) {
      return res.status(400).json({ message: 'Username already taken in this lobby' });
    }
    
    lobby.players.push({ username });
    await lobby.save();
    res.json(lobby);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/submit-number', async (req, res) => {
  const { lobbyId, username, number } = req.body;
  
  if (!lobbyId || !username || !number) {
    return res.status(400).json({ message: 'Lobby ID, username, and number are required' });
  }
  
  try {
    const lobby = await Lobby.findOne({ lobbyId });
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    const playerIndex = lobby.players.findIndex(p => p.username === username);
    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Player not found in lobby' });
    }
    
    if (!isValidNumber(number, lobby.numberLength)) {
      return res.status(400).json({ message: `Number must be ${lobby.numberLength} digits` });
    }
    
    lobby.players[playerIndex].number = number;
    lobby.players[playerIndex].status = 'ready';
    
    if (allPlayersReady(lobby)) {
      lobby.gameStatus = 'active';
      lobby.players.forEach(p => { p.status = 'playing'; });
    }
    
    await lobby.save();
    res.json({ message: 'Number submitted successfully', gameStatus: lobby.gameStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/guess-number', async (req, res) => {
  const { lobbyId, fromPlayer, toPlayer, guessedNumber } = req.body;
  
  if (!lobbyId || !fromPlayer || !toPlayer || !guessedNumber) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    const lobby = await Lobby.findOne({ lobbyId });
    
    if (!lobby || lobby.gameStatus !== 'active') {
      return res.status(400).json({ message: lobby ? 'Game is not active' : 'Lobby not found' });
    }
    
    const targetPlayer = lobby.players.find(p => p.username === toPlayer);
    if (!targetPlayer || !targetPlayer.number) {
      return res.status(404).json({ message: 'Target player not found or has no number' });
    }
    
    if (!isValidNumber(guessedNumber, lobby.numberLength)) {
      return res.status(400).json({ message: `Guess must be ${lobby.numberLength} digits` });
    }
    
    const exactMatches = calculateExactMatches(targetPlayer.number, guessedNumber);
    
    const newGuess = {
      fromPlayer,
      toPlayer,
      guessedNumber,
      exactMatches
    };
    
    lobby.guesses.push(newGuess);
    
    if (exactMatches === lobby.numberLength) {
      const targetIndex = lobby.players.findIndex(p => p.username === toPlayer);
      if (targetIndex !== -1) {
        lobby.players[targetIndex].status = 'eliminated';
      }
      
      const activePlayers = getActivePlayers(lobby);
      if (activePlayers.length <= 1) {
        lobby.gameStatus = 'completed';
      }
    }
    
    await lobby.save();
    
    res.json({
      exactMatches,
      isCorrect: exactMatches === lobby.numberLength,
      gameStatus: lobby.gameStatus,
      guess: newGuess
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ lobbyId: req.params.id });
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    res.json(lobby);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
