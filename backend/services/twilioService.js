const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.client = null;
  }

  initialize() {
    try {
      if (!this.accountSid || !this.authToken || !this.phoneNumber) {
        throw new Error('Twilio credentials not properly configured');
      }

      this.client = twilio(this.accountSid, this.authToken);
      console.log('✅ Twilio service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Twilio service:', error.message);
      throw error;
    }
  }

  async sendSms(to, message, options = {}) {
    try {
      if (!this.client) {
        this.initialize();
      }

      // Format phone number
      const formattedTo = this.formatPhoneNumber(to);
      
      const messageOptions = {
        body: message,
        from: this.phoneNumber,
        to: formattedTo,
        ...options
      };

      const result = await this.client.messages.create(messageOptions);
      
      console.log(`✅ SMS sent successfully to ${formattedTo}. Message SID: ${result.sid}`);
      
      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        to: formattedTo,
        from: this.phoneNumber
      };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendGuestWelcomeMessage(guestData) {
    const message = `Welcome to our office, ${guestData.firstName}! 

Your visit details:
🏢 Host: ${guestData.hostName}
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString()}

Please proceed to the reception desk. Your host has been notified of your arrival.

Reply HELP for assistance or STOP to opt out.`;

    return await this.sendSms(guestData.phoneNumber, message);
  }

  async sendHostNotification(hostPhone, guestData) {
    const message = `🔔 Guest Arrival Notification

${guestData.firstName} ${guestData.lastName} has checked in.

📧 Email: ${guestData.email}
📱 Phone: ${guestData.phoneNumber}
🏢 Company: ${guestData.company || 'N/A'}
📝 Purpose: ${guestData.purposeOfVisit}
⏱️ Expected Duration: ${guestData.expectedDuration || 'Not specified'}

Time: ${new Date().toLocaleString()}

Please proceed to reception when ready.`;

    return await this.sendSms(hostPhone, message);
  }

  async sendStatusUpdateMessage(guestData, status, customMessage = null) {
    let message;
    
    if (customMessage) {
      message = customMessage;
    } else {
      switch (status) {
        case 'approved':
          message = `Hi ${guestData.firstName}, your visit has been approved! Please proceed to our office at your scheduled time.`;
          break;
        case 'checked-in':
          message = `Thank you for checking in, ${guestData.firstName}! Your host ${guestData.hostName} has been notified. Please take a seat and they will be with you shortly.`;
          break;
        case 'with-host':
          message = `Hi ${guestData.firstName}, you are now with your host. Enjoy your visit!`;
          break;
        case 'checked-out':
          message = `Thank you for visiting us today, ${guestData.firstName}! We hope you had a productive visit. Have a great day!`;
          break;
        case 'cancelled':
          message = `Hi ${guestData.firstName}, your visit has been cancelled. Please contact your host if you need to reschedule.`;
          break;
        default:
          message = `Hi ${guestData.firstName}, your visit status has been updated to: ${status}`;
      }
    }

    return await this.sendSms(guestData.phoneNumber, message);
  }

  async sendCustomMessage(phoneNumber, message) {
    return await this.sendSms(phoneNumber, message);
  }

  async makeVoiceCall(to, message) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const formattedTo = this.formatPhoneNumber(to);
      
      const call = await this.client.calls.create({
        twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
        to: formattedTo,
        from: this.phoneNumber
      });

      console.log(`✅ Voice call initiated to ${formattedTo}. Call SID: ${call.sid}`);
      
      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: formattedTo
      };
    } catch (error) {
      console.error('❌ Failed to make voice call:', error.message);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async getMessageStatus(messageSid) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const message = await this.client.messages(messageSid).fetch();
      
      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      console.error('❌ Failed to get message status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleIncomingSms(from, body, messageSid) {
    try {
      const formattedFrom = this.formatPhoneNumber(from);
      const messageBody = body.trim().toLowerCase();
      
      console.log(`📱 Incoming SMS from ${formattedFrom}: ${body}`);

      // Handle common responses
      let responseMessage = null;
      
      if (messageBody === 'help') {
        responseMessage = `Guest Check-in System Help:

• Reply with your name to check your visit status
• Reply STOP to opt out of messages
• For immediate assistance, call our main number

Office Hours: Monday-Friday 9AM-5PM`;
      } else if (messageBody === 'stop' || messageBody === 'unsubscribe') {
        responseMessage = "You have been unsubscribed from check-in notifications. Reply START to resubscribe.";
      } else if (messageBody === 'start' || messageBody === 'subscribe') {
        responseMessage = "You have been resubscribed to check-in notifications. Welcome back!";
      } else {
        // Handle general inquiries
        responseMessage = `Thank you for your message. A team member will respond shortly. For immediate assistance, please call our main number or visit the reception desk.

Reply HELP for more options.`;
      }

      // Send automated response
      if (responseMessage) {
        await this.sendSms(formattedFrom, responseMessage);
      }

      return {
        success: true,
        from: formattedFrom,
        body: body,
        messageSid: messageSid,
        responsesent: !!responseMessage
      };
    } catch (error) {
      console.error('❌ Failed to handle incoming SMS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned; // Assume US/Canada
    }
    
    // Add + sign if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  async testConnection() {
    try {
      if (!this.client) {
        this.initialize();
      }

      // Test by fetching account information
      const account = await this.client.api.accounts(this.accountSid).fetch();
      
      return {
        success: true,
        accountSid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        phoneNumber: this.phoneNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility method to validate phone numbers
  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

module.exports = new TwilioService();