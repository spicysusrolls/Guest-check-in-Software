const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { validateGuestData } = require('../middleware/validation');

// Get all guests
router.get('/', guestController.getAllGuests);

// Get guest by ID
router.get('/:id', guestController.getGuestById);

// Create new guest (from JotForm or manual entry)
router.post('/', validateGuestData, guestController.createGuest);

// Update guest status
router.put('/:id/status', guestController.updateGuestStatus);

// Check in guest
router.post('/:id/checkin', guestController.checkInGuest);

// Check out guest
router.post('/:id/checkout', guestController.checkOutGuest);

// Send notification to host
router.post('/:id/notify-host', guestController.notifyHost);

// Send SMS to guest
router.post('/:id/send-sms', guestController.sendSmsToGuest);

// Get guest statistics
router.get('/stats/summary', guestController.getGuestStats);

module.exports = router;