import StatusBadge, { PriorityBadge } from './StatusBadge.jsx';
import ProgressBar from './ProgressBar.jsx';

function shortId(value) {
  if (!value) {
    return '—';
  }

  if (value.length <= 14) {
    return value;
  }

  return value.slice(0, 8) + '…';
}

function JobRow({ job }) {
  let workerLabel = 'Waiting';
  let resultLabel = '—';

  if (job.status === 'PROCESSING' && job.workerId !== null && job.workerId !== undefined) {
    workerLabel = 'Worker ' + job.workerId;
  } else if (job.workerId !== null && job.workerId !== undefined && job.status !== 'WAITING' && job.status !== 'QUEUED') {
    workerLabel = 'Worker ' + job.workerId;
  } else if (job.status === 'PROCESSING') {
    workerLabel = 'Worker starting';
  }

  if (job.status === 'COMPLETED' && job.result !== null && job.result !== undefined) {
    resultLabel = String(job.result);
  } else if (job.status === 'FAILED') {
    resultLabel = job.error || 'Job failed';
  }

  return (
    <tr>
      <td>
        <strong>{job.originalFileName}</strong>
      </td>
      <td title={job.clientId}>{shortId(job.clientId)}</td>
      <td>
        <PriorityBadge priority={job.priority} />
      </td>
      <td>
        <StatusBadge status={job.status} />
      </td>
      <td>
        <ProgressBar value={job.progress} />
      </td>
      <td>{workerLabel}</td>
      <td className={job.status === 'FAILED' ? 'result-error' : ''}>{resultLabel}</td>
    </tr>
  );
}

export default JobRow;
