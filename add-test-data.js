require('dotenv').config();
const googleSheetsService = require('./backend/services/googleSheetsService');

console.log('================================================================');
console.log('🧪 GUEST CHECK-IN SYSTEM - TEST DATA GENERATOR');
console.log('================================================================');

const testGuests = [
  {
    guestName: "Sarah Johnson",
    companyName: "Tech Solutions Inc",
    phoneNumber: "+1-555-TECH-001",
    email: "sarah.johnson@techsolutions.com",
    checkInDate: "2025-09-30",
    visitPurpose: "Client meeting with sales team",
    hostEmployee: "Kevin Nguyen",
    smsConsent: "Yes",
    status: "checked-in"
  },
  {
    guestName: "Michael Chen",
    companyName: "Digital Marketing Pro",
    phoneNumber: "+1-555-MARKET-02",
    email: "michael.chen@digitalmarketing.com",
    checkInDate: "2025-09-30",
    visitPurpose: "Partnership discussion",
    hostEmployee: "Kevin Nguyen",
    smsConsent: "Yes",
    status: "with-host"
  },
  {
    guestName: "Emily Rodriguez",
    companyName: "Global Consulting",
    phoneNumber: "+1-555-CONSULT-3",
    email: "emily.rodriguez@globalconsult.com",
    checkInDate: "2025-09-30",
    visitPurpose: "Project review meeting",
    hostEmployee: "Kevin Nguyen",
    smsConsent: "Yes",
    status: "checked-out"
  },
  {
    guestName: "David Thompson",
    companyName: "Innovation Labs",
    phoneNumber: "+1-555-INNOV-004",
    email: "david.thompson@innovlabs.com",
    checkInDate: "2025-09-30",
    visitPurpose: "Technical presentation",
    hostEmployee: "Kevin Nguyen",
    smsConsent: "No",
    status: "pending"
  },
  {
    guestName: "Lisa Wang",
    companyName: "Future Systems Corp",
    phoneNumber: "+1-555-FUTURE-05",
    email: "lisa.wang@futuresys.com",
    checkInDate: "2025-09-29",
    visitPurpose: "System integration demo",
    hostEmployee: "Kevin Nguyen",
    smsConsent: "Yes",
    status: "checked-out"
  },
  {
    guestName: "James Parker",
    companyName: "Enterprise Solutions",
    phoneNumber: "+1-555-ENTER-006",
    email: "james.parker@enterprise.com",
    checkInDate: "2025-09-29",
    visitPurpose: "Contract negotiation",
    hostEmployee: "Kevin Nguyen",
    smsConsent: "Yes",
    status: "checked-out"
  }
];

async function addTestData() {
  try {
    console.log('🔧 Initializing Google Sheets service...');
    await googleSheetsService.initialize();
    console.log('✅ Google Sheets service initialized successfully');
    
    console.log('📊 Adding test guest data...');
    console.log('================================================================');
    
    for (let i = 0; i < testGuests.length; i++) {
      const guest = testGuests[i];
      console.log(`📝 Adding Guest ${i + 1}/${testGuests.length}: ${guest.guestName}`);
      
      try {
        // Create guest data with proper structure
        const guestData = {
          guestId: `TEST_${Date.now()}_${i}`,
          guestName: guest.guestName,
          company: guest.companyName,
          phoneNumber: guest.phoneNumber,
          email: guest.email,
          checkInDate: guest.checkInDate,
          visitPurpose: guest.visitPurpose,
          hostEmployee: guest.hostEmployee,
          smsConsent: guest.smsConsent,
          status: guest.status,
          checkInTime: guest.status === 'checked-in' || guest.status === 'with-host' ? new Date().toISOString() : null,
          checkOutTime: guest.status === 'checked-out' ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await googleSheetsService.addGuest(guestData);
        console.log(`   ✅ Added: ${guest.guestName} - Status: ${guest.status}`);
        
        // Add a small delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Failed to add ${guest.guestName}: ${error.message}`);
      }
    }
    
    console.log('================================================================');
    console.log('🎉 TEST DATA GENERATION COMPLETE!');
    console.log('================================================================');
    
    // Verify the data was added
    console.log('🔍 Verifying added data...');
    const allGuests = await googleSheetsService.getAllGuests();
    console.log(`📊 Total guests in system: ${allGuests.length}`);
    
    // Show summary by status
    const statusCounts = {
      'checked-in': 0,
      'with-host': 0,
      'checked-out': 0,
      'pending': 0
    };
    
    allGuests.forEach(guest => {
      if (statusCounts.hasOwnProperty(guest.status)) {
        statusCounts[guest.status]++;
      }
    });
    
    console.log('📈 Guest Status Summary:');
    console.log(`   👥 Currently Checked In: ${statusCounts['checked-in']}`);
    console.log(`   🤝 With Host: ${statusCounts['with-host']}`);
    console.log(`   ✅ Checked Out: ${statusCounts['checked-out']}`);
    console.log(`   ⏳ Pending: ${statusCounts['pending']}`);
    
    console.log('================================================================');
    console.log('✨ Your dashboard should now show live guest data!');
    console.log('🌐 Open: http://127.0.0.1:3001 to view the populated dashboard');
    console.log('================================================================');
    
  } catch (error) {
    console.error('❌ Failed to add test data:', error.message);
    console.error('Full error:', error);
  }
}

// Add command line options
const command = process.argv[2];

if (command === 'clear') {
  console.log('🧹 CLEARING ALL TEST DATA...');
  console.log('This feature is not implemented for safety.');
  console.log('To clear data, manually delete rows in your Google Sheet.');
} else {
  console.log('📝 Starting test data generation...');
  console.log('   To clear data later, run: node add-test-data.js clear');
  console.log('');
  addTestData();
}