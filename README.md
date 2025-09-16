# Guest Check-in System

A comprehensive guest check-in system with integrated JotForm submissions, Google Sheets data retention, Twilio SMS communication, and Slack notifications.

## Features

- **JotForm Integration**: Receive guest information from online forms
- **Google Sheets Storage**: Automatic data retention and audit logging
- **SMS Notifications**: Send welcome messages and status updates via Twilio
- **Slack Notifications**: Real-time host notifications with interactive buttons
- **Web Dashboard**: Modern React frontend for guest management
- **Real-time Updates**: Live guest status tracking and management
- **Admin Panel**: System monitoring and integration testing

## Architecture

### Backend (Node.js/Express)
- **Services**: Modular service architecture for each integration
- **Controllers**: RESTful API endpoints for guest management
- **Middleware**: Authentication, validation, and rate limiting
- **Webhooks**: Endpoints for JotForm, Slack, and Twilio interactions

### Frontend (React/Material-UI)
- **Dashboard**: Overview of guest statistics and system status
- **Guest List**: Comprehensive guest management with actions
- **Check-in**: Manual guest registration interface
- **Admin Panel**: System administration and monitoring

### Integrations
- **JotForm**: Form submissions and webhook processing
- **Google Sheets**: Data storage and audit trail
- **Twilio**: SMS notifications and two-way communication
- **Slack**: Team notifications with interactive components

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Google Cloud Platform account (for Sheets API)
- Twilio account
- Slack workspace with bot permissions
- JotForm account

## Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd Guest-check-in-Software

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Google Sheets API
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C1234567890
SLACK_SIGNING_SECRET=your_slack_signing_secret

# JotForm
JOTFORM_API_KEY=your_jotform_api_key
JOTFORM_FORM_ID=your_form_id
JOTFORM_WEBHOOK_SECRET=your_webhook_secret

# Security
APP_SECRET=your_secure_app_secret
WEBHOOK_ENDPOINT_SECRET=your_webhook_secret
```

## Service Setup

### Google Sheets Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Sheets API and Google Drive API

2. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Download the JSON key file
   - Extract the email and private key for your .env file

3. **Create Spreadsheet**
   - Create a new Google Spreadsheet
   - Share it with the service account email (Editor permissions)
   - Copy the spreadsheet ID from the URL

### Twilio Setup

1. **Create Twilio Account**
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get your Account SID and Auth Token from console
   - Purchase a phone number

2. **Configure Webhooks**
   - Set webhook URL: `https://your-domain.com/api/webhooks/twilio`
   - Configure for incoming messages

### Slack Setup

1. **Create Slack App**
   - Go to [Slack API](https://api.slack.com/apps)
   - Create new app "from scratch"
   - Add to your workspace

2. **Configure Bot Permissions**
   - OAuth & Permissions > Scopes
   - Add: `chat:write`, `channels:read`, `groups:read`
   - Install app to workspace
   - Copy Bot User OAuth Token

3. **Enable Interactive Components**
   - Interactivity & Shortcuts
   - Request URL: `https://your-domain.com/api/webhooks/slack`

### JotForm Setup

1. **Create JotForm Account**
   - Sign up at [JotForm](https://www.jotform.com/)
   - Create a guest information form
   - Get API key from account settings

2. **Configure Webhook**
   - Form Settings > Integrations > Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/jotform`

## Running the Application

### Development Mode

1. **Start Backend**
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:3000

2. **Start Frontend** (in new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:3001

### Production Mode

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. **Start Server**
   ```bash
   npm start
   ```

## API Documentation

### Guest Management

#### Get All Guests
```http
GET /api/guests
```

#### Create Guest
```http
POST /api/guests
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "company": "Acme Corp",
  "hostName": "Jane Smith",
  "purposeOfVisit": "Meeting",
  "expectedDuration": "1 hour"
}
```

#### Update Guest Status
```http
PUT /api/guests/:id/status
Content-Type: application/json

{
  "status": "checked-in",
  "notes": "Guest arrived on time"
}
```

#### Check In Guest
```http
POST /api/guests/:id/checkin
```

#### Check Out Guest
```http
POST /api/guests/:id/checkout
```

### Webhooks

#### JotForm Webhook
```http
POST /api/webhooks/jotform
Content-Type: application/json
```

#### Slack Webhook
```http
POST /api/webhooks/slack
Content-Type: application/json
```

#### Twilio Webhook
```http
POST /api/webhooks/twilio
Content-Type: application/x-www-form-urlencoded
```

### Admin Endpoints

All admin endpoints require authentication header:
```http
Authorization: Bearer YOUR_APP_SECRET
```

#### Dashboard Data
```http
GET /api/admin/dashboard
```

#### Integration Status
```http
GET /api/admin/integrations/status
```

#### Export Guest Data
```http
GET /api/admin/export/guests?format=csv
```

## Guest Check-in Flow

1. **Guest Submits Form**: Guest fills out JotForm with their information
2. **Form Processing**: Webhook receives submission and creates guest record
3. **Data Storage**: Guest information saved to Google Sheets
4. **Welcome SMS**: Automatic welcome message sent to guest
5. **Reception Check-in**: Guest arrives and checks in at reception
6. **Host Notification**: Slack and SMS notifications sent to host
7. **Status Updates**: Real-time status tracking throughout visit
8. **Check-out**: Guest checks out when leaving

## Troubleshooting

### Common Issues

1. **Google Sheets Connection Failed**
   - Verify service account email has access to spreadsheet
   - Check private key format (include `\n` characters)
   - Ensure APIs are enabled in Google Cloud Console

2. **Twilio SMS Not Sending**
   - Verify phone number format (include country code)
   - Check Twilio account balance
   - Ensure phone number is verified in trial accounts

3. **Slack Notifications Not Working**
   - Check bot token permissions
   - Verify channel ID is correct
   - Ensure bot is added to the channel

4. **JotForm Webhook Issues**
   - Verify webhook URL is accessible
   - Check webhook signature verification
   - Ensure form field mapping is correct

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development DEBUG=* npm run dev
```

### Health Check

Check system health:
```http
GET /health
```

### Integration Testing

Test individual integrations from admin panel or API:
```http
POST /api/admin/integrations/test/google-sheets
POST /api/admin/integrations/test/twilio
POST /api/admin/integrations/test/slack
POST /api/admin/integrations/test/jotform
```

## Security Considerations

- All API endpoints use rate limiting
- Webhook signatures are verified
- Sensitive data is excluded from logs
- CORS is configured for specific origins
- Authentication required for admin functions

## Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build frontend
cd frontend && npm run build && cd ..

# Start with PM2
pm2 start server.js --name "guest-checkin"
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
# Dockerfile example
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd frontend && npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

Ensure these are set in production:
- `NODE_ENV=production`
- Secure `APP_SECRET`
- Valid SSL certificates for webhooks
- Production database URLs

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error details
3. Test integrations individually
4. Verify environment configuration

## License

MIT License - see LICENSE file for details.