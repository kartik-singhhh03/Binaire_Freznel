class QueueManager {
  constructor() {
    this.highPriorityQueue = [];
    this.lowPriorityQueue = [];
    this.jobsById = new Map();
    this.consecutiveHighJobs = 0;
    // After 3 HIGH jobs in a row, take 1 LOW job so LOW jobs cannot wait forever.
    this.highJobsBeforeLow = 3;
  }

  addJob(job) {
    job.status = 'QUEUED';
    this.jobsById.set(job.jobId, job);

    if (job.priority === 'HIGH') {
      this.highPriorityQueue.push(job);
    } else {
      this.lowPriorityQueue.push(job);
    }

    job.status = 'WAITING';
  }

  getJobById(jobId) {
    return this.jobsById.get(jobId) || null;
  }

  getAllPublicJobs() {
    const jobs = [];

    this.jobsById.forEach(function (job) {
      jobs.push(job.toPublicStatus());
    });

    return jobs;
  }

  hasJobs() {
    return this.highPriorityQueue.length > 0 || this.lowPriorityQueue.length > 0;
  }

  getNextJob() {
    if (!this.hasJobs()) {
      return null;
    }

    if (this.shouldSelectLowJob(this.highPriorityQueue, this.lowPriorityQueue, this.consecutiveHighJobs)) {
      this.consecutiveHighJobs = 0;
      return this.lowPriorityQueue.shift();
    }

    this.consecutiveHighJobs += 1;
    return this.highPriorityQueue.shift();
  }

  getQueueInProcessingOrder() {
    const highCopy = this.highPriorityQueue.slice();
    const lowCopy = this.lowPriorityQueue.slice();
    let consecutiveHigh = this.consecutiveHighJobs;
    const orderedJobs = [];

    while (highCopy.length > 0 || lowCopy.length > 0) {
      if (this.shouldSelectLowJob(highCopy, lowCopy, consecutiveHigh)) {
        consecutiveHigh = 0;
        orderedJobs.push(lowCopy.shift());
      } else {
        consecutiveHigh += 1;
        orderedJobs.push(highCopy.shift());
      }
    }

    return orderedJobs;
  }

  shouldSelectLowJob(highQueue, lowQueue, consecutiveHighJobs) {
    if (lowQueue.length === 0) {
      return false;
    }

    if (highQueue.length === 0) {
      return true;
    }

    if (consecutiveHighJobs >= this.highJobsBeforeLow) {
      return true;
    }

    return false;
  }
}

module.exports = QueueManager;
