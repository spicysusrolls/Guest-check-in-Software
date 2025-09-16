const { WebClient } = require('@slack/web-api');

class SlackService {
  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.channelId = process.env.SLACK_CHANNEL_ID;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.client = null;
  }

  initialize() {
    try {
      if (!this.botToken) {
        throw new Error('Slack bot token not configured');
      }

      this.client = new WebClient(this.botToken);
      console.log('✅ Slack service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Slack service:', error.message);
      throw error;
    }
  }

  async sendGuestArrivalNotification(guestData) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Guest Arrival Notification',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Guest:*\n${guestData.firstName} ${guestData.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Host:*\n${guestData.hostName}`
            },
            {
              type: 'mrkdwn',
              text: `*Company:*\n${guestData.company || 'N/A'}`
            },
            {
              type: 'mrkdwn',
              text: `*Check-in Time:*\n${new Date().toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${guestData.email}`
            },
            {
              type: 'mrkdwn',
              text: `*Phone:*\n${guestData.phoneNumber}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Purpose of Visit:*\n${guestData.purposeOfVisit}`
          }
        }
      ];

      // Add special requirements if present
      if (guestData.specialRequirements) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Special Requirements:*\n${guestData.specialRequirements}`
          }
        });
      }

      // Add action buttons
      blocks.push({
        type: 'actions',
        block_id: `guest_actions_${guestData.id}`,
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Acknowledge',
              emoji: true
            },
            style: 'primary',
            value: `acknowledge_${guestData.id}`,
            action_id: 'acknowledge_guest'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📱 Call Guest',
              emoji: true
            },
            value: `call_${guestData.id}`,
            action_id: 'call_guest'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📝 Update Status',
              emoji: true
            },
            value: `update_${guestData.id}`,
            action_id: 'update_guest_status'
          }
        ]
      });

      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        blocks: blocks,
        text: `Guest ${guestData.firstName} ${guestData.lastName} has arrived for ${guestData.hostName}`
      });

      console.log(`✅ Slack notification sent for guest ${guestData.firstName} ${guestData.lastName}`);
      
      return {
        success: true,
        messageTs: result.ts,
        channel: result.channel
      };
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendStatusUpdateNotification(guestData, newStatus, previousStatus) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const statusEmojis = {
        'pending': '⏳',
        'approved': '✅',
        'checked-in': '🏢',
        'with-host': '🤝',
        'checked-out': '👋',
        'cancelled': '❌'
      };

      const statusColors = {
        'pending': '#ffeb3b',
        'approved': '#4caf50',
        'checked-in': '#2196f3',
        'with-host': '#ff9800',
        'checked-out': '#9e9e9e',
        'cancelled': '#f44336'
      };

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmojis[newStatus]} *Guest Status Update*\n\n*${guestData.firstName} ${guestData.lastName}* status changed from *${previousStatus}* to *${newStatus}*`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Host: ${guestData.hostName} | Time: ${new Date().toLocaleString()}`
            }
          ]
        }
      ];

      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        blocks: blocks,
        text: `Guest ${guestData.firstName} ${guestData.lastName} status updated to ${newStatus}`,
        attachments: [
          {
            color: statusColors[newStatus],
            fallback: `Guest status updated to ${newStatus}`
          }
        ]
      });

      console.log(`✅ Slack status update sent for guest ${guestData.firstName} ${guestData.lastName}`);
      
      return {
        success: true,
        messageTs: result.ts,
        channel: result.channel
      };
    } catch (error) {
      console.error('❌ Failed to send Slack status update:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendDailySummary(guests) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const today = new Date().toLocaleDateString();
      const totalGuests = guests.length;
      const checkedIn = guests.filter(g => g.status === 'checked-in' || g.status === 'with-host').length;
      const checkedOut = guests.filter(g => g.status === 'checked-out').length;
      const pending = guests.filter(g => g.status === 'pending').length;

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 Daily Guest Summary - ${today}`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Guests:* ${totalGuests}`
            },
            {
              type: 'mrkdwn',
              text: `*Currently In Office:* ${checkedIn}`
            },
            {
              type: 'mrkdwn',
              text: `*Checked Out:* ${checkedOut}`
            },
            {
              type: 'mrkdwn',
              text: `*Pending:* ${pending}`
            }
          ]
        }
      ];

      // Add list of current guests if any
      if (checkedIn > 0) {
        const currentGuests = guests
          .filter(g => g.status === 'checked-in' || g.status === 'with-host')
          .map(g => `• ${g.firstName} ${g.lastName} (${g.hostName})`)
          .join('\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Currently in office:*\n${currentGuests}`
          }
        });
      }

      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        blocks: blocks,
        text: `Daily guest summary: ${totalGuests} total guests, ${checkedIn} currently in office`
      });

      console.log(`✅ Daily summary sent to Slack`);
      
      return {
        success: true,
        messageTs: result.ts,
        channel: result.channel
      };
    } catch (error) {
      console.error('❌ Failed to send daily summary:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleInteractiveAction(payload) {
    try {
      const { actions, user, response_url } = payload;
      const action = actions[0];
      
      const [actionType, guestId] = action.value.split('_');
      
      let responseMessage = '';
      
      switch (actionType) {
        case 'acknowledge':
          responseMessage = `✅ ${user.name} acknowledged guest arrival`;
          break;
        case 'call':
          responseMessage = `📱 ${user.name} is calling the guest`;
          break;
        case 'update':
          responseMessage = `📝 ${user.name} is updating guest status`;
          break;
        default:
          responseMessage = `${user.name} performed action: ${actionType}`;
      }

      // Update the original message with the response
      await this.client.chat.update({
        channel: payload.channel.id,
        ts: payload.message.ts,
        blocks: payload.message.blocks,
        attachments: [
          {
            color: 'good',
            text: responseMessage,
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      });

      return {
        success: true,
        action: actionType,
        guestId: guestId,
        user: user.name
      };
    } catch (error) {
      console.error('❌ Failed to handle Slack interaction:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendCustomMessage(message, channel = null) {
    try {
      if (!this.client) {
        this.initialize();
      }

      const result = await this.client.chat.postMessage({
        channel: channel || this.channelId,
        text: message
      });

      return {
        success: true,
        messageTs: result.ts,
        channel: result.channel
      };
    } catch (error) {
      console.error('❌ Failed to send custom Slack message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      if (!this.client) {
        this.initialize();
      }

      // Test by getting bot info
      const authTest = await this.client.auth.test();
      
      // Test channel access
      let channelInfo = null;
      if (this.channelId) {
        try {
          channelInfo = await this.client.conversations.info({
            channel: this.channelId
          });
        } catch (channelError) {
          console.warn('Channel access test failed:', channelError.message);
        }
      }

      return {
        success: true,
        botId: authTest.bot_id,
        userId: authTest.user_id,
        team: authTest.team,
        teamId: authTest.team_id,
        channelId: this.channelId,
        channelName: channelInfo ? channelInfo.channel.name : null,
        channelAccessible: !!channelInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  verifySignature(timestamp, signature, body) {
    try {
      const crypto = require('crypto');
      
      if (!this.signingSecret) {
        console.warn('Slack signing secret not configured');
        return true; // Skip verification if not configured
      }

      const time = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if request is older than 5 minutes
      if (Math.abs(currentTime - time) > 300) {
        return false;
      }

      const hmac = crypto.createHmac('sha256', this.signingSecret);
      const [version, hash] = signature.split('=');
      
      hmac.update(`v0:${timestamp}:${body}`);
      const expectedHash = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch (error) {
      console.error('❌ Slack signature verification failed:', error.message);
      return false;
    }
  }
}

module.exports = new SlackService();