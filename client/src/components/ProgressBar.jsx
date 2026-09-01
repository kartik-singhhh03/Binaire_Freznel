import './ProgressBar.css';

function ProgressBar({ value }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: percent + '%' }} />
      </div>
      <span className="progress-label">{percent}%</span>
    </div>
  );
}

export default ProgressBar;
