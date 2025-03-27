import express from 'express';
import Lobby from '../models/Lobby.js';
import { generateLobbyId } from '../utils/gameUtils.js';

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
      players: []
    });
    
    const newLobby = await lobby.save();
    res.status(201).json(newLobby);
  } catch (err) {
    console.error('Error creating lobby:', err);
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ lobbyId: req.params.id });
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    res.status(200).json(lobby);
  } catch (err) {
    console.error('Error fetching lobby:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
