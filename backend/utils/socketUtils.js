
export function formatTimestamp() {
  return new Date().toISOString();
}
  
export function emitToLobby(io, lobbyId, event, data) {
    io.to(`lobby:${lobbyId}`).emit(event, {
        ...data,
        timestamp: formatTimestamp()
    });
}
export function emitSystemMessage(io, lobbyId, type, content) {
    emitToLobby(io, lobbyId, 'systemMessage', { type, content });
}
export function handleError(socket, message, err) {
    console.error(`${message}:`, err);
    socket.emit('error', { message, timestamp: formatTimestamp() });
}
