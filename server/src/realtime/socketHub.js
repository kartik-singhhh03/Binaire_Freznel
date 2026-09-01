const { Server } = require('socket.io');
const config = require('../config');
const queueManager = require('../queueManagerInstance');

let io = null;

function attachSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_ORIGINS
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
