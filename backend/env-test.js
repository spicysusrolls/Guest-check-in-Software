console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("SLACK_BOT_TOKEN:", process.env.SLACK_BOT_TOKEN ? "Present (length: " + process.env.SLACK_BOT_TOKEN.length + ")" : "MISSING");
console.log("SLACK_CHANNEL_ID:", process.env.SLACK_CHANNEL_ID || "MISSING");
console.log("SLACK_SIGNING_SECRET:", process.env.SLACK_SIGNING_SECRET ? "Present" : "MISSING");
