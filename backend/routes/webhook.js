const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyWebhookSignature } = require('../middleware/security');

// JotForm webhook endpoint
router.post('/jotform', verifyWebhookSignature, webhookController.handleJotFormSubmission);

// Slack webhook endpoint (for interactive components)
router.post('/slack', verifyWebhookSignature, webhookController.handleSlackInteraction);

// Twilio webhook endpoint (for SMS responses)
router.post('/twilio', verifyWebhookSignature, webhookController.handleTwilioWebhook);

// Generic webhook test endpoint
router.post('/test', webhookController.testWebhook);

module.exports = router;