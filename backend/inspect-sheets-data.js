const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

async function inspectData() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Guest Data'];
    await sheet.loadHeaderRow();
    
    console.log('Headers:', sheet.headerValues);
    
    const rows = await sheet.getRows();
    console.log('\nTotal rows:', rows.length);
    console.log('\nLast 3 rows with today\'s date (2025-09-30):');
    
    const todayRows = rows.filter(r => r.get('Visit Date') === '2025-09-30');
    console.log('\nAll rows with today\'s date:');
    todayRows.forEach((row, idx) => {
      console.log(`\nRow ${idx + 1}:`);
      console.log('  Full Name:', JSON.stringify(row.get('Full Name')));
      console.log('  First Name:', JSON.stringify(row.get('First Name')));
      console.log('  Last Name:', JSON.stringify(row.get('Last Name')));
      console.log('  Email:', row.get('Email'));
      console.log('  Company:', row.get('Company'));
      console.log('  Status:', row.get('Status'));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectData();
