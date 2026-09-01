class Job {
  constructor(jobId, originalFileName, filePath, clientId, priority) {
    this.jobId = jobId;
    this.originalFileName = originalFileName;
    this.filePath = filePath;
    this.clientId = clientId;
    this.priority = priority;
    this.status = 'UPLOADED';
    this.progress = 0;
    this.result = null;
    this.error = null;
    this.workerId = null;
    this.createdAt = new Date().toISOString();
  }

  toUploadResponse() {
    return {
      success: true,
      jobId: this.jobId,
      originalFileName: this.originalFileName,
      clientId: this.clientId,
      priority: this.priority,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  toQueueItem() {
    return {
      jobId: this.jobId,
      originalFileName: this.originalFileName,
      clientId: this.clientId,
      priority: this.priority,
      status: this.status,
      progress: this.progress,
      createdAt: this.createdAt
    };
  }

  toPublicStatus() {
    return {
      jobId: this.jobId,
      originalFileName: this.originalFileName,
      clientId: this.clientId,
      priority: this.priority,
      status: this.status,
      progress: this.progress,
      workerId: this.workerId,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt
    };
  }
}

module.exports = Job;
