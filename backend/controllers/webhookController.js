const jotformService = require('../services/jotformService');
const twilioService = require('../services/twilioService');
const slackService = require('../services/slackService');
const googleSheetsService = require('../services/googleSheetsService');
const logger = require('../config/logger');

class WebhookController {
  async handleJotFormSubmission(req, res) {
    try {
      logger.webhook('Received JotForm webhook', {
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type'],
        bodySize: req.body ? JSON.stringify(req.body).length : 0,
        ip: req.ip
      });
      
      // Process the JotForm submission
      const result = await jotformService.processWebhookSubmission({
        headers: req.headers,
        body: req.body,
        rawRequest: req.body.rawRequest || req.rawBody,
        submission: req.body.submission || req.body
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to process submission',
          details: result.error
        });
      }

      const guestData = result.guestData;
      
      // Add guest to Google Sheets for data retention
      await googleSheetsService.addGuest(guestData);
      
      // Send Slack notification for guest arrival
      try {
        const slackResult = await slackService.sendGuestArrivalNotification(guestData);
        if (slackResult.success) {
          logger.info(`Slack notification sent for guest ${guestData.firstName} ${guestData.lastName}`);
        }
      } catch (error) {
        logger.error('Failed to send Slack notification:', error.message);
      }
      
      // Check for SMS consent and record it
      // Check for SMS consent from various possible form field names
      const smsConsent = guestData.smsConsent || 
                        guestData.q10_smsConsent || 
                        guestData.q11_smsConsent || 
                        guestData.q12_smsConsent ||
                        guestData.smsNotifications ||
                        guestData.textConsent ||
                        guestData.notificationPreferences?.sms;

      // Record SMS consent status in guest data for compliance
      guestData.smsConsentGiven = !!smsConsent;
      guestData.smsConsentTimestamp = new Date().toISOString();
      
      // Send SMS consent confirmation and visit notification (only if consent is given)
      if (guestData.phoneNumber && smsConsent) {
        try {
          // Send consent confirmation message with visit details
          const consentMessage = `Thank you for checking in! ${guestData.firstName}, your host ${guestData.hostEmployee || 'our team'} has been notified of your arrival.

By providing consent, you'll receive SMS updates about your visit. Message and data rates may apply. Text STOP to opt out anytime.

Welcome to our office!`;

          const smsResult = await twilioService.sendCustomMessage(guestData.phoneNumber, consentMessage);
          if (smsResult.success) {
            logger.info(`SMS consent confirmation and arrival notification sent to guest ${guestData.firstName} ${guestData.lastName} (consent given at ${guestData.smsConsentTimestamp})`);
          }
        } catch (error) {
          logger.error('Failed to send SMS consent confirmation:', error.message);
        }
      } else if (guestData.phoneNumber && !smsConsent) {
        logger.info(`SMS consent not given for guest ${guestData.firstName} ${guestData.lastName}, skipping SMS notification`);
      }
      
      // Log SMS consent for compliance records
      if (guestData.phoneNumber) {
        await googleSheetsService.logAuditEvent({
          guestId: guestData.id,
          guestName: `${guestData.firstName} ${guestData.lastName}`,
          action: 'SMS_CONSENT_RECORDED',
          newStatus: smsConsent ? 'CONSENTED' : 'DECLINED',
          performedBy: 'GUEST_FORM_SUBMISSION',
          notes: `SMS consent ${smsConsent ? 'given' : 'not given'} at form submission. Phone: ${guestData.phoneNumber}`,
          ipAddress: req.ip
        });
      }

      // Log the submission
      await googleSheetsService.logAuditEvent({
        guestId: guestData.id,
        guestName: `${guestData.firstName} ${guestData.lastName}`,
        action: 'FORM_SUBMITTED',
        newStatus: 'pending',
        performedBy: 'JOTFORM',
        notes: 'Guest submitted check-in form',
        ipAddress: req.ip
      });

      logger.webhook('JotForm submission processed successfully', {
        guestId: guestData.id,
        guestName: `${guestData.firstName} ${guestData.lastName}`,
        phoneNumber: guestData.phoneNumber,
        processingTime: Date.now() - req.startTime
      });

      res.json({
        success: true,
        message: 'Submission processed successfully',
        guestId: guestData.id
      });
    } catch (error) {
      logger.error('Error processing JotForm webhook', error);
      logger.webhook('JotForm webhook processing failed', {
        errorMessage: error.message,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async handleSlackInteraction(req, res) {
    try {
      console.log('⚡ Received Slack interaction');
      
      const payload = JSON.parse(req.body.payload);
      
      // Verify Slack signature
      const timestamp = req.headers['x-slack-request-timestamp'];
      const signature = req.headers['x-slack-signature'];
      const isValid = slackService.verifySignature(timestamp, signature, req.body.payload);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
      }

      // Process the interaction
      const result = await slackService.handleInteractiveAction(payload);
      
      if (result.success) {
        // Log the interaction
        await googleSheetsService.logAuditEvent({
          guestId: result.guestId,
          guestName: result.guestId, // Will be resolved later
          action: 'SLACK_INTERACTION',
          performedBy: result.user,
          notes: `Slack action: ${result.action}`,
          ipAddress: req.ip
        });
      }

      // Slack expects a 200 response within 3 seconds
      res.json({
        success: true,
        message: 'Interaction processed'
      });
    } catch (error) {
      console.error('❌ Error processing Slack interaction:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async handleTwilioWebhook(req, res) {
    try {
      console.log('📱 Received Twilio webhook');
      
      const { From: from, Body: body, MessageSid: messageSid } = req.body;
      
      // Process incoming SMS
      const result = await twilioService.handleIncomingSms(from, body, messageSid);
      
      if (result.success) {
        // Log the SMS interaction
        await googleSheetsService.logAuditEvent({
          guestId: 'unknown', // We don't have guest ID from phone number directly
          guestName: 'SMS Sender',
          action: 'SMS_RECEIVED',
          performedBy: 'TWILIO',
          notes: `Incoming SMS: ${body}`,
          ipAddress: req.ip
        });
      }

      // Twilio expects TwiML response or 200 status
      res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
      console.error('❌ Error processing Twilio webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async testWebhook(req, res) {
    try {
      console.log('🧪 Webhook test endpoint called');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('Query:', req.query);
      
      const response = {
        success: true,
        message: 'Webhook test successful',
        timestamp: new Date().toISOString(),
        receivedData: {
          headers: req.headers,
          body: req.body,
          query: req.query,
          method: req.method,
          url: req.url,
          ip: req.ip
        }
      };

      res.json(response);
    } catch (error) {
      console.error('❌ Error in webhook test:', error);
      res.status(500).json({
        success: false,
        error: 'Test failed',
        message: error.message
      });
    }
  }

  // Middleware to capture raw body for signature verification
  static rawBodyCapture(req, res, next) {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  }
}

module.exports = new WebhookController();