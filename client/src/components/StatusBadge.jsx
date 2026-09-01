import './StatusBadge.css';

function StatusBadge({ status }) {
  const safeStatus = status || 'WAITING';
  const className = 'status-badge status-' + safeStatus.toLowerCase();

  return <span className={className}>{safeStatus}</span>;
}

function PriorityBadge({ priority }) {
  const safePriority = priority || 'LOW';
  const className = 'priority-badge priority-' + safePriority.toLowerCase();

  return <span className={className}>{safePriority}</span>;
}

export { PriorityBadge };
export default StatusBadge;
