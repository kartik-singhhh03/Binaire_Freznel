const path = require('path');
const { Worker } = require('worker_threads');

const MAX_CONCURRENT_JOBS = 2;
const WORKER_TIMEOUT_MS = 30000;
const CSV_WORKER_PATH = path.join(__dirname, '../workers/csvWorker.js');

class WorkerManager {
  constructor(queueManager) {
    this.queueManager = queueManager;
    this.activeWorkers = new Map();
    this.maxConcurrentJobs = MAX_CONCURRENT_JOBS;
    this.workerTimeoutMs = WORKER_TIMEOUT_MS;
  }

  startAvailableJobs() {
    while (this.activeWorkers.size < this.maxConcurrentJobs && this.queueManager.hasJobs()) {
      const job = this.queueManager.getNextJob();

      if (!job) {
        break;
      }

      this.startJob(job);
    }
  }

  startJob(job) {
    job.status = 'PROCESSING';
    job.progress = 0;
    job.error = null;
    job.result = null;

    const worker = new Worker(CSV_WORKER_PATH, {
      workerData: {
        filePath: job.filePath
      }
    });

    job.workerId = worker.threadId;

    const timeoutId = setTimeout(function () {
      this.handleTimeout(job);
    }.bind(this), this.workerTimeoutMs);

    this.activeWorkers.set(job.jobId, {
      worker: worker,
      timeoutId: timeoutId
    });

    const workerManager = this;

    worker.on('message', function (message) {
      workerManager.handleWorkerMessage(job, message);
    });

    worker.on('error', function (error) {
      workerManager.failJob(job, error.message, false);
    });

    worker.on('exit', function (exitCode) {
      workerManager.handleWorkerExit(job, exitCode);
    });
  }

  handleWorkerMessage(job, message) {
    if (message.type === 'progress') {
      job.progress = message.progress;
      return;
    }

    if (message.type === 'completed') {
      this.completeJob(job, message.result);
      return;
    }

    if (message.type === 'failed') {
      this.failJob(job, message.error, false);
    }
  }

  handleTimeout(job) {
    this.failJob(
      job,
      'Worker timed out after ' + this.workerTimeoutMs + 'ms.',
      true
    );
  }

  handleWorkerExit(job, exitCode) {
    if (!this.activeWorkers.has(job.jobId)) {
      return;
    }

    this.failJob(job, 'Worker stopped unexpectedly. Exit code: ' + exitCode + '.', false);
  }

  completeJob(job, result) {
    const worker = this.releaseWorkerSlot(job.jobId);

    if (!worker) {
      return;
    }

    job.status = 'COMPLETED';
    job.progress = 100;
    job.result = result;
    this.startAvailableJobs();
  }

  failJob(job, errorMessage, shouldTerminate) {
    const worker = this.releaseWorkerSlot(job.jobId);

    if (!worker) {
      return;
    }

    job.status = 'FAILED';
    job.error = errorMessage;

    if (shouldTerminate) {
      worker.terminate();
    }

    this.startAvailableJobs();
  }

  releaseWorkerSlot(jobId) {
    const active = this.activeWorkers.get(jobId);

    if (!active) {
      return null;
    }

    clearTimeout(active.timeoutId);
    this.activeWorkers.delete(jobId);
    return active.worker;
  }
}

module.exports = WorkerManager;
