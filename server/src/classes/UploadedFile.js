class UploadedFile {
  constructor(originalName, size, fileId, storedFileName) {
    this.originalName = originalName;
    this.size = size;
    this.fileId = fileId;
    this.storedFileName = storedFileName;
  }

  toJson() {
    return {
      success: true,
      originalFileName: this.originalName,
      uploadedFileSize: this.size,
      fileId: this.fileId
    };
  }
}

module.exports = UploadedFile;
