import { useState } from 'react';
import './CsvUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CsvUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
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
