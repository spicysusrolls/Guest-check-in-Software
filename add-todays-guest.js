require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function addTodaysGuest() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const guestSheet = doc.sheetsByTitle['Guest Data'];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`\n✨ Adding test guest for TODAY (${today})...\n`);

    await guestSheet.addRow({
      'ID': `today_test_${Date.now()}`,
      'Full Name': 'Alice Cooper',
      'First Name': 'Alice',
      'Last Name': 'Cooper',
      'Email': 'alice.cooper@todaytest.com',
      'Phone Number': '(555) 123-9999',
      'Company': 'Today Test Industries',
      'Title': 'CEO',
      'Host Name': 'Kevin Nguyen',
      'Host Email': 'kevin@company.com',
      'Purpose of Visit': 'Testing Today\'s Dashboard',
      'Kitchen Visit': 'yes',
      'Status': 'checked-in',
      'Check-in Time': new Date().toISOString(),
      'Visit Date': today,
      'Created At': new Date().toISOString(),
      'Updated At': new Date().toISOString()
    });

    console.log('✅ Successfully added today\'s guest: Alice Cooper');
    console.log('🎯 Status: checked-in');
    console.log('📅 Visit Date:', today);
    console.log('\n✨ Refresh your dashboard to see the updated counts!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTodaysGuest();
