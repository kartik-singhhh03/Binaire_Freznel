const express = require('express');
const queueManager = require('../queueManagerInstance');

const router = express.Router();

router.get('/:jobId', function (req, res) {
  const job = queueManager.getJobById(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found.'
    });
  }

  res.json({
    success: true,
    job: job.toPublicStatus()
  });
});

module.exports = router;
