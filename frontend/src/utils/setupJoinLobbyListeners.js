export function setupJoinLobbyListeners(socket) {
  return new Promise((resolve, reject) => {

    const onLobbyData = (data) => {
      cleanup();
      resolve(data);
    };

    const onError = (error) => {
      cleanup();
      reject(error.message || 'Failed to join lobby');
    };
    
    const cleanup = () => {
      socket.off('lobbyData', onLobbyData);
      socket.off('error', onError);
    };

    socket.once('lobbyData', onLobbyData);
    socket.once('error', onError);
  });
}