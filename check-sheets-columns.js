require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function checkSheetColumns() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    console.log('\n📋 Spreadsheet:', doc.title);
    console.log('📊 Sheets available:');
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`  ${index + 1}. ${sheet.title} (${sheet.rowCount} rows, ${sheet.columnCount} columns)`);
    });

    // Check the Guest Data sheet
    const guestSheet = doc.sheetsByTitle['Guest Data'];
    if (!guestSheet) {
      console.log('\n❌ "Guest Data" sheet not found!');
      return;
    }

    console.log('\n✅ Found "Guest Data" sheet');
    await guestSheet.loadHeaderRow();
    console.log('\n📌 Column Headers:');
    guestSheet.headerValues.forEach((header, index) => {
      console.log(`  ${index + 1}. "${header}"`);
    });

    // Get first few rows
    const rows = await guestSheet.getRows({ limit: 3 });
    console.log(`\n📝 Sample Data (first ${rows.length} rows):`);
    
    rows.forEach((row, index) => {
      console.log(`\n--- Row ${index + 1} ---`);
      guestSheet.headerValues.forEach(header => {
        const value = row.get(header);
        if (value) {
          console.log(`  ${header}: ${value}`);
        }
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkSheetColumns();
