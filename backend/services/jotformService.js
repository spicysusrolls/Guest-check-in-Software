const axios = require('axios');

class JotFormService {
  constructor() {
    this.apiKey = process.env.JOTFORM_API_KEY;
    this.formId = process.env.JOTFORM_FORM_ID;
    this.webhookSecret = process.env.JOTFORM_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.jotform.com';
  }

  initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('JotForm API key not configured');
      }

      console.log('✅ JotForm service initialized successfully');
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
        firstName: this.getAnswerValue(answers, 'first_name', 'firstName') || '',
        lastName: this.getAnswerValue(answers, 'last_name', 'lastName') || '',
        email: this.getAnswerValue(answers, 'email') || '',
        phoneNumber: this.getAnswerValue(answers, 'phone_number', 'phoneNumber', 'phone') || '',
        company: this.getAnswerValue(answers, 'company', 'organization') || '',
        hostName: this.getAnswerValue(answers, 'host_name', 'hostName', 'host') || '',
        hostEmail: this.getAnswerValue(answers, 'host_email', 'hostEmail') || '',
        purposeOfVisit: this.getAnswerValue(answers, 'purpose_of_visit', 'purposeOfVisit', 'purpose', 'reason') || '',
        expectedDuration: this.getAnswerValue(answers, 'expected_duration', 'expectedDuration', 'duration') || '',
        specialRequirements: this.getAnswerValue(answers, 'special_requirements', 'specialRequirements', 'requirements', 'notes') || '',
        visitDate: this.getAnswerValue(answers, 'visit_date', 'visitDate', 'date') || new Date().toISOString().split('T')[0],
        status: 'pending',
        createdAt: rawSubmission.created_at,
        updatedAt: rawSubmission.updated_at,
        formId: rawSubmission.form_id,
        rawData: rawSubmission // Keep original data for debugging
      };

      // Generate unique ID for the guest
      guestData.id = this.generateGuestId(guestData);

      return guestData;
    } catch (error) {
      console.error('❌ Failed to parse submission:', error.message);
      return null;
    }
  }

  getAnswerValue(answers, ...possibleKeys) {
    // Try to find the answer by various possible key names
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
      console.log('📝 Processing JotForm webhook submission');
      
      // Verify webhook if secret is configured
      if (this.webhookSecret && webhookData.headers) {
        const isValid = this.verifyWebhook(webhookData.headers, webhookData.body);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Parse the submission data
      let submissionData;
      
      if (webhookData.rawRequest) {
        // Handle raw form data
        submissionData = this.parseRawSubmission(webhookData.rawRequest);
      } else if (webhookData.submission) {
        // Handle structured submission data
        submissionData = this.parseSubmission(webhookData.submission);
      } else {
        throw new Error('No valid submission data found in webhook');
      }

      console.log(`✅ JotForm submission processed for ${submissionData.firstName} ${submissionData.lastName}`);
      
      return {
        success: true,
        guestData: submissionData
      };
    } catch (error) {
      console.error('❌ Failed to process JotForm webhook:', error.message);
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