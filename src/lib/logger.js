/**
 * AI Academy - Enterprise Logger Utility
 * Lightweight, structured logger with environment-aware formatting and tenant context tracing.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === 'production';

  const logPayload = {
    timestamp,
    level,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };

  if (isProd) {
    return JSON.stringify(logPayload);
  }

  // Developer-friendly console output with ANSI color simulation
  const colors = {
    DEBUG: '\x1b[34m[DEBUG]\x1b[0m',
    INFO: '\x1b[32m[INFO]\x1b[0m',
    WARN: '\x1b[33m[WARN]\x1b[0m',
    ERROR: '\x1b[31m[ERROR]\x1b[0m',
  };

  const prefix = `${colors[level] || `[${level}]`} ${timestamp} - ${message}`;
  return { prefix, meta };
}

export const logger = {
  debug(message, meta = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      if (process.env.NODE_ENV === 'production') {
        console.debug(formatMessage('DEBUG', message, meta));
      } else {
        const { prefix } = formatMessage('DEBUG', message, meta);
        console.debug(prefix, Object.keys(meta).length ? meta : '');
      }
    }
  },

  info(message, meta = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      if (process.env.NODE_ENV === 'production') {
        console.info(formatMessage('INFO', message, meta));
      } else {
        const { prefix } = formatMessage('INFO', message, meta);
        console.info(prefix, Object.keys(meta).length ? meta : '');
      }
    }
  },

  warn(message, meta = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(formatMessage('WARN', message, meta));
      } else {
        const { prefix } = formatMessage('WARN', message, meta);
        console.warn(prefix, Object.keys(meta).length ? meta : '');
      }
    }
  },

  error(message, meta = {}) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      if (process.env.NODE_ENV === 'production') {
        console.error(formatMessage('ERROR', message, meta));
      } else {
        const { prefix } = formatMessage('ERROR', message, meta);
        console.error(prefix, Object.keys(meta).length ? meta : '');
      }
    }
  },

  /**
   * Creates a child logger with bound tenant or module context
   */
  child(context = {}) {
    return {
      debug: (msg, meta = {}) => logger.debug(msg, { ...context, ...meta }),
      info: (msg, meta = {}) => logger.info(msg, { ...context, ...meta }),
      warn: (msg, meta = {}) => logger.warn(msg, { ...context, ...meta }),
      error: (msg, meta = {}) => logger.error(msg, { ...context, ...meta }),
    };
  },
};

