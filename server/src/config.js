function parseOrigins() {
  if (process.env.FRONTEND_ORIGIN) {
    return process.env.FRONTEND_ORIGIN.split(',').map(function (origin) {
      return origin.trim().replace(/\/$/, '');
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

function isTruthyEnv(name) {
  const value = String(process.env[name] || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  PORT: numberFromEnv('PORT', 5000),
  HOST: process.env.HOST || '0.0.0.0',
  FRONTEND_ORIGINS: parseOrigins(),
  ALLOW_VERCEL_PREVIEWS: isTruthyEnv('ALLOW_VERCEL_PREVIEWS'),
  MAX_CONCURRENT_JOBS: numberFromEnv('MAX_CONCURRENT_JOBS', 2),
  WORKER_TIMEOUT_MS: numberFromEnv('WORKER_TIMEOUT_MS', 30000),
  CSV_ROW_DELAY_MS: numberFromEnv('CSV_ROW_DELAY_MS', isProduction ? 0 : 20),
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024
};

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalized = origin.replace(/\/$/, '');

  if (config.FRONTEND_ORIGINS.indexOf(normalized) !== -1) {
    return true;
  }

  if (config.ALLOW_VERCEL_PREVIEWS && /\.vercel\.app$/.test(normalized)) {
    return true;
  }

  return false;
}

function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(null, false);
}

config.isAllowedOrigin = isAllowedOrigin;
config.corsOrigin = corsOrigin;

module.exports = config;
