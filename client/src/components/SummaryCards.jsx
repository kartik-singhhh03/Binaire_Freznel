import './SummaryCards.css';

function countJobs(jobs) {
  const counts = {
    total: jobs.length,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  for (let i = 0; i < jobs.length; i++) {
    const status = jobs[i].status;

    if (status === 'PROCESSING') {
      counts.processing += 1;
    } else if (status === 'COMPLETED') {
      counts.completed += 1;
    } else if (status === 'FAILED') {
      counts.failed += 1;
    } else {
      counts.queued += 1;
    }
  }

  return counts;
}

function SummaryCards({ jobs }) {
  const counts = countJobs(jobs);

  return (
    <section className="summary-grid">
      <article className="summary-card">
        <p className="summary-label">Total</p>
        <p className="summary-value">{counts.total}</p>
      </article>
      <article className="summary-card summary-queued">
        <p className="summary-label">Queued</p>
        <p className="summary-value">{counts.queued}</p>
      </article>
      <article className="summary-card summary-processing">
        <p className="summary-label">Processing</p>
        <p className="summary-value">{counts.processing}</p>
      </article>
      <article className="summary-card summary-completed">
        <p className="summary-label">Completed</p>
        <p className="summary-value">{counts.completed}</p>
      </article>
      <article className="summary-card summary-failed">
        <p className="summary-label">Failed</p>
        <p className="summary-value">{counts.failed}</p>
      </article>
    </section>
  );
}

export default SummaryCards;
