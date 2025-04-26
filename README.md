# MindDigits

MindDigits is an interactive multiplayer number guessing game where players try to deduce each other's secret numbers while protecting their own. The game combines strategy, deduction, and a bit of luck as players take turns making guesses about their opponents' numbers.

**Play now at: [mind-digits.vercel.app](https://mind-digits.vercel.app)**

## Table of Contents
- [Game Overview](#game-overview)
- [Features](#features)
- [Game Rules](#game-rules)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)

## Game Overview

MindDigits is a turn-based guessing game where players:
1. Choose a secret number (3-6 digits)
2. Take turns guessing other players' numbers
3. Receive feedback on how many digits they got correct in the right position
4. Aim to be the last player standing by correctly guessing others' numbers without having their own number guessed

The game supports up to 5 active players and includes real-time chat and drawing features for an enhanced multiplayer experience.

## Features

- **Secure Lobbies**: Create or join private game lobbies with unique IDs
- **Real-time Gameplay**: Instant updates using WebSocket communication
- **In-game Chat**: Chat with other players while in lobbies
- **Drawing Canvas**: Personal drawing canvas for taking notes during gameplay
- **Player Elimination**: Players are eliminated when their number is correctly guessed
- **Spectator Mode**: Join ongoing games as a spectator

## Game Rules

1. **Joining the Game**:
   - Create a new lobby or join an existing one using a lobby ID
   - Choose a username to identify yourself

2. **Game Setup**:
   - Choose a secret number (3-6 digits depending on lobby settings)
   - Wait for all players to submit their numbers and get ready

3. **Gameplay**:
   - Players take turns guessing each other's numbers
   - After each guess, you receive feedback on how many digits are correct and in the right position
   - Use this feedback to deduce your opponents' numbers through logical deduction
   - When it's your turn, you must guess another player's number

4. **Elimination**:
   - When a player's number is correctly guessed, they are eliminated
   - Eliminated players can still watch the game but cannot make guesses
   - The last player standing wins the game

5. **Drawing and Communication**:
   - Use the lobby chat to coordinate with other players before the game starts
   - Use the drawing canvas to sketch notes or visualize your thoughts during the game
   - The drawing canvas is personal to each player and not shared with others

## Technology Stack

MindDigits is built with the **MERN Stack** (MongoDB, Express, React, Node.js), featuring:

- **Frontend**: React with React Router for navigation and modern CSS for styling
- **Backend**: Node.js with Express providing the API foundation
- **Real-time Communication**: Socket.IO implementing WebSockets for instant gameplay updates and chat
- **Database**: MongoDB for data persistence with Mongoose
- **Utilities**: UUID for generating unique lobby identifiers

## Project Structure

```
MindDigits/
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context for state management
│   │   ├── styles/        # CSS stylesheets
│   │   └── utils/         # Utility functions
│   └── package.json       # Frontend dependencies
│
└── backend/               # Node.js backend server
    ├── models/            # MongoDB models
    ├── socket/            # Socket.IO event handlers
    ├── utils/             # Backend utility functions
    ├── index.js           # Server entry point
    └── package.json       # Backend dependencies
```
