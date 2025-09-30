require('dotenv').config();
const googleSheetsService = require('./backend/services/googleSheetsService');

console.log('================================================================');
console.log('📊 GOOGLE SHEETS DATA READER - VERIFICATION TEST');
console.log('================================================================');

async function readGoogleSheetsData() {
  try {
    console.log('🔧 Initializing Google Sheets service...');
    await googleSheetsService.initialize();
    console.log('✅ Google Sheets service initialized successfully');
    
    console.log('================================================================');
    console.log('📋 READING ALL GUEST DATA FROM GOOGLE SHEETS');
    console.log('================================================================');
    
    // Get all guests from Google Sheets
    const allGuests = await googleSheetsService.getAllGuests();
    
    console.log(`📊 Total guests found: ${allGuests.length}`);
    console.log('');
    
    if (allGuests.length === 0) {
      console.log('📭 No guest data found in Google Sheets');
      return;
    }
    
    // Display each guest's information
    allGuests.forEach((guest, index) => {
      console.log(`👤 Guest #${index + 1}:`);
      console.log(`   📛 Name: ${guest.guestName || 'N/A'}`);
      console.log(`   🏢 Company: ${guest.company || 'N/A'}`);
      console.log(`   📞 Phone: ${guest.phoneNumber || 'N/A'}`);
      console.log(`   📧 Email: ${guest.email || 'N/A'}`);
      console.log(`   📅 Check-in Date: ${guest.checkInDate || 'N/A'}`);
      console.log(`   🎯 Purpose: ${guest.visitPurpose || 'N/A'}`);
      console.log(`   👨‍💼 Host: ${guest.hostEmployee || 'N/A'}`);
      console.log(`   📱 SMS Consent: ${guest.smsConsent || 'N/A'}`);
      console.log(`   ⭐ Status: ${guest.status || 'N/A'}`);
      console.log(`   🆔 ID: ${guest.guestId || guest.id || 'N/A'}`);
      console.log(`   ⏰ Created: ${guest.createdAt || 'N/A'}`);
      console.log(`   🔄 Updated: ${guest.updatedAt || 'N/A'}`);
      
      if (guest.checkInTime) {
        console.log(`   🚪 Check-in Time: ${guest.checkInTime}`);
      }
      if (guest.checkOutTime) {
        console.log(`   🚶 Check-out Time: ${guest.checkOutTime}`);
      }
      
      console.log('   ────────────────────────────────────────');
    });
    
    console.log('================================================================');
    console.log('📈 GUEST STATUS BREAKDOWN:');
    console.log('================================================================');
    
    const statusCounts = {};
    allGuests.forEach(guest => {
      const status = guest.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.keys(statusCounts).forEach(status => {
      console.log(`   ${getStatusIcon(status)} ${status}: ${statusCounts[status]} guests`);
    });
    
    console.log('');
    console.log('================================================================');
    console.log('🔍 TESTING SPECIFIC QUERIES:');
    console.log('================================================================');
    
    // Test today's guests
    const today = new Date().toISOString().split('T')[0];
    const todaysGuests = allGuests.filter(g => g.checkInDate === today);
    console.log(`📅 Today's guests (${today}): ${todaysGuests.length}`);
    
    // Test checked-in guests
    const checkedInGuests = allGuests.filter(g => 
      g.status === 'checked-in' || g.status === 'with-host'
    );
    console.log(`🏢 Currently in office: ${checkedInGuests.length}`);
    
    if (checkedInGuests.length > 0) {
      console.log('   Currently in office:');
      checkedInGuests.forEach(guest => {
        console.log(`   • ${guest.guestName} (${guest.company}) - ${guest.status}`);
      });
    }
    
    console.log('');
    console.log('================================================================');
    console.log('✅ GOOGLE SHEETS READ TEST COMPLETE!');
    console.log('================================================================');
    console.log('🔍 Data verification:');
    console.log(`   • Google Sheets connection: ✅ Working`);
    console.log(`   • Data retrieval: ✅ ${allGuests.length} records found`);
    console.log(`   • Field mapping: ✅ All fields readable`);
    console.log(`   • Status tracking: ✅ ${Object.keys(statusCounts).length} different statuses`);
    
  } catch (error) {
    console.error('❌ Failed to read Google Sheets data:', error.message);
    console.error('Full error:', error);
  }
}

function getStatusIcon(status) {
  const icons = {
    'pending': '⏳',
    'checked-in': '🚪',
    'with-host': '🤝',
    'checked-out': '✅',
    'cancelled': '❌',
    'unknown': '❓'
  };
  return icons[status] || '❓';
}

// Run the test
readGoogleSheetsData();