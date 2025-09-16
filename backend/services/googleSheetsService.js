const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY;
    this.doc = null;
    this.guestSheet = null;
    this.auditSheet = null;
  }

  async initialize() {
    try {
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
            'First Name',
            'Last Name',
            'Email',
            'Phone Number',
            'Company',
            'Host Name',
            'Host Email',
            'Purpose of Visit',
            'Expected Duration',
            'Special Requirements',
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
      if (!this.guestSheet) {
        await this.initialize();
      }

      const timestamp = new Date().toISOString();
      const rowData = {
        'ID': guestData.id,
        'First Name': guestData.firstName,
        'Last Name': guestData.lastName,
        'Email': guestData.email,
        'Phone Number': guestData.phoneNumber,
        'Company': guestData.company || '',
        'Host Name': guestData.hostName,
        'Host Email': guestData.hostEmail || '',
        'Purpose of Visit': guestData.purposeOfVisit,
        'Expected Duration': guestData.expectedDuration || '',
        'Special Requirements': guestData.specialRequirements || '',
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
      firstName: row.get('First Name'),
      lastName: row.get('Last Name'),
      email: row.get('Email'),
      phoneNumber: row.get('Phone Number'),
      company: row.get('Company'),
      hostName: row.get('Host Name'),
      hostEmail: row.get('Host Email'),
      purposeOfVisit: row.get('Purpose of Visit'),
      expectedDuration: row.get('Expected Duration'),
      specialRequirements: row.get('Special Requirements'),
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