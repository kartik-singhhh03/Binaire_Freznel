const { Server } = require('socket.io');
const queueManager = require('../queueManagerInstance');

let io = null;

function attachSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
    }
  });

  io.on('connection', function (socket) {
    socket.emit('queue:state', {
      jobs: queueManager.getAllPublicJobs()
    });
  });

  return io;
}

function emitJobEvent(eventName, job) {
  if (!io) {
    return;
  }

  io.emit(eventName, {
    job: job.toPublicStatus()
  });
}

module.exports = {
  attachSocketServer,
  emitJobEvent
};
