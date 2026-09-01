const express = require('express');
const UploadController = require('../controllers/UploadController');

const router = express.Router();
const uploadController = new UploadController();

router.post('/', function (req, res) {
  uploadController.handleUpload(req, res);
});

module.exports = router;
