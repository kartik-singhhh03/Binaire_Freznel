import { useRef, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import './CsvUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CsvUpload({ clientId, onLocalJob }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [priority, setPriority] = useState('high');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function useCsvFile(file) {
    if (!file) {
      return;
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv')) {
      setErrorMessage('Please choose a CSV file.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setUploadStatus('');
  }

  function handleFileChange(event) {
    useCsvFile(event.target.files[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    useCsvFile(event.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    formData.append('priority', priority);
    formData.append('clientId', clientId);

    setIsUploading(true);
    setErrorMessage('');
    setUploadStatus('UPLOADING');

    if (onLocalJob) {
      onLocalJob({
        jobId: 'local-upload',
        originalFileName: selectedFile.name,
        clientId: clientId,
        priority: priority.toUpperCase(),
        status: 'UPLOADING',
        progress: 0,
        workerId: null,
        result: null,
        error: null,
        createdAt: new Date().toISOString()
      });
    }

    try {
      const response = await fetch(API_URL + '/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadStatus('FAILED');
        setErrorMessage(data.message || 'Upload failed.');
        if (onLocalJob) {
          onLocalJob({
            jobId: 'local-upload',
            originalFileName: selectedFile.name,
            clientId: clientId,
            priority: priority.toUpperCase(),
            status: 'FAILED',
            progress: 0,
            workerId: null,
            result: null,
            error: data.message || 'Upload failed.',
            createdAt: new Date().toISOString()
          });
        }
        return;
      }

      setUploadStatus('UPLOADED');
      if (onLocalJob) {
        onLocalJob({
          jobId: data.jobId,
          originalFileName: data.originalFileName,
          clientId: data.clientId,
          priority: data.priority,
          status: data.status || 'UPLOADED',
          progress: 0,
          workerId: null,
          result: null,
          error: null,
          createdAt: data.createdAt
        }, 'local-upload');
      }
    } catch (error) {
      setUploadStatus('FAILED');
      setErrorMessage('Could not reach the server. Make sure the backend is running.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-card">
      <h2>Upload CSV</h2>

      <div
        className={isDragging ? 'dropzone dragging' : 'dropzone'}
        onDragOver={function (event) {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={function () {
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <p className="dropzone-title">Drop CSV here</p>
        <p className="dropzone-or">or</p>
        <button
          type="button"
          className="choose-button"
          onClick={function () {
            fileInputRef.current.click();
          }}
          disabled={isUploading}
        >
          Choose CSV File
        </button>
        <input
          ref={fileInputRef}
          className="hidden-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {selectedFile && (
          <p className="selected-file">
            Selected: {selectedFile.name} ({selectedFile.size} bytes) · Priority {priority.toUpperCase()}
          </p>
        )}
      </div>

      <div className="upload-options">
        <div className="option-group">
          <span className="option-label">Priority</span>
          <div className="priority-toggle">
            <button
              type="button"
              className={priority === 'high' ? 'active-high' : ''}
              onClick={function () {
                setPriority('high');
              }}
              disabled={isUploading}
            >
              HIGH
            </button>
            <button
              type="button"
              className={priority === 'low' ? 'active-low' : ''}
              onClick={function () {
                setPriority('low');
              }}
              disabled={isUploading}
            >
              LOW
            </button>
          </div>
        </div>

        <button
          className="upload-button"
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      {uploadStatus && (
        <div className="upload-feedback">
          <StatusBadge status={uploadStatus} />
          {uploadStatus === 'UPLOADING' && <span>Sending file to the server...</span>}
          {uploadStatus === 'UPLOADED' && <span>File uploaded. Queue updates will appear below.</span>}
        </div>
      )}

      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </section>
  );
}

export default CsvUpload;
