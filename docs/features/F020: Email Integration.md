# F020: Email Integration & Tracking

## 📋 Overview

**Feature ID:** F020
**Priority:** P0 - Critical Feature
**Timeline:** Week 17-18 (Sprint 5)
**Dependencies:** F004 (Auth), F019 (Sequence Builder)
**Status:** Ready for Development

---

## 🎯 Goals

Build email sending and tracking infrastructure that:

1. Sends emails via Gmail/Outlook
2. Tracks opens, clicks, and replies
3. Detects bounces automatically
4. Achieves >95% deliverability rate
5. Handles email throttling and warm-up
6. Provides inbox-native sending experience

---

## 👥 User Stories

### Email Sending

1. **As an SDR**, I want to send emails from my Gmail so prospects see my real address
2. **As a user**, I want emails to send through my Outlook account so they're in my sent folder
3. **As a system**, I want to throttle sending so I don't hit rate limits
4. **As a user**, I want to schedule emails so they send at optimal times

### Email Tracking

1. **As an SDR**, I want to know when emails are opened so I can follow up
2. **As a user**, I want to track link clicks so I know prospect interest
3. **As an SDR**, I want to see email replies in-app so I can respond quickly
4. **As a system**, I want to detect bounces so I update contact status

### Deliverability

1. **As a user**, I want email warm-up so my domain builds reputation
2. **As an admin**, I want to monitor deliverability rates so I maintain inbox placement
3. **As a system**, I want to rotate sending addresses so I spread volume
4. **As a user**, I want SPF/DKIM validation so my emails aren't marked as spam

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  Gmail sending works (OAuth)
- [ ]  Outlook sending works (OAuth)
- [ ]  Open tracking operational
- [ ]  Click tracking operational
- [ ]  Bounce detection working
- [ ]  Reply detection working
- [ ]  Email scheduling functional

### Performance Requirements

- [ ]  Email delivery: <5 seconds from queue to sent
- [ ]  Open tracking: <2 seconds to record
- [ ]  Reply sync: <30 seconds
- [ ]  Deliverability rate: >95%

### Security Requirements

- [ ]  OAuth tokens encrypted at rest
- [ ]  No plaintext passwords stored
- [ ]  Email content encrypted in database
- [ ]  Tracking pixels privacy-compliant

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- Email Accounts (Connected Gmail/Outlook accounts)
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Account Details
  email_address VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'smtp'
  display_name VARCHAR(255),

  -- OAuth Credentials (encrypted)
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP,

  -- SMTP (if provider is 'smtp')
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_username VARCHAR(255),
  smtp_password TEXT, -- Encrypted

  -- Sending Configuration
  daily_send_limit INT DEFAULT 200, -- Warming limit
  hourly_send_limit INT DEFAULT 50,
  current_daily_sent INT DEFAULT 0,
  current_hourly_sent INT DEFAULT 0,
  last_reset_at TIMESTAMP DEFAULT NOW(),

  -- Warm-up Status
  is_warming BOOLEAN DEFAULT TRUE,
  warmup_stage INT DEFAULT 1, -- 1-5, increasing over time
  warmup_started_at TIMESTAMP DEFAULT NOW(),

  -- Health
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'error', 'disconnected'
  last_error TEXT,
  last_sync_at TIMESTAMP,

  -- Performance
  total_sent INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  bounce_rate DECIMAL(5,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, email_address)
);

CREATE INDEX idx_email_accounts_workspace ON email_accounts(workspace_id);
CREATE INDEX idx_email_accounts_user ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_status ON email_accounts(status);

-- RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email accounts"
  ON email_accounts FOR ALL
  USING (user_id = auth.uid());

-- Email Messages
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Relationships
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  sequence_enrollment_id UUID REFERENCES sequence_enrollments(id),

  -- Message Details
  message_id VARCHAR(255), -- Provider's message ID
  thread_id VARCHAR(255), -- Email thread ID

  -- Addresses
  from_address VARCHAR(255) NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  reply_to VARCHAR(255),

  -- Content
  subject TEXT,
  body_text TEXT,
  body_html TEXT,

  -- Tracking
  tracking_pixel_url TEXT,
  tracked_links JSONB, -- Map of original URL -> tracking URL

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- States: 'pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'

  error_message TEXT,

  -- Engagement
  opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP,
  open_count INT DEFAULT 0,

  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP,
  click_count INT DEFAULT 0,

  replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP,

  bounced BOOLEAN DEFAULT FALSE,
  bounced_at TIMESTAMP,
  bounce_type VARCHAR(50), -- 'hard', 'soft', 'complaint'
  bounce_reason TEXT,

  -- Scheduling
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Metadata
  user_agent TEXT, -- For open tracking
  ip_address INET, -- For open tracking
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_messages_workspace ON email_messages(workspace_id);
CREATE INDEX idx_email_messages_account ON email_messages(email_account_id);
CREATE INDEX idx_email_messages_contact ON email_messages(contact_id);
CREATE INDEX idx_email_messages_sequence ON email_messages(sequence_enrollment_id);
CREATE INDEX idx_email_messages_status ON email_messages(status);
CREATE INDEX idx_email_messages_scheduled ON email_messages(scheduled_for)
  WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_email_messages_message_id ON email_messages(message_id);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);

