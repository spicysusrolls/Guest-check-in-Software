require('dotenv').config();

console.log('🧪 TESTING GOOGLE SHEETS API INTEGRATION');
console.log('================================================================');

async function testAPI() {
  try {
    // Test different API endpoints
    const axios = require('axios');
    const baseURL = 'http://localhost:3000/api';
    
    console.log('📊 Testing Guest Statistics API...');
    const statsResponse = await axios.get(`${baseURL}/guests/stats`);
    console.log('✅ Stats Response:', JSON.stringify(statsResponse.data, null, 2));
    
    console.log('\n👥 Testing Today\'s Guests API...');
    const todayResponse = await axios.get(`${baseURL}/guests/today`);
    console.log('✅ Today\'s Guests:', JSON.stringify(todayResponse.data, null, 2));
    
    console.log('\n🏢 Testing Checked-in Guests API...');
    const checkedInResponse = await axios.get(`${baseURL}/guests/checked-in`);
    console.log('✅ Checked-in Guests:', JSON.stringify(checkedInResponse.data, null, 2));
    
    console.log('\n📋 Testing Admin Dashboard API...');
    const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard`);
    console.log('✅ Dashboard Data:', JSON.stringify(dashboardResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAPI();