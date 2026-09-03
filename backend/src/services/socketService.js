import { Server as SocketIOServer } from 'socket.io';

let ioInstance = null;

/**
 * Initializes Socket.IO server on Express HTTP server instance.
 */
export function initSocketServer(httpServer) {
  if (ioInstance) return ioInstance;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    // Join room for a specific deal
    socket.on('join:deal', (dealId) => {
      if (dealId) {
        socket.join(`deal:${dealId}`);
      }
    });

    socket.on('leave:deal', (dealId) => {
      if (dealId) {
        socket.leave(`deal:${dealId}`);
      }
    });

    // Join room for a voice session
    socket.on('join:session', (sessionId) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean teardown handled by socket.io
    });
  });

  return ioInstance;
}

/**
 * Returns active Socket.IO server instance.
 */
export function getIo() {
  return ioInstance;
}

/**
 * Emits deal state update event to all subscribers of deal:${dealId}.
 */
export function emitDealUpdate(dealId, payload) {
  if (ioInstance && dealId) {
    ioInstance.to(`deal:${dealId}`).emit('deal:updated', payload);
    ioInstance.emit('deal:broadcast_updated', payload);
  }
}

/**
 * Emits live conversation transcript event.
 */
export function emitTranscriptTurn(sessionId, turnData) {
  if (ioInstance && sessionId) {
    ioInstance.to(`session:${sessionId}`).emit('conversation:transcript', turnData);
    ioInstance.emit('conversation:broadcast_transcript', turnData);
  }
}
