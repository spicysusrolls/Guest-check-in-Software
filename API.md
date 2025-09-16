# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
Admin endpoints require Bearer token:
```
Authorization: Bearer YOUR_APP_SECRET
```

## Guest Endpoints

### GET /guests
Get all guests

**Response:**
```json
{
  "success": true,
  "guests": [
    {
      "id": "guest_123_1234567890",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "company": "Acme Corp",
      "hostName": "Jane Smith",
      "status": "checked-in",
      "visitDate": "2023-09-16",
      "createdAt": "2023-09-16T10:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /guests
Create new guest

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "company": "Acme Corp",
  "hostName": "Jane Smith",
  "hostEmail": "jane@company.com",
  "purposeOfVisit": "Business meeting",
  "expectedDuration": "1 hour",
  "specialRequirements": "Wheelchair access",
  "visitDate": "2023-09-16"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guest created successfully",
  "guest": {
    "id": "guest_123_1234567890",
    "status": "pending",
    ...
  }
}
```

### PUT /guests/:id/status
Update guest status

**Request:**
```json
{
  "status": "checked-in",
  "notes": "Guest arrived on time"
}
```

**Valid statuses:**
- `pending`
- `approved`
- `checked-in`
- `with-host`
- `checked-out`
- `cancelled`

### POST /guests/:id/checkin
Check in guest

**Response:**
```json
{
  "success": true,
  "message": "Guest checked in successfully",
  "guest": { ... }
}
```

### POST /guests/:id/checkout
Check out guest

### POST /guests/:id/notify-host
Send notification to host

**Request:**
```json
{
  "hostPhone": "+1234567890",
  "customMessage": "Custom notification message"
}
```

### POST /guests/:id/send-sms
Send SMS to guest

**Request:**
```json
{
  "message": "Your host will be with you shortly",
  "phoneNumber": "+1234567890"
}
```

### GET /guests/stats/summary
Get guest statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "today": {
      "total": 12,
      "pending": 2,
      "checkedIn": 5,
      "withHost": 3,
      "checkedOut": 2
    },
    "currentlyInOffice": 8
  }
}
```

## Webhook Endpoints

### POST /webhooks/jotform
JotForm submission webhook

**Headers:**
```
X-Signature: sha256=signature
Content-Type: application/json
```

### POST /webhooks/slack
Slack interaction webhook

**Headers:**
```
X-Slack-Signature: v0=signature
X-Slack-Request-Timestamp: timestamp
Content-Type: application/json
```

### POST /webhooks/twilio
Twilio SMS webhook

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Body:**
```
From=%2B1234567890&Body=Hello&MessageSid=SM123...
```

## Admin Endpoints

### GET /admin/dashboard
Get dashboard data

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "summary": {
      "totalGuests": 150,
      "todayGuests": 12,
      "currentlyInOffice": 8,
      "pendingApproval": 2
    },
    "todayStats": { ... },
    "recentGuests": [ ... ],
    "recentActivity": [ ... ],
    "systemStatus": {
      "googleSheets": true,
      "twilio": true,
      "slack": true,
      "jotform": true
    }
  }
}
```

### GET /admin/export/guests
Export guest data

**Query Parameters:**
- `format`: `json` or `csv`
- `startDate`: ISO date string
- `endDate`: ISO date string

### GET /admin/integrations/status
Get integration status

**Response:**
```json
{
  "success": true,
  "integrations": {
    "googleSheets": {
      "success": true,
      "info": {
        "title": "Guest Check-in Data",
        "sheetCount": 2
      }
    },
    "twilio": {
      "success": true,
      "accountSid": "AC123...",
      "phoneNumber": "+1234567890"
    },
    "slack": {
      "success": true,
      "botId": "B123...",
      "team": "Company Team"
    },
    "jotform": {
      "success": true,
      "user": {
        "username": "user123",
        "name": "User Name"
      }
    }
  }
}
```

### POST /admin/integrations/test/:integration
Test specific integration

**Parameters:**
- `integration`: `google-sheets`, `twilio`, `slack`, or `jotform`

### GET /admin/logs
Get system logs

**Query Parameters:**
- `limit`: Number of logs to return (default: 100)
- `guestId`: Filter by guest ID

### DELETE /admin/data/cleanup
Cleanup old data

**Request:**
```json
{
  "olderThanDays": 30
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid guest data provided",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Guest not found"
}
```

### Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Webhook endpoints: Higher limits with signature verification
- Admin endpoints: Require authentication

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error