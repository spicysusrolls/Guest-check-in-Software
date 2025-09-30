// Load environment variables first - MUST be at the top
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const logger = require('./backend/config/logger');
const { requestLogger, errorLogger } = require('./backend/middleware/logging');

// Enhanced startup logging
const startupTime = new Date().toISOString();
console.log('================================================================');
console.log('🚀 GUEST CHECK-IN SYSTEM SERVER STARTUP');
console.log('================================================================');
console.log(`📅 Startup Time: ${startupTime}`);
console.log(`🌍 Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Working Directory: ${process.cwd()}`);
console.log(`🔧 Node Version: ${process.version}`);
console.log(`💾 Platform: ${process.platform} ${process.arch}`);
console.log(`🆔 Process ID: ${process.pid}`);

// Log environment variables status (without exposing secrets)
console.log('----------------------------------------------------------------');
console.log('🔍 ENVIRONMENT CONFIGURATION CHECK:');
console.log('----------------------------------------------------------------');
console.log(`✅ PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'} TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing'}`);
console.log(`${process.env.SLACK_BOT_TOKEN ? '✅' : '❌'} SLACK_BOT_TOKEN: ${process.env.SLACK_BOT_TOKEN ? 'Set' : 'Missing'}`);
console.log(`${process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅' : '❌'} GOOGLE_SHEETS_SPREADSHEET_ID: ${process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Set' : 'Missing'}`);
console.log(`${process.env.JOTFORM_API_KEY ? '✅' : '❌'} JOTFORM_API_KEY: ${process.env.JOTFORM_API_KEY ? 'Set' : 'Missing'}`);

// Create startup log entry
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log('📁 Created logs directory');
}

const startupLogFile = path.join(logDir, 'server-startup.log');
const startupLogEntry = `${startupTime} - SERVER STARTUP - PID: ${process.pid} - Node: ${process.version} - Env: ${process.env.NODE_ENV || 'development'}\n`;
fs.appendFileSync(startupLogFile, startupLogEntry);

logger.info('Server startup initiated', {
  startupTime,
  processId: process.pid,
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
  workingDirectory: process.cwd()
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - allow both localhost and 127.0.0.1
const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001'];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Logging
app.use(requestLogger);
app.use(morgan('combined'));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const guestRoutes = require('./backend/routes/guest');
const webhookRoutes = require('./backend/routes/webhook');
const adminRoutes = require('./backend/routes/admin');

// API routes
app.use('/api/guests', guestRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Guest Check-in System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      guests: '/api/guests',
      webhooks: '/api/webhooks',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  const errorTime = new Date().toISOString();
  console.error('================================================================');
  console.error('💥 UNCAUGHT EXCEPTION - SERVER CRASH PREVENTED');
  console.error('================================================================');
  console.error(`⏰ Time: ${errorTime}`);
  console.error(`❌ Error: ${err.message}`);
  console.error(`📍 Stack: ${err.stack}`);
  
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
    timestamp: errorTime
  });
  
  const errorLogEntry = `${errorTime} - UNCAUGHT EXCEPTION - ${err.message}\n${err.stack}\n\n`;
  fs.appendFileSync(path.join(__dirname, 'logs', 'server-errors.log'), errorLogEntry);
  
  console.error('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
  const errorTime = new Date().toISOString();
  console.error('================================================================');
  console.error('⚠️ UNHANDLED PROMISE REJECTION');
  console.error('================================================================');
  console.error(`⏰ Time: ${errorTime}`);
  console.error(`❌ Reason: ${reason}`);
  console.error(`📍 Promise: ${promise}`);
  
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.toString(),
    timestamp: errorTime
  });
  
  const errorLogEntry = `${errorTime} - UNHANDLED REJECTION - ${reason}\n\n`;
  fs.appendFileSync(path.join(__dirname, 'logs', 'server-errors.log'), errorLogEntry);
});

// Enhanced server startup with connection testing
const server = app.listen(PORT, async () => {
  const serverStartTime = new Date().toISOString();
  
  console.log('================================================================');
  console.log('✅ SERVER SUCCESSFULLY STARTED');
  console.log('================================================================');
  console.log(`🚀 Guest Check-in System API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Dashboard: http://localhost:${PORT}/`);
  console.log(`⏰ Server Start Time: ${serverStartTime}`);
  console.log(`🆔 Process ID: ${process.pid}`);
  console.log('================================================================');
  
  // Log successful startup
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    processId: process.pid,
    startTime: serverStartTime
  });
  
  const successLogEntry = `${serverStartTime} - SERVER STARTED - Port: ${PORT} - PID: ${process.pid}\n`;
  fs.appendFileSync(path.join(__dirname, 'logs', 'server-startup.log'), successLogEntry);
  
  // Test critical integrations on startup
  console.log('🔍 TESTING INTEGRATIONS ON STARTUP...');
  
  try {
    // Initialize Google Sheets service
    const googleSheetsService = require('./backend/services/googleSheetsService');
    await googleSheetsService.initialize();
    const sheetsTest = await googleSheetsService.testConnection();
    console.log(`${sheetsTest.success ? '✅' : '❌'} Google Sheets: ${sheetsTest.success ? 'Connected' : sheetsTest.error}`);
    
    // Test Twilio connection
    const twilioService = require('./backend/services/twilioService');
    console.log('✅ Twilio: Service loaded');
    
    // Test Slack connection
    const slackService = require('./backend/services/slackService');
    console.log('✅ Slack: Service loaded');
    
    console.log('================================================================');
    console.log('🎉 ALL SYSTEMS READY - Server is operational!');
    console.log('================================================================');
    
  } catch (error) {
    console.error('⚠️ Integration test failed on startup:', error.message);
    logger.error('Startup integration test failed', { error: error.message });
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Starting graceful shutdown...');
  const shutdownTime = new Date().toISOString();
  
  logger.info('Server shutdown initiated', { shutdownTime });
  const shutdownLogEntry = `${shutdownTime} - SERVER SHUTDOWN - SIGTERM\n`;
  fs.appendFileSync(path.join(__dirname, 'logs', 'server-startup.log'), shutdownLogEntry);
  
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT received. Starting graceful shutdown...');
  const shutdownTime = new Date().toISOString();
  
  logger.info('Server shutdown initiated', { shutdownTime });
  const shutdownLogEntry = `${shutdownTime} - SERVER SHUTDOWN - SIGINT (Ctrl+C)\n`;
  fs.appendFileSync(path.join(__dirname, 'logs', 'server-startup.log'), shutdownLogEntry);
  
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

module.exports = app;