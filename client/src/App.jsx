import CsvUpload from './components/CsvUpload.jsx';
import './App.css';

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>CSV Upload</h1>
        <p>Select a CSV file from your computer and upload it to the server.</p>
      </header>
      <CsvUpload />
    </main>
  );
}

export default App;
