const path = require('path');
const UploadedFile = require('../classes/UploadedFile');
const csvUpload = require('../middleware/csvUpload');

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

      const fileId = path.parse(req.file.filename).name;
      const uploadedFile = new UploadedFile(
        req.file.originalname,
        req.file.size,
        fileId,
        req.file.filename
      );

      return res.status(201).json(uploadedFile.toJson());
    });
  }
}

module.exports = UploadController;
