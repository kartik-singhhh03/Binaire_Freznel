const queueManager = require('./queueManagerInstance');
const WorkerManager = require('./classes/WorkerManager');

const workerManager = new WorkerManager(queueManager);

module.exports = workerManager;
