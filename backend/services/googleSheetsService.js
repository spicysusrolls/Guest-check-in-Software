const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const logger = require('../config/logger');

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY;
    this.doc = null;
    this.guestSheet = null;
    this.auditSheet = null;
    
    // In-memory storage for development mode
    this.developmentGuests = [];
    
    // Set development mode based on environment
    this.isDevelopmentMode = (process.env.NODE_ENV === 'development' && this.spreadsheetId === 'development_mode');
    
    if (this.isDevelopmentMode) {
      logger.info('Google Sheets Service initialized in development mode');
    }
  }

  async initialize() {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development' && this.spreadsheetId === 'development_mode') {
        console.log('📝 Google Sheets Service: Running in development mode with mock data');
        this.isDevelopmentMode = true;
        return true;
      }

      if (!this.spreadsheetId || !this.serviceAccountEmail || !this.privateKey) {
        throw new Error('Google Sheets credentials not properly configured');
      }

      // Create JWT auth client
      const serviceAccountAuth = new JWT({
        email: this.serviceAccountEmail,
        key: this.privateKey.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      // Initialize the spreadsheet
      this.doc = new GoogleSpreadsheet(this.spreadsheetId, serviceAccountAuth);
      await this.doc.loadInfo();

      // Setup worksheets
      await this.setupWorksheets();

      console.log('✅ Google Sheets service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets service:', error.message);
      throw error;
    }
  }

  async setupWorksheets() {
    try {
      // Check if Guest Data sheet exists
      this.guestSheet = this.doc.sheetsByTitle['Guest Data'];
      if (!this.guestSheet) {
        this.guestSheet = await this.doc.addSheet({
          title: 'Guest Data',
          headerValues: [
            'ID',
            'Full Name',
            'First Name',
            'Last Name',
            'Email',
            'Phone Number',
            'Company',
            'Title',
            'Host Name',
            'Host Email',
            'Purpose of Visit',
            'Kitchen Visit',
            'Photo',
            'Status',
            'Check-in Time',
            'Check-out Time',
            'Visit Date',
            'Created At',
            'Updated At'
          ]
        });
      }

      // Check if Audit Log sheet exists
      this.auditSheet = this.doc.sheetsByTitle['Audit Log'];
      if (!this.auditSheet) {
        this.auditSheet = await this.doc.addSheet({
          title: 'Audit Log',
          headerValues: [
            'Timestamp',
            'Guest ID',
            'Guest Name',
            'Action',
            'Previous Status',
            'New Status',
            'Performed By',
            'Notes',
            'IP Address'
          ]
        });
      }

      console.log('✅ Google Sheets worksheets setup complete');
    } catch (error) {
      console.error('❌ Failed to setup worksheets:', error.message);
      throw error;
    }
  }

  async addGuest(guestData) {
    try {
      // Handle development mode - actually store the data
      if (this.isDevelopmentMode) {
        console.log('📝 Development Mode: Adding real JotForm guest to memory:', guestData.firstName, guestData.lastName);
        
        // Create a complete guest record
        const guestRecord = {
          id: guestData.id,
          fullName: guestData.fullName || `${guestData.firstName} ${guestData.lastName}`.trim(),
          firstName: guestData.firstName,
          lastName: guestData.lastName,
          email: guestData.email,
          phoneNumber: guestData.phoneNumber,
          company: guestData.company || '',
          title: guestData.title || '',
          hostName: guestData.hostName,
          hostEmail: guestData.hostEmail || '',
          purposeOfVisit: guestData.purposeOfVisit || '',
          kitchenVisit: guestData.kitchenVisit || 'no',
          photo: guestData.photo || '',
          status: guestData.status || 'pending',
          checkInTime: guestData.checkInTime || '',
          checkOutTime: guestData.checkOutTime || '',
          visitDate: guestData.visitDate || new Date().toISOString().split('T')[0],
          createdAt: guestData.createdAt || new Date().toISOString(),
          notes: guestData.notes || ''
        };
        
        // Store in development array
        this.developmentGuests.push(guestRecord);
        
        return {
          success: true,
          id: guestData.id,
          message: 'Guest added successfully (development mode)',
          rowIndex: this.developmentGuests.length
        };
      }

      if (!this.guestSheet) {
        await this.initialize();
      }

      const timestamp = new Date().toISOString();
      const rowData = {
        'ID': guestData.id,
        'Full Name': guestData.fullName || `${guestData.firstName} ${guestData.lastName}`.trim(),
        'First Name': guestData.firstName,
        'Last Name': guestData.lastName,
        'Email': guestData.email,
        'Phone Number': guestData.phoneNumber,
        'Company': guestData.company || '',
        'Title': guestData.title || '',
        'Host Name': guestData.hostName,
        'Host Email': guestData.hostEmail || '',
        'Purpose of Visit': guestData.purposeOfVisit,
        'Kitchen Visit': guestData.kitchenVisit || 'no',
        'Photo': guestData.photo || '',
        'Status': guestData.status || 'pending',
        'Check-in Time': '',
        'Check-out Time': '',
        'Visit Date': guestData.visitDate || new Date().toISOString().split('T')[0],
        'Created At': timestamp,
        'Updated At': timestamp
      };

      await this.guestSheet.addRow(rowData);
      
      // Log to audit sheet
      await this.logAuditEvent({
        guestId: guestData.id,
        guestName: `${guestData.firstName} ${guestData.lastName}`,
        action: 'GUEST_CREATED',
        newStatus: guestData.status || 'pending',
        performedBy: 'SYSTEM',
        notes: 'Guest record created from form submission'
      });

      console.log(`✅ Guest ${guestData.firstName} ${guestData.lastName} added to Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add guest to Google Sheets:', error.message);
      throw error;
    }
  }

  async updateGuestStatus(guestId, status, notes = '', performedBy = 'SYSTEM') {
    try {
      if (!this.guestSheet) {
        await this.initialize();
      }

      const rows = await this.guestSheet.getRows();
      const guestRow = rows.find(row => row.get('ID') === guestId);

      if (!guestRow) {
        throw new Error(`Guest with ID ${guestId} not found in spreadsheet`);
      }

      const previousStatus = guestRow.get('Status');
      const timestamp = new Date().toISOString();

      // Update guest row
      guestRow.set('Status', status);
      guestRow.set('Updated At', timestamp);

      if (status === 'checked-in') {
        guestRow.set('Check-in Time', timestamp);
      } else if (status === 'checked-out') {
        guestRow.set('Check-out Time', timestamp);
      }

      await guestRow.save();

      // Log to audit sheet
      await this.logAuditEvent({
        guestId: guestId,
        guestName: `${guestRow.get('First Name')} ${guestRow.get('Last Name')}`,
        action: 'STATUS_UPDATED',
        previousStatus: previousStatus,
        newStatus: status,
        performedBy: performedBy,
        notes: notes
      });

      console.log(`✅ Guest ${guestId} status updated to ${status} in Google Sheets`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update guest status in Google Sheets:', error.message);
      throw error;
    }
  }

  async logAuditEvent(eventData) {
    try {
      // Handle development mode
      if (this.isDevelopmentMode) {
        logger.info('Development Mode: Mock audit event logged', {
          action: eventData.action,
          guestId: eventData.guestId,
          performedBy: eventData.performedBy
        });
        return {
          success: true,
          message: 'Audit event logged (development mode)'
        };
      }

      if (!this.auditSheet) {
        await this.initialize();
      }

      const auditRow = {
        'Timestamp': new Date().toISOString(),
        'Guest ID': eventData.guestId,
        'Guest Name': eventData.guestName,
        'Action': eventData.action,
        'Previous Status': eventData.previousStatus || '',
        'New Status': eventData.newStatus || '',
        'Performed By': eventData.performedBy,
        'Notes': eventData.notes || '',
        'IP Address': eventData.ipAddress || ''
      };

      await this.auditSheet.addRow(auditRow);
      console.log(`✅ Audit event logged: ${eventData.action} for guest ${eventData.guestId}`);
    } catch (error) {
      console.error('❌ Failed to log audit event:', error.message);
      // Don't throw here as audit logging shouldn't break the main flow
    }
  }

  async getGuestData(guestId = null) {
    try {
      // Handle development mode with real JotForm submissions
      if (this.isDevelopmentMode) {
        console.log('📝 Development Mode: Retrieving real JotForm guest data from memory');
        
        if (guestId) {
          const guest = this.developmentGuests.find(g => g.id === guestId);
          return guest || null;
        }
        
        // Return all real JotForm guests, sorted by creation time (newest first)
        return this.developmentGuests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (!this.guestSheet) {
        await this.initialize();
      }

      const rows = await this.guestSheet.getRows();
      
      if (guestId) {
        const guestRow = rows.find(row => row.get('ID') === guestId);
        if (!guestRow) {
          return null;
        }
        return this.formatGuestRow(guestRow);
      }

      return rows.map(row => this.formatGuestRow(row));
    } catch (error) {
      console.error('❌ Failed to get guest data from Google Sheets:', error.message);
      throw error;
    }
  }

  formatGuestRow(row) {
    return {
      id: row.get('ID'),
      fullName: row.get('Full Name'),
      firstName: row.get('First Name'),
      lastName: row.get('Last Name'),
      email: row.get('Email'),
      phoneNumber: row.get('Phone Number'),
      company: row.get('Company'),
      title: row.get('Title'),
      hostName: row.get('Host Name'),
      hostEmail: row.get('Host Email'),
      purposeOfVisit: row.get('Purpose of Visit'),
      kitchenVisit: row.get('Kitchen Visit'),
      photo: row.get('Photo'),
      status: row.get('Status'),
      checkInTime: row.get('Check-in Time'),
      checkOutTime: row.get('Check-out Time'),
      visitDate: row.get('Visit Date'),
      createdAt: row.get('Created At'),
      updatedAt: row.get('Updated At')
    };
  }

  async getAuditLog(guestId = null, limit = 100) {
    try {
      if (!this.auditSheet) {
        await this.initialize();
      }

      const rows = await this.auditSheet.getRows();
      
      let filteredRows = rows;
      if (guestId) {
        filteredRows = rows.filter(row => row.get('Guest ID') === guestId);
      }

      // Sort by timestamp descending and limit
      return filteredRows
        .sort((a, b) => new Date(b.get('Timestamp')) - new Date(a.get('Timestamp')))
        .slice(0, limit)
        .map(row => ({
          timestamp: row.get('Timestamp'),
          guestId: row.get('Guest ID'),
          guestName: row.get('Guest Name'),
          action: row.get('Action'),
          previousStatus: row.get('Previous Status'),
          newStatus: row.get('New Status'),
          performedBy: row.get('Performed By'),
          notes: row.get('Notes'),
          ipAddress: row.get('IP Address')
        }));
    } catch (error) {
      console.error('❌ Failed to get audit log from Google Sheets:', error.message);
      throw error;
    }
  }

  async getAllGuests() {
    try {
      if (this.isDevelopmentMode) {
        return this.developmentGuests;
      }

      await this.initialize();
      const rows = await this.guestSheet.getRows();
      
      return rows.map(row => {
        const firstName = row.get('First Name') || '';
        const lastName = row.get('Last Name') || '';
        let fullName = row.get('Full Name') || row.get('Guest Name') || '';
        
        // Clean up the full name if it contains "undefined"
        if (fullName.includes('undefined')) {
          fullName = '';
        }
        
        // Construct guest name intelligently
        let guestName;
        if (fullName && fullName.trim()) {
          guestName = fullName.trim();
        } else if (firstName || lastName) {
          guestName = `${firstName} ${lastName}`.trim();
        } else {
          guestName = 'Guest';
        }
        
        return {
          guestId: row.get('ID') || row.get('Guest ID'),
          guestName,
          firstName,
          lastName,
          company: row.get('Company'),
          phoneNumber: row.get('Phone Number'),
          email: row.get('Email'),
          checkInDate: row.get('Visit Date') || row.get('Check-in Date'),
          checkInTime: row.get('Check-in Time'),
          hostEmployee: row.get('Host Name') || row.get('Host Employee'),
          hostEmail: row.get('Host Email'),
          visitPurpose: row.get('Purpose of Visit') || row.get('Visit Purpose'),
          status: row.get('Status') || 'pending',
          smsConsent: row.get('SMS Consent'),
          specialInstructions: row.get('Special Instructions')
        };
      });
    } catch (error) {
      logger.error('Failed to get all guests from Google Sheets', { 
        error: error.message,
        isDevelopmentMode: this.isDevelopmentMode 
      });
      // Return empty array instead of throwing to prevent dashboard crashes
      return [];
    }
  }

  async testConnection() {
    try {
      await this.initialize();
      const info = {
        title: this.doc.title,
        sheetCount: this.doc.sheetCount,
        sheets: this.doc.sheetsByIndex.map(sheet => sheet.title)
      };
      return { success: true, info };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GoogleSheetsService();