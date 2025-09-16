const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all admin routes
router.use(requireAuth);

// Dashboard data
router.get('/dashboard', adminController.getDashboardData);

// Export guest data
router.get('/export/guests', adminController.exportGuestData);

// System configuration
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);

// Integration status
router.get('/integrations/status', adminController.getIntegrationStatus);

// Test integrations
router.post('/integrations/test/google-sheets', adminController.testGoogleSheetsConnection);
router.post('/integrations/test/twilio', adminController.testTwilioConnection);
router.post('/integrations/test/slack', adminController.testSlackConnection);
router.post('/integrations/test/jotform', adminController.testJotFormConnection);

// Logs
router.get('/logs', adminController.getSystemLogs);

// Clear old data
router.delete('/data/cleanup', adminController.cleanupOldData);

module.exports = router;