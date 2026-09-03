import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Returns or initializes singleton Socket.IO client instance.
 */
export function getSocket() {
  if (!socketInstance) {
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });
  }
  return socketInstance;
}

/**
 * Subscribes to real-time deal state updates.
 */
export function subscribeToDealUpdates(dealId, callback) {
  const socket = getSocket();
  if (dealId) {
    socket.emit('join:deal', dealId);
  }

  const handleUpdate = (data) => {
    if (!dealId || data.dealId === dealId || data._id === dealId) {
      callback(data);
    }
  };

  socket.on('deal:updated', handleUpdate);
  socket.on('deal:broadcast_updated', handleUpdate);

  return () => {
    if (dealId) {
      socket.emit('leave:deal', dealId);
    }
    socket.off('deal:updated', handleUpdate);
    socket.off('deal:broadcast_updated', handleUpdate);
  };
}

/**
 * Subscribes to real-time transcript turn events.
 */
export function subscribeToTranscript(sessionId, callback) {
  const socket = getSocket();
  if (sessionId) {
    socket.emit('join:session', sessionId);
  }

  const handleTranscript = (data) => {
    callback(data);
  };

  socket.on('conversation:transcript', handleTranscript);
  socket.on('conversation:broadcast_transcript', handleTranscript);

  return () => {
    socket.off('conversation:transcript', handleTranscript);
    socket.off('conversation:broadcast_transcript', handleTranscript);
  };
}
