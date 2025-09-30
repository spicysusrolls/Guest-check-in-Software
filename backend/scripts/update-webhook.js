const axios = require('axios');
require('dotenv').config();

async function updateJotFormWebhook() {
  const apiKey = process.env.JOTFORM_API_KEY;
  const formId = process.env.JOTFORM_FORM_ID;
  
  if (!apiKey || !formId) {
    console.error('❌ JotForm API credentials not found in .env file');
    return false;
  }

  // Get current ngrok URL
  try {
    console.log('🔍 Getting current ngrok tunnel URL...');
    
    const ngrokResponse = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = ngrokResponse.data.tunnels;
    
    if (!tunnels || tunnels.length === 0) {
      console.error('❌ No ngrok tunnels found. Please start ngrok first.');
      return false;
    }
    
    const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
    if (!httpsTunnel) {
      console.error('❌ No HTTPS ngrok tunnel found');
      return false;
    }
    
    const webhookUrl = `${httpsTunnel.public_url}/api/webhooks/jotform`;
    console.log(`📡 Using webhook URL: ${webhookUrl}`);
    
    // Update JotForm webhook
    console.log('📝 Updating JotForm webhook...');
    
    const updateResponse = await axios.post(
      `https://api.jotform.com/form/${formId}/webhooks?apikey=${apiKey}`,
      {
        webhookURL: webhookUrl
      }
    );
    
    if (updateResponse.data.responseCode === 200) {
      console.log('✅ JotForm webhook updated successfully!');
      console.log(`🎯 Webhook URL: ${webhookUrl}`);
      
      // Verify the webhook was set
      const verifyResponse = await axios.get(
        `https://api.jotform.com/form/${formId}/webhooks?apikey=${apiKey}`
      );
      
      console.log('📋 Current webhooks:', verifyResponse.data.content);
      return true;
    } else {
      console.error('❌ Failed to update webhook:', updateResponse.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error updating JotForm webhook:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    return false;
  }
}

// Run the update
updateJotFormWebhook().then(success => {
  if (success) {
    console.log('\n🎉 Webhook configuration complete!');
    console.log('💡 You can now test form submissions');
  } else {
    console.log('\n❌ Webhook configuration failed');
    console.log('💡 Please check your JotForm credentials and try again');
  }
  process.exit(success ? 0 : 1);
});