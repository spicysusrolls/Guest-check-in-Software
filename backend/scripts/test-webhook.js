const axios = require('axios');

async function testWebhookWithSampleData() {
  console.log('🧪 Testing webhook endpoint with sample JotForm data...\n');

  const webhookUrl = 'https://874d442b0132.ngrok-free.app/api/webhooks/jotform';
  
  // Sample JotForm submission data (typical format)
  const sampleData = {
    formID: '252546749958174',
    submissionID: 'test_' + Date.now(),
    rawRequest: {
      'q3_firstName': 'John',
      'q4_lastName': 'Doe', 
      'q5_email': 'john.doe@example.com',
      'q6_phoneNumber': '555-0123',
      'q7_hostName': 'Alice Smith',
      'q8_purposeOfVisit': 'Business meeting to discuss quarterly reports and upcoming project milestones.',
      'q9_kitchenVisit': 'Yes',
      'q10_company': 'Tech Corp Inc',
      'q11_title': 'Software Engineer'
    }
  };

  try {
    console.log('📤 Sending test webhook...');
    console.log('URL:', webhookUrl);
    console.log('Data:', JSON.stringify(sampleData, null, 2));

    const response = await axios.post(webhookUrl, sampleData, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    console.log('\n✅ Success! Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

  } catch (error) {
    console.log('\n❌ Error (this might be expected):');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n💡 Check the logs to see how the webhook processed this data:');
  console.log('   node backend/utils/log-viewer.js tail webhooks.log');
  console.log('   node backend/utils/log-viewer.js tail jotform.log');
}

testWebhookWithSampleData();