-- RLS
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email messages in their workspace"
  ON email_messages FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Email Events (Detailed tracking)
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(50) NOT NULL,
  -- Types: 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'

  event_data JSONB,
  -- {
  --   "link_url": "https://example.com/pricing",
  --   "user_agent": "Mozilla/5.0...",
  --   "ip_address": "192.168.1.1",
  --   "bounce_reason": "Mailbox full"
  -- }

  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_events_message ON email_events(email_message_id, occurred_at DESC);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- Email Templates (for quick sending, different from message_templates)
-- Reuse message_templates table from F016

-- Unsubscribes
CREATE TABLE unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,

  unsubscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribe_source VARCHAR(50), -- 'link', 'reply', 'manual', 'complaint'

  UNIQUE(workspace_id, email_address)
);

CREATE INDEX idx_unsubscribes_workspace ON unsubscribes(workspace_id);
CREATE INDEX idx_unsubscribes_email ON unsubscribes(email_address);
```

---

## 📧 Email Sending Architecture

### Gmail Integration (OAuth 2.0)

```typescript
// OAuth Flow
async function connectGmailAccount(authCode: string, userId: string) {
  // Exchange auth code for tokens
  const tokens = await google.auth.getToken(authCode)

  // Get user email
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const profile = await gmail.users.getProfile({ userId: 'me' })

  // Store encrypted tokens
  await supabase.from('email_accounts').insert({
    user_id: userId,
    email_address: profile.data.emailAddress,
    provider: 'gmail',
    access_token: encrypt(tokens.access_token),
    refresh_token: encrypt(tokens.refresh_token),
    token_expires_at: new Date(tokens.expiry_date)
  })
}

// Send Email via Gmail API
async function sendEmailViaGmail(messageId: string) {
  const message = await getEmailMessage(messageId)
  const emailAccount = await getEmailAccount(message.email_account_id)

  // Decrypt and refresh token if needed
  const accessToken = await getValidAccessToken(emailAccount)

  // Build RFC 2822 email
  const rawEmail = buildRawEmail({
    from: message.from_address,
    to: message.to_addresses,
    subject: message.subject,
    html: injectTrackingPixel(message.body_html),
    text: message.body_text
  })

  // Send via Gmail API
  const gmail = google.gmail({ version: 'v1', auth: accessToken })
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: Buffer.from(rawEmail).toString('base64')
    }
  })

  // Update message status
  await updateEmailMessage(messageId, {
    status: 'sent',
    message_id: result.data.id,
    sent_at: new Date()
  })

  // Log event
  await logEmailEvent(messageId, 'sent', { gmail_id: result.data.id })
}
```

### Open & Click Tracking

```typescript
// Inject tracking pixel
function injectTrackingPixel(html: string, trackingUrl: string): string {
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none" />`

  // Insert before </body> or at end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  return html + pixel
}

// Generate tracking URL
function generateTrackingUrl(emailMessageId: string, type: 'open' | 'click'): string {
  const token = generateSecureToken(emailMessageId)
  return `https://track.adaptive.io/${type}/${emailMessageId}/${token}.gif`
}

// Tracking endpoint
app.get('/track/open/:messageId/:token.gif', async (req, res) => {
  const { messageId, token } = req.params

  // Verify token
  if (!verifyToken(messageId, token)) {
    return res.status(404).send()
  }

  // Record open
  await recordEmailOpen(messageId, {
    user_agent: req.headers['user-agent'],
    ip_address: req.ip,
    occurred_at: new Date()
  })

  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  res.set('Content-Type', 'image/gif')
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.send(pixel)
})

// Link click tracking
function replaceLinksWithTracking(html: string, emailMessageId: string): string {
  const linkRegex = /href="([^"]+)"/g
  const trackedLinks = {}

  const trackedHtml = html.replace(linkRegex, (match, url) => {
    const trackingUrl = generateClickTrackingUrl(emailMessageId, url)
    trackedLinks[url] = trackingUrl
    return `href="${trackingUrl}"`
  })

  // Store tracked links mapping
  storeTrackedLinks(emailMessageId, trackedLinks)

  return trackedHtml
}

