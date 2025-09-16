const Joi = require('joi');

// Guest data validation schema
const guestSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
  company: Joi.string().max(100).optional(),
  hostName: Joi.string().min(1).max(100).required(),
  hostEmail: Joi.string().email().optional(),
  purposeOfVisit: Joi.string().max(500).required(),
  expectedDuration: Joi.string().max(50).optional(),
  specialRequirements: Joi.string().max(500).optional(),
  visitDate: Joi.date().iso().optional(),
  notificationPreferences: Joi.object({
    sms: Joi.boolean().default(true),
    email: Joi.boolean().default(true),
    slack: Joi.boolean().default(true)
  }).optional()
});

// Status update validation schema
const statusUpdateSchema = Joi.object({
  status: Joi.string().valid(
    'pending',
    'approved',
    'checked-in',
    'with-host',
    'checked-out',
    'cancelled'
  ).required(),
  notes: Joi.string().max(500).optional()
});

// SMS validation schema
const smsSchema = Joi.object({
  message: Joi.string().min(1).max(1600).required(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
});

const validateGuestData = (req, res, next) => {
  const { error, value } = guestSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid guest data provided',
      details: errors
    });
  }
  
  req.body = value;
  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { error, value } = statusUpdateSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message
    });
  }
  
  req.body = value;
  next();
};

const validateSmsData = (req, res, next) => {
  const { error, value } = smsSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateGuestData,
  validateStatusUpdate,
  validateSmsData
};