import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  number: { type: String, default: null },
  status: {
    type: String,
    enum: ['waiting', 'ready', 'playing', 'eliminated', 'spectator'],
    default: 'waiting'
  }
});

const guessSchema = new mongoose.Schema({
  fromPlayer: { type: String, required: true },
  toPlayer: { type: String, required: true },
  guessedNumber: { type: String, required: true },
  exactMatches: { type: Number, required: true }
});

const lobbySchema = new mongoose.Schema({
  lobbyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  players: [playerSchema],
  guesses: [guessSchema],
  gameStatus: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  numberLength: { type: Number, default: 4, min: 3, max: 6 },
  
  targetPlayer: { type: String, default: null },
  targetSequence: { type: [String], default: [] },
  currentTurn: { type: String, default: null },
  guessingPlayers: { type: [String], default: [] },
  guessingOrders: { type: Map, of: [String], default: {} },
  currentGuessingIndex: { type: Number, default: 0 },
  currentTargetIndex: { type: Number, default: 0 },
  currentRound: { type: Number, default: 1 },
  
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

lobbySchema.index({ lobbyId: 1 }, { unique: true });
lobbySchema.index({ gameStatus: 1 });

const Lobby = mongoose.model('Lobby', lobbySchema);

export default Lobby;