app.get('/track/click/:messageId/:linkId', async (req, res) => {
  const { messageId, linkId } = req.params

  // Get original URL
  const originalUrl = await getOriginalUrl(messageId, linkId)

  // Record click
  await recordEmailClick(messageId, {
    link_url: originalUrl,
    occurred_at: new Date()
  })

  // Redirect to original URL
  res.redirect(originalUrl)
})
```

### Reply Detection (Webhook from Gmail)

```typescript
// Gmail Pub/Sub webhook
app.post('/webhooks/gmail/push', async (req, res) => {
  const { message } = req.body

  // Decode Pub/Sub message
  const data = JSON.parse(Buffer.from(message.data, 'base64').toString())

  // Fetch new messages
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const history = await gmail.users.history.list({
    userId: 'me',
    startHistoryId: data.historyId
  })

  // Process received messages
  for (const record of history.data.history) {
    if (record.messagesAdded) {
      for (const added of record.messagesAdded) {
        await processIncomingEmail(added.message.id)
      }
    }
  }

  res.status(200).send('OK')
})

async function processIncomingEmail(gmailMessageId: string) {
  // Fetch full message
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: gmailMessageId,
    format: 'full'
  })

  // Extract headers
  const headers = message.data.payload.headers
  const from = headers.find(h => h.name === 'From').value
  const inReplyTo = headers.find(h => h.name === 'In-Reply-To')?.value
  const threadId = message.data.threadId

  // Match to sent email
  const sentEmail = await findSentEmail({ threadId, messageId: inReplyTo })

  if (sentEmail) {
    // Mark as replied
    await updateEmailMessage(sentEmail.id, {
      replied: true,
      replied_at: new Date()
    })

    // Log event
    await logEmailEvent(sentEmail.id, 'replied', { from })

    // Trigger automations (auto-exit sequence, etc.)
    await handleEmailReply(sentEmail)
  }
}
```

### Bounce Detection

```typescript
// Parse bounce notifications
async function handleBounceNotification(notification: any) {
  const { messageId, bounceType, bounceReason } = parseBounceNotification(notification)

  await updateEmailMessage(messageId, {
    bounced: true,
    bounced_at: new Date(),
    bounce_type: bounceType, // 'hard', 'soft'
    bounce_reason: bounceReason,
    status: 'bounced'
  })

  // Update contact status
  if (bounceType === 'hard') {
    const message = await getEmailMessage(messageId)
    await updateContact(message.contact_id, {
      email_status: 'bounced',
      bounce_reason: bounceReason
    })
  }

  // Log event
  await logEmailEvent(messageId, 'bounced', {
    bounce_type: bounceType,
    bounce_reason: bounceReason
  })
}
```

---

## 🔌 API Endpoints

```
POST   /api/email-accounts/connect/gmail
Body: { authCode }
Response: { emailAccount }

POST   /api/email-accounts/connect/outlook
Body: { authCode }
Response: { emailAccount }

GET    /api/email-accounts
Response: { emailAccounts: [] }

DELETE /api/email-accounts/:id
Response: { success: true }

POST   /api/email-accounts/:id/test
Response: { success: true }

POST   /api/emails/send
Body: { contactId, subject, body, scheduledFor?, emailAccountId? }
Response: { emailMessage }

GET    /api/emails
Query: { contactId?, status?, sent After?, page? }
Response: { emails: [], pagination }

GET    /api/emails/:id
Response: { email, events: [] }

GET    /api/emails/:id/events
Response: { events: [] }
```

---

## 🎨 UI/UX Screens

### 1. Email Account Connection

**Connect Email Account Modal:**
- Provider selection: Gmail / Outlook
- OAuth button: "Connect with Google" / "Connect with Microsoft"
- Shows permissions being requested
- After connection: Success message with email address

**Email Accounts List:**
- Columns: Email, Provider, Status, Daily Sent, Bounce Rate, Actions
- Actions: Test Connection, Disconnect, Settings

---

### 2. Email Composer

**Header:** "New Email"

**To:** Contact selector
**From:** Email account dropdown
**Subject:** Input
**Body:** Rich text editor

**Tracking Options:**
- Checkbox: Track opens
- Checkbox: Track clicks

**Schedule:**
- Send now / Schedule for date+time

**Footer:**
- "Send" button
- "Save Draft" button

---

## 🧪 Testing Strategy

- [ ]  Gmail OAuth flow
- [ ]  Outlook OAuth flow
- [ ]  Send email
- [ ]  Track open
- [ ]  Track click
- [ ]  Detect reply
- [ ]  Handle bounce

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "googleapis": "^126.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "nodemailer": "^6.9.7",
    "mailparser": "^3.6.5"
  }
}
```

---

## 🚀 Implementation Plan

**Week 1:**
- [ ]  Gmail OAuth integration
- [ ]  Email sending API
- [ ]  Tracking pixel
- [ ]  Click tracking

**Week 2:**
- [ ]  Outlook integration
- [ ]  Reply detection
- [ ]  Bounce handling
- [ ]  Warm-up logic

---

## 🎯 Definition of Done

- [ ]  Gmail/Outlook sending works
- [ ]  Open/click tracking operational
- [ ]  Bounce detection working
- [ ]  Deliverability >95%
- [ ]  Tests passing

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
