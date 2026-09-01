function parseOrigins() {
  if (process.env.FRONTEND_ORIGIN) {
    return process.env.FRONTEND_ORIGIN.split(',').map(function (origin) {
      return origin.trim();
    }).filter(Boolean);
  }

  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

function numberFromEnv(name, fallback) {
  if (process.env[name] === undefined || process.env[name] === '') {
    return fallback;
  }

  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

const config = {
  PORT: numberFromEnv('PORT', 5000),
  FRONTEND_ORIGINS: parseOrigins(),
  MAX_CONCURRENT_JOBS: numberFromEnv('MAX_CONCURRENT_JOBS', 2),
  WORKER_TIMEOUT_MS: numberFromEnv('WORKER_TIMEOUT_MS', 30000),
  CSV_ROW_DELAY_MS: numberFromEnv('CSV_ROW_DELAY_MS', 20),
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024
};

module.exports = config;
