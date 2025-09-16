const crypto = require('crypto');

// Verify webhook signatures to ensure authenticity
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
  const webhookSecret = process.env.WEBHOOK_ENDPOINT_SECRET;
  
  if (!webhookSecret) {
    console.warn('Webhook secret not configured, skipping signature verification');
    return next();
  }
  
  if (!signature) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Webhook signature missing'
    });
  }
  
  try {
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      });
    }
    
    next();
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Signature verification failed'
    });
  }
};

// Basic API key authentication for admin routes
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.APP_SECRET;
  
  if (!apiKey) {
    console.warn('APP_SECRET not configured, skipping authentication');
    return next();
  }
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header missing'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (token !== apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token'
    });
  }
  
  next();
};

// Rate limiting for sensitive operations
const createStrictRateLimit = (windowMs = 15 * 60 * 1000, max = 10) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message: `Too many requests from this IP, please try again after ${windowMs / 1000 / 60} minutes.`
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  verifyWebhookSignature,
  requireAuth,
  createStrictRateLimit
};