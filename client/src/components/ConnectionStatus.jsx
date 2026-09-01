import './ConnectionStatus.css';

function ConnectionStatus({ isConnected }) {
  return (
    <div className={isConnected ? 'connection-status connected' : 'connection-status disconnected'}>
      <span className="connection-dot" />
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}

export default ConnectionStatus;
