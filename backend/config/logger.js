const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'guest-checkin-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Webhook specific log file
    new winston.transports.File({
      filename: path.join(logsDir, 'webhooks.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: 'webhook' })
      )
    }),
    // JotForm specific log file
    new winston.transports.File({
      filename: path.join(logsDir, 'jotform.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: 'jotform' })
      )
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Helper methods for specific logging contexts
logger.webhook = (message, data = {}) => {
  logger.info(message, { ...data, context: 'webhook' });
};

logger.jotform = (message, data = {}) => {
  logger.info(message, { ...data, context: 'jotform' });
};

logger.error = (message, error = null) => {
  if (error && error.stack) {
    logger.log('error', message, { 
      error: error.message, 
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.log('error', message, { timestamp: new Date().toISOString() });
  }
};

module.exports = logger;