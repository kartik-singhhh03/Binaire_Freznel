const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const UploadedFile = require('../classes/UploadedFile');
const Job = require('../classes/Job');
const csvUpload = require('../middleware/csvUpload');
const queueManager = require('../queueManagerInstance');
const workerManager = require('../workerManagerInstance');
const { emitJobEvent } = require('../realtime/socketHub');

function normalizePriority(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return {
      ok: false,
      message: 'Priority is required. Use high or low.'
    };
  }

  const priority = String(value).trim().toUpperCase();

  if (priority !== 'HIGH' && priority !== 'LOW') {
    return {
      ok: false,
      message: 'Priority must be high or low.'
    };
  }

  return {
    ok: true,
    priority: priority
  };
}

function getOrCreateClientId(value) {
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    return String(value).trim();
  }

  return crypto.randomUUID();
}

class UploadController {
  handleUpload(req, res) {
    const uploadSingleCsv = csvUpload.single('csvFile');

    uploadSingleCsv(req, res, function (error) {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file was uploaded.'
        });
      }

      const priorityResult = normalizePriority(req.body.priority);

      if (!priorityResult.ok) {
        fs.unlink(req.file.path, function () {});
        return res.status(400).json({
          success: false,
          message: priorityResult.message
        });
      }

      const fileId = path.parse(req.file.filename).name;
      const uploadedFile = new UploadedFile(
        req.file.originalname,
        req.file.size,
        fileId,
        req.file.filename
      );
      const clientId = getOrCreateClientId(req.body.clientId);
      const job = new Job(
        uploadedFile.fileId,
        uploadedFile.originalName,
        req.file.path,
        clientId,
        priorityResult.priority
      );

      emitJobEvent('job:created', job);
      queueManager.addJob(job);
      emitJobEvent('job:waiting', job);
      workerManager.startAvailableJobs();

      return res.status(201).json(job.toUploadResponse());
    });
  }
}

module.exports = UploadController;
