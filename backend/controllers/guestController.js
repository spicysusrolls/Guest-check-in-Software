const googleSheetsService = require('../services/googleSheetsService');
const twilioService = require('../services/twilioService');
const slackService = require('../services/slackService');
const { v4: uuidv4 } = require('uuid');

class GuestController {
  async getAllGuests(req, res) {
    try {
      const guests = await googleSheetsService.getAllGuests();
      
      res.json({
        success: true,
        data: {
          guests: guests,
          count: guests.length
        }
      });
    } catch (error) {
      console.error('Error getting all guests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve guests',
        message: error.message
      });
    }
  }

  async getGuestById(req, res) {
    try {
      const { id } = req.params;
      const guest = await googleSheetsService.getGuestData(id);
      
      if (!guest) {
        return res.status(404).json({
          success: false,
          error: 'Guest not found'
        });
      }

      res.json({
        success: true,
        guest: guest
      });
    } catch (error) {
      console.error('Error getting guest by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve guest',
        message: error.message
      });
    }
  }

  async createGuest(req, res) {
    try {
      const guestData = {
        id: uuidv4(),
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add guest to Google Sheets
      await googleSheetsService.addGuest(guestData);

      // Send welcome SMS to guest
      if (guestData.phoneNumber && guestData.notificationPreferences?.sms !== false) {
        await twilioService.sendGuestWelcomeMessage(guestData);
      }

      res.status(201).json({
        success: true,
        message: 'Guest created successfully',
        guest: guestData
      });
    } catch (error) {
      console.error('Error creating guest:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create guest',
        message: error.message
      });
    }
  }

  async updateGuestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      // Get current guest data
      const currentGuest = await googleSheetsService.getGuestData(id);
      if (!currentGuest) {
        return res.status(404).json({
          success: false,
          error: 'Guest not found'
        });
      }

      const previousStatus = currentGuest.status;
      
      // Update status in Google Sheets
      await googleSheetsService.updateGuestStatus(id, status, notes, 'API');

      // Get updated guest data
      const updatedGuest = await googleSheetsService.getGuestData(id);

      // Send notifications based on status change
      await this.handleStatusChangeNotifications(updatedGuest, status, previousStatus);

      res.json({
        success: true,
        message: `Guest status updated to ${status}`,
        guest: updatedGuest,
        previousStatus: previousStatus
      });
    } catch (error) {
      console.error('Error updating guest status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update guest status',
        message: error.message
      });
    }
  }

  async checkInGuest(req, res) {
    try {
      const { id } = req.params;
      
      // Get current guest data
      const guest = await googleSheetsService.getGuestData(id);
      if (!guest) {
        return res.status(404).json({
          success: false,
          error: 'Guest not found'
        });
      }

      // Update status to checked-in
      await googleSheetsService.updateGuestStatus(id, 'checked-in', 'Guest checked in at reception', 'RECEPTIONIST');

      // Get updated guest data
      const updatedGuest = await googleSheetsService.getGuestData(id);

      // Send notifications
      await this.handleCheckinNotifications(updatedGuest);

      res.json({
        success: true,
        message: 'Guest checked in successfully',
        guest: updatedGuest
      });
    } catch (error) {
      console.error('Error checking in guest:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check in guest',
        message: error.message
      });
    }
  }

  async checkOutGuest(req, res) {
    try {
      const { id } = req.params;
      
      // Update status to checked-out
      await googleSheetsService.updateGuestStatus(id, 'checked-out', 'Guest checked out', 'RECEPTIONIST');

      // Get updated guest data
      const updatedGuest = await googleSheetsService.getGuestData(id);

      // Send checkout notifications
      await this.handleCheckoutNotifications(updatedGuest);

      res.json({
        success: true,
        message: 'Guest checked out successfully',
        guest: updatedGuest
      });
    } catch (error) {
      console.error('Error checking out guest:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check out guest',
        message: error.message
      });
    }
  }

  async notifyHost(req, res) {
    try {
      const { id } = req.params;
      const { hostPhone, customMessage } = req.body;
      
      const guest = await googleSheetsService.getGuestData(id);
      if (!guest) {
        return res.status(404).json({
          success: false,
          error: 'Guest not found'
        });
      }

      const phoneToUse = hostPhone || guest.hostPhone;
      
      if (!phoneToUse) {
        return res.status(400).json({
          success: false,
          error: 'Host phone number not available'
        });
      }

      // Send SMS to host
      const smsResult = await twilioService.sendHostNotification(phoneToUse, guest);
      
      // Send Slack notification
      const slackResult = await slackService.sendGuestArrivalNotification(guest);

      res.json({
        success: true,
        message: 'Host notifications sent',
        smsResult: smsResult,
        slackResult: slackResult
      });
    } catch (error) {
      console.error('Error notifying host:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to notify host',
        message: error.message
      });
    }
  }

  async sendSmsToGuest(req, res) {
    try {
      const { id } = req.params;
      const { message, phoneNumber } = req.body;
      
      const guest = await googleSheetsService.getGuestData(id);
      if (!guest) {
        return res.status(404).json({
          success: false,
          error: 'Guest not found'
        });
      }

      const phoneToUse = phoneNumber || guest.phoneNumber;
      
      if (!phoneToUse) {
        return res.status(400).json({
          success: false,
          error: 'Phone number not available'
        });
      }

      const result = await twilioService.sendCustomMessage(phoneToUse, message);

      res.json({
        success: true,
        message: 'SMS sent successfully',
        result: result
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS',
        message: error.message
      });
    }
  }

  async getGuestStats(req, res) {
    try {
      const guests = await googleSheetsService.getAllGuests();
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Filter today's guests by comparing date strings
      const todaysGuests = guests.filter(guest => {
        return guest.checkInDate === today;
      });
      
      const stats = {
        total: guests.length,
        today: {
          total: todaysGuests.length,
          pending: todaysGuests.filter(g => g.status === 'pending').length,
          checkedIn: todaysGuests.filter(g => g.status === 'checked-in').length,
          withHost: todaysGuests.filter(g => g.status === 'with-host').length,
          checkedOut: todaysGuests.filter(g => g.status === 'checked-out').length,
          cancelled: todaysGuests.filter(g => g.status === 'cancelled').length
        },
        currentlyInOffice: guests.filter(g => 
          ['checked-in', 'with-host'].includes(g.status)
        ).length,
        thisWeek: guests.filter(guest => {
          const guestDate = new Date(guest.checkInDate);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return guestDate >= weekAgo;
        }).length
      };

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting guest stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get guest statistics',
        message: error.message
      });
    }
  }

  async getTodaysGuests(req, res) {
    try {
      const guests = await googleSheetsService.getAllGuests();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysGuests = guests.filter(guest => {
        const guestDate = new Date(guest.checkInDate);
        return guestDate >= today;
      });

      res.json({
        success: true,
        data: { guests: todaysGuests }
      });
    } catch (error) {
      console.error('Error getting today\'s guests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get today\'s guests',
        message: error.message
      });
    }
  }

  async getCheckedInGuests(req, res) {
    try {
      const guests = await googleSheetsService.getAllGuests();
      
      const checkedInGuests = guests.filter(guest => 
        guest.status === 'checked-in' || guest.status === 'with-host'
      );

      res.json({
        success: true,
        data: { guests: checkedInGuests }
      });
    } catch (error) {
      console.error('Error getting checked-in guests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checked-in guests',
        message: error.message
      });
    }
  }

  // Helper methods for notifications
  async handleStatusChangeNotifications(guest, newStatus, previousStatus) {
    try {
      // Send SMS notification to guest
      if (guest.phoneNumber && guest.notificationPreferences?.sms !== false) {
        await twilioService.sendStatusUpdateMessage(guest, newStatus);
      }

      // Send Slack notification for status changes
      if (guest.notificationPreferences?.slack !== false) {
        await slackService.sendStatusUpdateNotification(guest, newStatus, previousStatus);
      }
    } catch (error) {
      console.error('Error sending status change notifications:', error);
    }
  }

  async handleCheckinNotifications(guest) {
    try {
      // Send SMS to guest
      if (guest.phoneNumber && guest.notificationPreferences?.sms !== false) {
        await twilioService.sendStatusUpdateMessage(guest, 'checked-in');
      }

      // Send Slack notification about guest arrival
      if (guest.notificationPreferences?.slack !== false) {
        await slackService.sendGuestArrivalNotification(guest);
      }

      // Notify host via SMS if phone number available
      if (guest.hostPhone && guest.notificationPreferences?.sms !== false) {
        await twilioService.sendHostNotification(guest.hostPhone, guest);
      }
    } catch (error) {
      console.error('Error sending check-in notifications:', error);
    }
  }

  async handleCheckoutNotifications(guest) {
    try {
      // Send SMS to guest
      if (guest.phoneNumber && guest.notificationPreferences?.sms !== false) {
        await twilioService.sendStatusUpdateMessage(guest, 'checked-out');
      }

      // Send Slack notification
      if (guest.notificationPreferences?.slack !== false) {
        await slackService.sendStatusUpdateNotification(guest, 'checked-out', 'with-host');
      }
    } catch (error) {
      console.error('Error sending check-out notifications:', error);
    }
  }
}

module.exports = new GuestController();