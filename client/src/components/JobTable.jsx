import JobRow from './JobRow.jsx';
import './JobTable.css';

function sortJobs(jobs) {
  const copy = jobs.slice();

  copy.sort(function (a, b) {
    const timeA = a.createdAt || '';
    const timeB = b.createdAt || '';

    if (timeA === timeB) {
      return 0;
    }

    if (timeA < timeB) {
      return 1;
    }

    return -1;
  });

  return copy;
}

function JobTable({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <section className="jobs-card">
        <div className="empty-state">
          <h3>No jobs yet</h3>
          <p>Upload a CSV file to start processing.</p>
        </div>
      </section>
    );
  }

  const orderedJobs = sortJobs(jobs);

  return (
    <section className="jobs-card">
      <h2>Queue / Jobs</h2>
      <div className="jobs-scroll">
        <table className="jobs-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Client</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Worker</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {orderedJobs.map(function (job) {
              return <JobRow key={job.jobId} job={job} />;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default JobTable;
