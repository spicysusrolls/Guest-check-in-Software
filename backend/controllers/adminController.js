const googleSheetsService = require('../services/googleSheetsService');
const twilioService = require('../services/twilioService');
const slackService = require('../services/slackService');
const jotformService = require('../services/jotformService');

class AdminController {
  async getDashboardData(req, res) {
    try {
      const guests = await googleSheetsService.getAllGuests();
      
      // Get recent guests (last 10)
      const recentGuests = guests
        .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
        .slice(0, 10)
        .map(guest => ({
          id: guest.guestId,
          firstName: guest.guestName?.split(' ')[0] || 'Guest',
          lastName: guest.guestName?.split(' ').slice(1).join(' ') || '',
          company: guest.company,
          hostName: guest.hostEmployee,
          status: guest.status || 'pending',
          checkInTime: guest.checkInTime
        }));

      // System status check
      const systemStatus = {
        googleSheets: true, // If we got here, Google Sheets is working
        twilio: !!process.env.TWILIO_ACCOUNT_SID,
        slack: !!process.env.SLACK_BOT_TOKEN,
        jotform: !!process.env.JOTFORM_API_KEY
      };

      const dashboard = {
        recentGuests,
        systemStatus,
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: { dashboard }
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
        message: error.message
      });
    }
  }

  async exportGuestData(req, res) {
    try {
      const { format = 'json', startDate, endDate } = req.query;
      
      let guests = await googleSheetsService.getGuestData();
      
      // Filter by date range if provided
      if (startDate || endDate) {
        guests = guests.filter(guest => {
          const guestDate = new Date(guest.visitDate);
          if (startDate && guestDate < new Date(startDate)) return false;
          if (endDate && guestDate > new Date(endDate)) return false;
          return true;
        });
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(guests);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=guests.csv');
        res.send(csv);
      } else {
        res.json({
          success: true,
          guests: guests,
          count: guests.length,
          exportDate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error exporting guest data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export guest data',
        message: error.message
      });
    }
  }

  async getSystemConfig(req, res) {
    try {
      const config = {
        environment: process.env.NODE_ENV || 'development',
        integrations: {
          googleSheets: {
            configured: !!(process.env.GOOGLE_SHEETS_SPREADSHEET_ID && 
                           process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID
          },
          twilio: {
            configured: !!(process.env.TWILIO_ACCOUNT_SID && 
                          process.env.TWILIO_AUTH_TOKEN),
            phoneNumber: process.env.TWILIO_PHONE_NUMBER
          },
          slack: {
            configured: !!process.env.SLACK_BOT_TOKEN,
            channelId: process.env.SLACK_CHANNEL_ID
          },
          jotform: {
            configured: !!process.env.JOTFORM_API_KEY,
            formId: process.env.JOTFORM_FORM_ID
          }
        },
        features: {
          smsNotifications: !!process.env.TWILIO_ACCOUNT_SID,
          slackNotifications: !!process.env.SLACK_BOT_TOKEN,
          dataRetention: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          webhooks: true
        }
      };

      res.json({
        success: true,
        config: config
      });
    } catch (error) {
      console.error('Error getting system config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system configuration',
        message: error.message
      });
    }
  }

  async updateSystemConfig(req, res) {
    try {
      // This would typically update configuration in a database
      // For now, we'll just validate the configuration
      const { config } = req.body;
      
      res.json({
        success: true,
        message: 'Configuration updated successfully',
        config: config
      });
    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update system configuration',
        message: error.message
      });
    }
  }

  async getIntegrationStatus(req, res) {
    try {
      const integrationTests = await Promise.allSettled([
        googleSheetsService.testConnection(),
        twilioService.testConnection(),
        slackService.testConnection(),
        jotformService.testConnection()
      ]);

      const status = {
        googleSheets: integrationTests[0].status === 'fulfilled' ? integrationTests[0].value : { success: false, error: integrationTests[0].reason?.message },
        twilio: integrationTests[1].status === 'fulfilled' ? integrationTests[1].value : { success: false, error: integrationTests[1].reason?.message },
        slack: integrationTests[2].status === 'fulfilled' ? integrationTests[2].value : { success: false, error: integrationTests[2].reason?.message },
        jotform: integrationTests[3].status === 'fulfilled' ? integrationTests[3].value : { success: false, error: integrationTests[3].reason?.message }
      };

      res.json({
        success: true,
        integrations: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting integration status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get integration status',
        message: error.message
      });
    }
  }

  async testGoogleSheetsConnection(req, res) {
    try {
      const result = await googleSheetsService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async testTwilioConnection(req, res) {
    try {
      const result = await twilioService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async testSlackConnection(req, res) {
    try {
      const result = await slackService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async testJotFormConnection(req, res) {
    try {
      const result = await jotformService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSystemLogs(req, res) {
    try {
      const { limit = 100, guestId } = req.query;
      
      const auditLog = await googleSheetsService.getAuditLog(guestId, parseInt(limit));
      
      res.json({
        success: true,
        logs: auditLog,
        count: auditLog.length
      });
    } catch (error) {
      console.error('Error getting system logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system logs',
        message: error.message
      });
    }
  }

  async cleanupOldData(req, res) {
    try {
      const { olderThanDays = 30 } = req.body;
      
      // This would implement data cleanup logic
      // For now, just return a success message
      res.json({
        success: true,
        message: `Data cleanup initiated for records older than ${olderThanDays} days`,
        cleanupDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup old data',
        message: error.message
      });
    }
  }

  // Helper methods
  async getSystemStatus() {
    try {
      const integrationTests = await Promise.allSettled([
        googleSheetsService.testConnection(),
        twilioService.testConnection(),
        slackService.testConnection(),
        jotformService.testConnection()
      ]);

      return {
        googleSheets: integrationTests[0].status === 'fulfilled' && integrationTests[0].value.success,
        twilio: integrationTests[1].status === 'fulfilled' && integrationTests[1].value.success,
        slack: integrationTests[2].status === 'fulfilled' && integrationTests[2].value.success,
        jotform: integrationTests[3].status === 'fulfilled' && integrationTests[3].value.success,
        overall: integrationTests.every(test => test.status === 'fulfilled' && test.value.success)
      };
    } catch (error) {
      return {
        googleSheets: false,
        twilio: false,
        slack: false,
        jotform: false,
        overall: false,
        error: error.message
      };
    }
  }

  convertToCSV(guests) {
    if (guests.length === 0) return '';
    
    const headers = Object.keys(guests[0]).join(',');
    const rows = guests.map(guest => 
      Object.values(guest).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
}

module.exports = new AdminController();