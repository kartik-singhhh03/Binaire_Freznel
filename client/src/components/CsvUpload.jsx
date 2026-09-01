import { useState } from 'react';
import './CsvUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getOrCreateClientId() {
  const storageKey = 'csvQueueClientId';
  const existingClientId = window.sessionStorage.getItem(storageKey);

  if (existingClientId) {
    return existingClientId;
  }

  const newClientId = crypto.randomUUID();
  window.sessionStorage.setItem(storageKey, newClientId);
  return newClientId;
}

function CsvUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [priority, setPriority] = useState('high');
  const [clientId] = useState(getOrCreateClientId);
  const [isUploading, setIsUploading] = useState(false);
  const [serverResponse, setServerResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  function handleFileChange(event) {
    const file = event.target.files[0];
    setSelectedFile(file || null);
    setServerResponse(null);
    setErrorMessage('');
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
    setServerResponse(null);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Upload failed.');
        return;
      }

      setServerResponse(data);
    } catch (error) {
      setErrorMessage('Could not reach the server. Make sure the backend is running.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-card">
      <p className="client-id">Client ID: {clientId}</p>

      <label className="file-label" htmlFor="csv-file">
        CSV file
      </label>
      <input
        id="csv-file"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {selectedFile && (
        <p className="selected-file">
          Selected: {selectedFile.name} ({selectedFile.size} bytes)
        </p>
      )}

      <label className="file-label" htmlFor="priority">
        Priority
      </label>
      <select
        id="priority"
        className="priority-select"
        value={priority}
        onChange={function (event) {
          setPriority(event.target.value);
        }}
        disabled={isUploading}
      >
        <option value="high">HIGH</option>
        <option value="low">LOW</option>
      </select>

      <button
        className="upload-button"
        type="button"
        onClick={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>

      {isUploading && <p className="status-text">Sending file to the server...</p>}

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      {serverResponse && (
        <div className="response-box">
          <h2>Server response</h2>
          <pre>{JSON.stringify(serverResponse, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

export default CsvUpload;
