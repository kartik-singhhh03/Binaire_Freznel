import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import CsvUpload from './components/CsvUpload.jsx';
import ConnectionStatus from './components/ConnectionStatus.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import JobTable from './components/JobTable.jsx';
import './App.css';

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

function upsertJob(jobs, incomingJob, replaceId) {
  const nextJobs = [];
  let replaced = false;

  for (let i = 0; i < jobs.length; i++) {
    const current = jobs[i];

    if (replaceId && current.jobId === replaceId) {
      nextJobs.push(incomingJob);
      replaced = true;
      continue;
    }

    if (current.jobId === incomingJob.jobId) {
      nextJobs.push(incomingJob);
      replaced = true;
      continue;
    }

    if (
      current.jobId === 'local-upload' &&
      incomingJob.jobId !== 'local-upload' &&
      current.clientId === incomingJob.clientId &&
      current.originalFileName === incomingJob.originalFileName
    ) {
      continue;
    }

    nextJobs.push(current);
  }

  if (!replaced) {
    nextJobs.push(incomingJob);
  }

  return nextJobs;
}

function App() {
  const [clientId] = useState(getOrCreateClientId);
  const [isConnected, setIsConnected] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(function () {
    const socket = io(API_URL);

    function handleJobEvent(payload) {
      if (!payload || !payload.job || !payload.job.jobId) {
        return;
      }

      setJobs(function (currentJobs) {
        return upsertJob(currentJobs, payload.job);
      });
    }

    socket.on('connect', function () {
      setIsConnected(true);
    });

    socket.on('disconnect', function () {
      setIsConnected(false);
    });

    socket.on('queue:state', function (payload) {
      setJobs(payload && payload.jobs ? payload.jobs : []);
    });

    socket.on('job:created', handleJobEvent);
    socket.on('job:waiting', handleJobEvent);
    socket.on('job:processing', handleJobEvent);
    socket.on('job:progress', handleJobEvent);
    socket.on('job:completed', handleJobEvent);
    socket.on('job:failed', handleJobEvent);

    return function () {
      socket.disconnect();
    };
  }, []);

  function handleLocalJob(job, replaceId) {
    setJobs(function (currentJobs) {
      return upsertJob(currentJobs, job, replaceId);
    });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Binaire Queue</h1>
          <p className="subtitle">Multi-user CSV processing</p>
        </div>
        <div className="header-meta">
          <ConnectionStatus isConnected={isConnected} />
          <div className="client-chip" title={clientId}>
            Client {clientId}
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <CsvUpload clientId={clientId} onLocalJob={handleLocalJob} />
        <SummaryCards jobs={jobs} />
        <JobTable jobs={jobs} />
      </div>
    </div>
  );
}

export default App;
