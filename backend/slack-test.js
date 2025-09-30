const slackService = require("./services/slackService");

async function testSlack() {
  try {
    console.log("Testing Slack connection...");
    const result = await slackService.testConnection();
    console.log("Slack test result:", JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("Sending test message...");
      const messageResult = await slackService.sendCustomMessage(" Test message from Guest Check-in System!");
      console.log("Message result:", JSON.stringify(messageResult, null, 2));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testSlack();
