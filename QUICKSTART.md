# Quick Start Guide

## 1. Initial Setup (5 minutes)

### Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

## 2. Service Configuration (15 minutes)

### Google Sheets
1. Create Google Cloud Project
2. Enable Sheets API
3. Create Service Account
4. Download credentials
5. Create spreadsheet and share with service account

### Twilio
1. Sign up at twilio.com
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credentials to .env

### Slack
1. Create Slack App
2. Add bot permissions: `chat:write`, `channels:read`
3. Install to workspace
4. Copy bot token to .env

### JotForm
1. Create account and form
2. Get API key
3. Configure webhook endpoint
4. Add credentials to .env

## 3. Run Application

### Development
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production
```bash
cd frontend && npm run build && cd ..
npm start
```

## 4. Test the System

1. Open http://localhost:3001
2. Register a test guest
3. Check Google Sheets for data
4. Verify SMS and Slack notifications
5. Test check-in/check-out flow

## 5. Webhook URLs (for production)

Set these in your services:
- JotForm: `https://your-domain.com/api/webhooks/jotform`
- Slack: `https://your-domain.com/api/webhooks/slack`
- Twilio: `https://your-domain.com/api/webhooks/twilio`

## Common Issues

- **Google Sheets**: Ensure service account has editor access
- **Twilio**: Include country code in phone numbers
- **Slack**: Bot must be added to notification channel
- **JotForm**: Webhook URL must be publicly accessible

For detailed setup instructions, see README.md