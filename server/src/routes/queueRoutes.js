const express = require('express');
const queueManager = require('../queueManagerInstance');

const router = express.Router();

router.get('/', function (req, res) {
  const jobs = queueManager.getQueueInProcessingOrder();

  res.json({
    totalJobs: jobs.length,
    jobs: jobs.map(function (job) {
      return job.toQueueItem();
    })
  });
});

module.exports = router;
