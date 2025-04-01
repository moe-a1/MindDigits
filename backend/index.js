import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import setupSocketHandlers from './socket/socketHandler.js';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { dbName: 'MindDigits' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  }
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
