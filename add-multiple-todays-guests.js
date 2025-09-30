require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function addTodaysGuests() {
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
    const now = new Date().toISOString();

    console.log(`\n✨ Adding test guests for TODAY (${today})...\n`);

    const guestsToAdd = [
      {
        name: 'Bob Smith',
        company: 'ABC Corporation',
        status: 'checked-in',
        phone: '(555) 111-2222'
      },
      {
        name: 'Carol Johnson',
        company: 'XYZ Industries',
        status: 'with-host',
        phone: '(555) 333-4444'
      },
      {
        name: 'David Williams',
        company: 'Tech Startup Inc',
        status: 'pending',
        phone: '(555) 555-6666'
      }
    ];

    for (const guest of guestsToAdd) {
      const [firstName, lastName] = guest.name.split(' ');
      
      await guestSheet.addRow({
        'ID': `today_${Date.now()}`,
        'Full Name': guest.name,
        'First Name': firstName,
        'Last Name': lastName,
        'Email': `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${guest.company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        'Phone Number': guest.phone,
        'Company': guest.company,
        'Title': 'Visitor',
        'Host Name': 'Kevin Nguyen',
        'Host Email': 'kevin@company.com',
        'Purpose of Visit': 'Testing Dashboard for Today',
        'Kitchen Visit': 'no',
        'Status': guest.status,
        'Check-in Time': guest.status !== 'pending' ? now : '',
        'Visit Date': today,
        'Created At': now,
        'Updated At': now
      });

      console.log(`✅ Added: ${guest.name} (${guest.status}) from ${guest.company}`);
    }

    console.log(`\n🎉 Successfully added ${guestsToAdd.length} guests for today!`);
    console.log('📅 Visit Date:', today);
    console.log('\n✨ Refresh your dashboard to see the updated counts!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTodaysGuests();
