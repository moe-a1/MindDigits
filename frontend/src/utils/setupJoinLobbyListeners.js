
export function setupSocketOperation(socket, emitEvent, emitData, successEvent, errorMessage = 'Socket operation failed') {
  return new Promise((resolve, reject) => {
    if (!socket) {
      return reject(new Error('Socket connection not established'));
    }

    const onSuccess = (data) => {
      cleanup();
      resolve(data);
    };

    const onError = (error) => {
      cleanup();
      reject(error.message || errorMessage);
    };
    
    const cleanup = () => {
      socket.off(successEvent, onSuccess);
      socket.off('error', onError);
    };

    socket.emit(emitEvent, emitData);
    
    socket.once(successEvent, onSuccess);
    socket.once('error', onError);
  });
}


export function setupCreateLobbyListeners(socket, data) {
  return setupSocketOperation(socket, 'createLobby', data, 'lobbyCreated', 'Failed to create lobby');
}

export function setupJoinLobbyListeners(socket, data) {
  return setupSocketOperation(socket, 'joinLobby', data, 'lobbyData', 'Failed to join lobby');
}

export function setupGetLobbyListeners(socket, data) {
  return setupSocketOperation(socket, 'getLobby', data, 'lobbyData', 'Failed to get lobby data');
}