const axios = require('axios');
const logger = require('../config/logger');

class JotFormService {
  constructor() {
    this.apiKey = process.env.JOTFORM_API_KEY;
    this.formId = process.env.JOTFORM_FORM_ID;
    this.webhookSecret = process.env.JOTFORM_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.jotform.com';
  }

  initialize() {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development' && this.apiKey === 'development_key') {
        logger.jotform('Running in development mode with mock data');
        this.isDevelopmentMode = true;
        return true;
      }

      if (!this.apiKey) {
        logger.error('JotForm API key not configured');
        throw new Error('JotForm API key not configured');
      }

      console.log('✅ JotForm service initialized successfully');
      console.log('🔗 API Key configured:', this.apiKey.substring(0, 8) + '...');
      console.log('📝 Form ID:', this.formId);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize JotForm service:', error.message);
      throw error;
    }
  }

  async getFormInfo(formId = null) {
    try {
      const targetFormId = formId || this.formId;
      
      if (!targetFormId) {
        throw new Error('Form ID not provided');
      }

      const response = await axios.get(`${this.baseUrl}/form/${targetFormId}`, {
        params: {
          apiKey: this.apiKey
        }
      });

      return {
        success: true,
        form: response.data.content
      };
    } catch (error) {
      console.error('❌ Failed to get form info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFormSubmissions(formId = null, limit = 20, offset = 0) {
    try {
      const targetFormId = formId || this.formId;
      
      if (!targetFormId) {
        throw new Error('Form ID not provided');
      }

      const response = await axios.get(`${this.baseUrl}/form/${targetFormId}/submissions`, {
        params: {
          apiKey: this.apiKey,
          limit: limit,
          offset: offset,
          orderby: 'created_at'
        }
      });

      const submissions = response.data.content.map(submission => 
        this.parseSubmission(submission)
      );

      return {
        success: true,
        submissions: submissions,
        totalCount: response.data.content.length
      };
    } catch (error) {
      console.error('❌ Failed to get form submissions:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSubmissionById(submissionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/submission/${submissionId}`, {
        params: {
          apiKey: this.apiKey
        }
      });

      return {
        success: true,
        submission: this.parseSubmission(response.data.content)
      };
    } catch (error) {
      console.error('❌ Failed to get submission:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  parseSubmission(rawSubmission) {
    try {
      const answers = rawSubmission.answers;
      
      // Map JotForm field names to our guest data structure
      // You'll need to adjust these based on your actual JotForm field IDs
      const guestData = {
        submissionId: rawSubmission.id,
        fullName: this.getAnswerValue(answers, 'name', 'fullName', 'full_name') || '',
        firstName: '', // Will be extracted from fullName
        lastName: '', // Will be extracted from fullName
        email: this.getAnswerValue(answers, 'email') || '',
        phoneNumber: this.getAnswerValue(answers, 'phone_number', 'phoneNumber', 'phone') || '',
        company: this.getAnswerValue(answers, 'company', 'organization') || '',
        title: this.getAnswerValue(answers, 'title', 'job_title', 'position') || '',
        hostName: this.getAnswerValue(answers, 'host_name', 'hostName', 'host') || '',
        hostEmail: this.getAnswerValue(answers, 'host_email', 'hostEmail') || '',
        purposeOfVisit: this.getAnswerValue(answers, 'purpose_of_visit', 'purposeOfVisit', 'purpose', 'reason') || '',
        kitchenVisit: this.getAnswerValue(answers, 'kitchen_visit', 'kitchenVisit', 'kitchen') || 'no',
        photo: this.getAnswerValue(answers, 'photo', 'photo_upload', 'image', 'take_photo') || '',
        visitDate: this.getAnswerValue(answers, 'visit_date', 'visitDate', 'date') || new Date().toISOString().split('T')[0],
        smsConsent: this.getAnswerValue(answers, 'sms_consent', 'smsConsent', 'text_notifications', 'sms_notifications', 'consent_sms') || false,
        status: 'pending',
        createdAt: rawSubmission.created_at,
        updatedAt: rawSubmission.updated_at,
        formId: rawSubmission.form_id,
        rawData: rawSubmission // Keep original data for debugging
      };

      // Split full name into first and last names
      if (guestData.fullName) {
        const nameParts = guestData.fullName.trim().split(' ');
        guestData.firstName = nameParts[0] || '';
        guestData.lastName = nameParts.slice(1).join(' ') || '';
      }

      // Generate unique ID for the guest
      guestData.id = this.generateGuestId(guestData);

      return guestData;
    } catch (error) {
      console.error('❌ Failed to parse submission:', error.message);
      return null;
    }
  }

  getAnswerValue(answers, ...possibleKeys) {
    // First check by exact field IDs for your specific form
    const fieldMappings = {
      'name': '16',           // Field 16: Name (control_fullname)
      'fullName': '16',       
      'email': '17',          // Field 17: E-mail (control_email)
      'phoneNumber': '152',   // Field 152: Phone Number (control_phone)
      'phone': '152',
      'company': '145',       // Field 145: Company (control_textbox)
      'organization': '145',
      'title': '146',         // Field 146: Title (control_textbox)
      'position': '146',
      'job_title': '146',
      'photo': '137',         // Field 137: Take Photo (control_widget)
      'take_photo': '137',
      'image': '137',
      'purpose_of_visit': '153', // Field 153: Purpose of Visit (control_textarea)
      'purposeOfVisit': '153',
      'purpose': '153',
      'reason': '153',
      'host_name': '164',     // Field 164: Host Name (control_autocomp)
      'hostName': '164',
      'host': '164',
      'kitchen_visit': '167', // Field 167: Do You Plan to Visit the Company Kitchen?
      'kitchenVisit': '167',
      'kitchen': '167',
      'sms_consent': '174',   // Field 174: SMS Consent checkbox
      'smsConsent': '174',
      'text_notifications': '174',
      'sms_notifications': '174',
      'consent_sms': '174',
      'consent': '174'
    };

    // Try to find the answer by field ID mapping first
    for (const key of possibleKeys) {
      const fieldId = fieldMappings[key];
      if (fieldId && answers[fieldId]) {
        return this.extractAnswerValue(answers[fieldId]);
      }
    }

    // Fallback to original search method
    for (const key of possibleKeys) {
      // Check direct key match
      for (const answerId in answers) {
        const answer = answers[answerId];
        
        // Check if the question text contains the key
        if (answer.text && answer.text.toLowerCase().includes(key.toLowerCase())) {
          return this.extractAnswerValue(answer);
        }
        
        // Check if the answer name contains the key
        if (answer.name && answer.name.toLowerCase().includes(key.toLowerCase())) {
          return this.extractAnswerValue(answer);
        }
      }
    }
    
    return null;
  }

  extractAnswerValue(answer) {
    if (answer.answer) {
      // Handle different answer types
      if (typeof answer.answer === 'string') {
        return answer.answer.trim();
      } else if (typeof answer.answer === 'object') {
        // Handle complex answers (like name fields, addresses, etc.)
        if (answer.answer.first && answer.answer.last) {
          return `${answer.answer.first} ${answer.answer.last}`.trim();
        } else if (answer.answer.area && answer.answer.phone) {
          return `${answer.answer.area}${answer.answer.phone}`.trim();
        } else if (answer.answer.full) {
          // Handle phone number with full format
          return answer.answer.full.trim();
        } else if (Array.isArray(answer.answer)) {
          // Handle checkbox arrays - convert to boolean for SMS consent
          const joinedAnswer = answer.answer.join(', ').toLowerCase();
          if (joinedAnswer.includes('consent') || joinedAnswer.includes('sms') || joinedAnswer.includes('notification')) {
            return true; // SMS consent was checked
          }
          return joinedAnswer;
        } else {
          return JSON.stringify(answer.answer);
        }
      }
    }
    
    return answer.prettyFormat || answer.text || '';
  }

  generateGuestId(guestData) {
    // Generate a unique ID based on submission ID and timestamp
    const timestamp = Date.now();
    const submissionPart = guestData.submissionId ? guestData.submissionId.slice(-6) : Math.random().toString(36).substr(2, 6);
    return `guest_${submissionPart}_${timestamp}`;
  }

  async processWebhookSubmission(webhookData) {
    try {
      logger.jotform('Processing JotForm webhook submission', {
        hasHeaders: !!webhookData.headers,
        hasBody: !!webhookData.body,
        hasRawRequest: !!webhookData.rawRequest,
        hasSubmission: !!webhookData.submission,
        bodyType: typeof webhookData.body,
        rawRequestType: typeof webhookData.rawRequest,
        submissionType: typeof webhookData.submission,
        webhookDataKeys: Object.keys(webhookData)
      });
      logger.webhook('JotForm webhook received', {
        headers: webhookData.headers,
        bodySize: webhookData.body ? JSON.stringify(webhookData.body).length : 0,
        rawRequestSize: webhookData.rawRequest ? JSON.stringify(webhookData.rawRequest).length : 0
      });
      
      // Temporarily disable webhook verification for testing
      // TODO: Re-enable signature verification after JotForm integration is working
      /*
      if (this.webhookSecret && webhookData.headers) {
        const isValid = this.verifyWebhook(webhookData.headers, webhookData.body);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }
      */

      // Debug logging
      console.log('DEBUG: webhookData structure:', {
        keys: Object.keys(webhookData),
        hasRawRequest: !!webhookData.rawRequest,
        hasSubmission: !!webhookData.submission,
        rawRequestType: typeof webhookData.rawRequest,
        submissionType: typeof webhookData.submission
      });

      // Parse the submission data
      let submissionData;
      
      if (webhookData.rawRequest) {
        console.log('DEBUG: Using rawRequest data');
        // Handle raw form data
        submissionData = this.parseRawSubmission(webhookData.rawRequest);
      } else if (webhookData.submission) {
        console.log('DEBUG: Using submission data');
        // Handle structured submission data
        submissionData = this.parseSubmission(webhookData.submission);
      } else {
        console.log('DEBUG: No valid submission data found');
        throw new Error('No valid submission data found in webhook');
      }

      console.log(`✅ JotForm submission processed for ${submissionData.firstName} ${submissionData.lastName}`);
      
      logger.jotform('Successfully processed JotForm webhook submission', {
        guestId: submissionData.id,
        guestName: submissionData.name,
        submissionTime: submissionData.submittedAt
      });
      
      return {
        success: true,
        guestData: submissionData
      };
    } catch (error) {
      logger.error('Failed to process JotForm webhook', error);
      logger.jotform('Webhook processing failed', {
        errorMessage: error.message,
        webhookDataType: typeof webhookData,
        hasHeaders: !!webhookData.headers
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  parseRawSubmission(rawRequest) {
    // Parse form-encoded data from webhook
    const formData = new URLSearchParams(rawRequest);
    const submission = {};
    
    for (const [key, value] of formData.entries()) {
      submission[key] = value;
    }
    
    // Convert to our standard format
    return this.parseSubmission({
      id: submission.submissionID || Date.now().toString(),
      form_id: submission.formID || this.formId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      answers: this.convertRawToAnswers(submission)
    });
  }

  convertRawToAnswers(rawData) {
    const answers = {};
    let answerId = 1;
    
    for (const [key, value] of Object.entries(rawData)) {
      if (key.startsWith('q') && key.includes('_')) {
        // JotForm question format: q4_firstName
        const [, fieldName] = key.split('_', 2);
        answers[answerId] = {
          name: fieldName,
          text: fieldName,
          answer: value,
          prettyFormat: value
        };
        answerId++;
      }
    }
    
    return answers;
  }

  verifyWebhook(headers, body) {
    try {
      if (!this.webhookSecret) {
        console.warn('JotForm webhook secret not configured, skipping verification');
        return true;
      }

      // JotForm webhook verification logic
      // This depends on how JotForm sends the signature
      const signature = headers['x-jotform-signature'] || headers['signature'];
      
      if (!signature) {
        console.warn('No signature found in JotForm webhook headers');
        return true; // Allow if no signature expected
      }

      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('❌ JotForm webhook verification failed:', error.message);
      return false;
    }
  }

  async createWebhook(webhookUrl) {
    try {
      if (!this.formId) {
        throw new Error('Form ID not configured');
      }

      const response = await axios.post(`${this.baseUrl}/form/${this.formId}/webhooks`, {
        webhookURL: webhookUrl
      }, {
        params: {
          apiKey: this.apiKey
        }
      });

      return {
        success: true,
        webhook: response.data.content
      };
    } catch (error) {
      console.error('❌ Failed to create webhook:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getWebhooks() {
    try {
      if (!this.formId) {
        throw new Error('Form ID not configured');
      }

      const response = await axios.get(`${this.baseUrl}/form/${this.formId}/webhooks`, {
        params: {
          apiKey: this.apiKey
        }
      });

      return {
        success: true,
        webhooks: response.data.content
      };
    } catch (error) {
      console.error('❌ Failed to get webhooks:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      // Test by getting user info
      const response = await axios.get(`${this.baseUrl}/user`, {
        params: {
          apiKey: this.apiKey
        }
      });

      const user = response.data.content;
      
      return {
        success: true,
        user: {
          username: user.username,
          name: user.name,
          email: user.email,
          accountType: user.accountType
        },
        formId: this.formId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new JotFormService();