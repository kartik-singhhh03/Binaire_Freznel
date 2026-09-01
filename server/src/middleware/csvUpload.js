const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');

const uploadsDirectory = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadsDirectory);
  },
  filename: function (req, file, callback) {
    const fileId = crypto.randomUUID();
    callback(null, fileId + '.csv');
  }
});

function csvFileFilter(req, file, callback) {
  const fileName = file.originalname.toLowerCase();

  if (fileName.endsWith('.csv')) {
    callback(null, true);
  } else {
    callback(new Error('Only CSV files are allowed.'));
  }
}

const csvUpload = multer({
  storage: storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: config.MAX_UPLOAD_BYTES
  }
});

module.exports = csvUpload;
