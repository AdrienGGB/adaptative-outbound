# F005: API Gateway & Developer Platform

## 📋 Overview

**Feature ID:** F005
**Priority:** P1 - Core Infrastructure
**Timeline:** Week 7-8 (Sprint 2)
**Dependencies:** F004 (Auth)
**Status:** Ready for Development

---

## 🎯 Goals

Build a developer-friendly API platform that:

1. Provides REST API for all core resources
2. Publishes comprehensive API documentation (Swagger/OpenAPI)
3. Implements rate limiting (100 requests/minute per API key)
4. Supports webhooks for event notifications
5. Achieves <200ms average API response time
6. Enables secure third-party integrations

---

## 👥 User Stories

### API Access

1. **As a developer**, I want to generate API keys so I can integrate our app with external systems
2. **As a developer**, I want to access REST API so I can build custom integrations
3. **As a system**, I want to rate limit API requests so we prevent abuse
4. **As a developer**, I want API documentation so I know how to use endpoints

### Webhooks

1. **As a developer**, I want to subscribe to webhooks so I can react to events in real-time
2. **As a system**, I want to retry failed webhook deliveries so events aren't missed
3. **As a developer**, I want webhook logs so I can debug integration issues
4. **As an admin**, I want to test webhooks so I can verify they work before deploying

### Developer Experience

1. **As a developer**, I want code examples in multiple languages so I can integrate quickly
2. **As a developer**, I want sandbox environment so I can test without affecting production data
3. **As a developer**, I want API versioning so my integrations don't break on updates
4. **As an admin**, I want to monitor API usage so I can track consumption

---

## ✅ Success Criteria

### Performance Requirements

- [ ]  API response time: <200ms average (p95 <500ms)
- [ ]  Rate limiting: 100 requests/minute enforced
- [ ]  Webhook delivery: <5 seconds (p95)
- [ ]  API documentation loads in <2 seconds
- [ ]  Support 1000+ concurrent API requests

### Functional Requirements

- [ ]  REST API for accounts, contacts, activities, sequences
- [ ]  API documentation published (Swagger/OpenAPI)
- [ ]  Rate limiting working per API key
- [ ]  Webhooks functional for 5+ event types
- [ ]  API key management (create, revoke, rotate)
- [ ]  Webhook retry logic with exponential backoff
- [ ]  Sandbox environment available
- [ ]  API versioning (v1, v2) supported

### Security Requirements

- [ ]  API key authentication working
- [ ]  Webhook signature validation functional
- [ ]  HTTPS enforced for all endpoints
- [ ]  CORS configured properly
- [ ]  Input validation on all endpoints
- [ ]  SQL injection prevention verified

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- API Keys table (from F004, extended here)
-- See F004 for base schema

-- Webhook Subscriptions
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Webhook Configuration
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  -- Events: 'account.created', 'account.updated', 'contact.created',
  --         'activity.logged', 'sequence.completed', 'email.sent', etc.

  -- Security
  secret VARCHAR(100) NOT NULL, -- HMAC signature secret
  is_active BOOLEAN DEFAULT TRUE,

  -- Delivery Configuration
  retry_policy JSONB DEFAULT '{"max_attempts": 3, "backoff": "exponential"}',
  timeout_seconds INT DEFAULT 30,

  -- Headers (custom headers to include)
  custom_headers JSONB,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_triggered_at TIMESTAMP
);

CREATE INDEX idx_webhook_subscriptions_workspace ON webhook_subscriptions(workspace_id);
CREATE INDEX idx_webhook_subscriptions_events ON webhook_subscriptions USING GIN(events);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks"
  ON webhook_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = webhook_subscriptions.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'admin'
    )
  );

-- Webhook Delivery Logs
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_id UUID, -- Reference to the event (account_id, contact_id, etc.)
  payload JSONB NOT NULL,

  -- Delivery Status
  status VARCHAR(20) DEFAULT 'pending',
  -- States: 'pending', 'delivered', 'failed', 'retrying'

  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  -- Response Details
  http_status INT,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  next_retry_at TIMESTAMP,

  -- Duration
  duration_ms INT
);

CREATE INDEX idx_webhook_deliveries_subscription ON webhook_deliveries(subscription_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at)
  WHERE status = 'retrying';

-- API Request Logs (for monitoring and debugging)
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,

  -- Request Details
  method VARCHAR(10) NOT NULL, -- GET, POST, PUT, PATCH, DELETE
  path TEXT NOT NULL,
  query_params JSONB,
  request_body JSONB,

  -- Response Details
  status_code INT NOT NULL,
  response_body JSONB,

  -- Performance
  duration_ms INT NOT NULL,

  -- Client Info
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_request_logs_workspace ON api_request_logs(workspace_id, created_at DESC);
CREATE INDEX idx_api_request_logs_api_key ON api_request_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_request_logs_status ON api_request_logs(status_code) WHERE status_code >= 400;
CREATE INDEX idx_api_request_logs_created_at ON api_request_logs(created_at DESC);

-- Partition by month for performance (optional)
-- CREATE TABLE api_request_logs_2024_01 PARTITION OF api_request_logs
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Rate Limiting State (in-memory cache preferred, but can use DB)
-- For Supabase, use Redis via external service or implement in Edge Functions
```

---

## 🔌 API Endpoints

### API Documentation

```
GET    /api/docs
Returns: Interactive Swagger/OpenAPI documentation

GET    /api/docs/openapi.json
Returns: OpenAPI 3.0 specification (JSON)

GET    /api/docs/postman
Returns: Postman collection export
```

### API Key Management

```
POST   /api/api-keys
Body: { name, scopes: ['read', 'write'], expiresAt? }
Response: { apiKey: 'sk_live_...', id, prefix }

GET    /api/api-keys
Response: { apiKeys: [] } (without full keys)

DELETE /api/api-keys/:id
Response: { success: true }

POST   /api/api-keys/:id/rotate
Response: { apiKey: 'sk_live_...', oldKey }
```

### Webhook Management

```
POST   /api/webhooks
Body: { url, events: [...], description?, customHeaders? }
Response: { webhook, secret }

GET    /api/webhooks
Response: { webhooks: [] }

PATCH  /api/webhooks/:id
Body: { url?, events?, isActive? }
Response: { webhook }

DELETE /api/webhooks/:id
Response: { success: true }

POST   /api/webhooks/:id/test
Body: { event: 'account.created', samplePayload? }
Response: { deliveryId, status }

GET    /api/webhooks/:id/deliveries
Query: { status?, limit?, offset? }
Response: { deliveries: [], pagination }

POST   /api/webhooks/:id/deliveries/:deliveryId/retry
Response: { delivery }
```

### Public REST API (Authenticated with API Key)

**Authentication Header:**
```
Authorization: Bearer sk_live_abcdef123456
```

**Accounts API:**
```
POST   /api/v1/accounts
GET    /api/v1/accounts
GET    /api/v1/accounts/:id
PATCH  /api/v1/accounts/:id
DELETE /api/v1/accounts/:id
```

**Contacts API:**
```
POST   /api/v1/contacts
GET    /api/v1/contacts
GET    /api/v1/contacts/:id
PATCH  /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
```

**Activities API:**
```
POST   /api/v1/activities
GET    /api/v1/activities
GET    /api/v1/activities/:id
```

**Rate Limiting Response:**
```
HTTP 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "remaining": 0,
  "resetAt": "2024-01-01T12:01:00Z"
}

Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640523600
```

---

## 🎨 UI/UX Screens

### 1. API Documentation (Public)

**Layout:**
- Sidebar: Grouped endpoints (Accounts, Contacts, Activities, etc.)
- Main content: Endpoint details

**Per Endpoint:**
- HTTP method badge (GET, POST, etc.)
- Endpoint path: `/api/v1/accounts/:id`
- Description
- Authentication required badge
- Request parameters table (name, type, required, description)
- Request body schema (JSON example)
- Response codes (200, 400, 401, 404, 429, 500)
- Response schema (JSON example)
- Code examples (curl, JavaScript, Python, Ruby)
- Try it out button (interactive API testing)

**Code Example:**
```bash
curl -X GET https://api.adaptive.io/v1/accounts/123 \
  -H "Authorization: Bearer sk_live_..."
```

---

### 2. API Keys Management (Admin)

**Header:**
- "API Keys" title
- "Generate New Key" button

**API Keys Table:**
- Columns: Name, Key Prefix, Scopes, Created, Last Used, Expires, Actions
- Example row:
  - Name: "Production Integration"
  - Prefix: `sk_live_abc...`
  - Scopes: read, write
  - Created: Jan 1, 2024
  - Last Used: 2 hours ago
  - Expires: Never
  - Actions: Revoke button

**Generate Key Modal:**
- Input: Key name
- Multi-select: Scopes (read, write, admin)
- Date picker: Expiration (optional)
- Warning: "This key will only be shown once"
- Button: "Generate Key"

**Key Generated Modal:**
- Success message
- Full API key displayed (copyable)
- Code example showing usage
- Warning: "Store this key securely. You won't be able to see it again."
- Button: "I've copied the key"

---

### 3. Webhooks Management (Admin)

**Header:**
- "Webhooks" title
- "Create Webhook" button

**Webhooks Table:**
- Columns: URL, Events, Status, Last Triggered, Success Rate, Actions
- Example row:
  - URL: `https://myapp.com/webhooks`
  - Events: 3 events
  - Status: Active (toggle)
  - Last Triggered: 5 min ago
  - Success Rate: 98.5%
  - Actions: Edit, Test, View Logs, Delete

**Create Webhook Modal:**
- Input: Webhook URL
- Multi-select: Events to subscribe
  - Checkboxes: account.created, account.updated, contact.created, etc.
- Textarea: Description (optional)
- Advanced options (collapsible):
  - Custom headers (key-value pairs)
  - Timeout seconds (default: 30)
  - Max retry attempts (default: 3)
- Button: "Create Webhook"

**Webhook Created Modal:**
- Success message
- Webhook secret displayed (for HMAC signature verification)
- Code example: Verifying webhook signature
- Button: "Test Webhook Now" or "Done"

---

### 4. Webhook Delivery Logs

**Filters:**
- Status dropdown: All, Delivered, Failed, Retrying
- Date range picker
- Search by event type

**Deliveries Table:**
- Columns: Event, Status, Attempts, HTTP Status, Duration, Timestamp, Actions
- Example row:
  - Event: account.created
  - Status: Delivered (green badge)
  - Attempts: 1/3
  - HTTP Status: 200
  - Duration: 245ms
  - Timestamp: 2 min ago
  - Actions: View Details, Retry (if failed)

**Delivery Detail Modal:**
- Event type and ID
- Payload (JSON viewer with syntax highlighting)
- Request headers
- Response status and body
- Timeline of attempts (if retried)
- Error message (if failed)
- Button: "Retry Delivery" (if failed)

---

### 5. API Usage Dashboard (Admin)

**Metrics Cards:**
- Total Requests (last 24h): 12,450
- Average Response Time: 145ms
- Error Rate: 0.5%
- Rate Limit Hits: 23

**Charts:**
- **Request Volume**: Line chart showing requests over time
- **Response Times**: Histogram of p50, p95, p99
- **Top Endpoints**: Bar chart of most-called endpoints
- **Error Breakdown**: Pie chart of error types (4xx, 5xx)

**Recent Errors Table:**
- Columns: Timestamp, Endpoint, Status, Error, API Key
- Sortable and filterable

---

## 🔐 Security

### API Key Security

1. **Generation**: Use cryptographically secure random (32 bytes)
2. **Storage**: Hash with bcrypt before storing in database
3. **Prefix**: Show only prefix (sk_live_abc...) in UI
4. **Scopes**: Enforce least-privilege access (read, write, admin)
5. **Expiration**: Support optional expiration dates
6. **Rotation**: Allow key rotation without downtime

### Webhook Security

1. **HMAC Signature**: Sign all webhook payloads
   ```typescript
   const signature = crypto
     .createHmac('sha256', webhookSecret)
     .update(JSON.stringify(payload))
     .digest('hex')

   // Header: X-Webhook-Signature: sha256=abc123...
   ```

2. **HTTPS Only**: Reject non-HTTPS webhook URLs
3. **Timeout**: Kill webhook requests after 30 seconds
4. **Retry Policy**: Exponential backoff (60s, 300s, 900s)
5. **IP Whitelist**: Optional IP whitelist for webhook sources

### Rate Limiting

**Algorithm: Token Bucket**

```typescript
async function checkRateLimit(apiKeyId: string): Promise<boolean> {
  const key = `rate_limit:${apiKeyId}`
  const limit = 100 // requests per minute
  const window = 60 // seconds

  // Using Redis
  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, window)
  }

  return current <= limit
}
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1640523600 (Unix timestamp)
```

### Input Validation

```typescript
// Use Zod for request validation
const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  // ... more fields
})

// In API route
const validatedData = createAccountSchema.parse(req.body)
// Throws 400 Bad Request if validation fails
```

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  API key generation and validation
- [ ]  HMAC signature generation and verification
- [ ]  Rate limiting algorithm
- [ ]  Webhook retry logic
- [ ]  Input validation schemas

### Integration Tests

- [ ]  End-to-end API request (create account via API)
- [ ]  Webhook delivery flow (trigger event, deliver webhook, verify signature)
- [ ]  Rate limiting enforcement (101st request blocked)
- [ ]  API key authentication (valid key passes, invalid fails)
- [ ]  Webhook retry after failure

### Performance Tests

- [ ]  API response time <200ms (p95 <500ms)
- [ ]  1000 concurrent API requests
- [ ]  Webhook delivery <5 seconds
- [ ]  Rate limiting overhead <10ms

### Security Tests

- [ ]  API key brute force protection
- [ ]  SQL injection prevention
- [ ]  XSS prevention in API responses
- [ ]  CORS configuration correct
- [ ]  Webhook signature validation required

---

## 📦 Dependencies & Libraries

### Backend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "zod": "^3.22.4",
    "ioredis": "^5.3.2",
    "axios": "^1.6.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  }
}
```

### Frontend (API Docs)

```json
{
  "dependencies": {
    "swagger-ui-react": "^5.10.0",
    "prism-react-renderer": "^2.3.0"
  }
}
```

---

## 🚀 Implementation Plan

### Week 1: Core API & Documentation

**Days 1-2:**
- [ ]  Set up API versioning (v1)
- [ ]  Create REST endpoints for accounts, contacts
- [ ]  Implement API key authentication middleware
- [ ]  Add input validation with Zod

**Days 3-4:**
- [ ]  Generate OpenAPI specification
- [ ]  Build interactive API documentation (Swagger UI)
- [ ]  Add code examples (curl, JS, Python)
- [ ]  Create API keys management UI

**Day 5:**
- [ ]  Implement rate limiting
- [ ]  Add API request logging
- [ ]  Testing and optimization

### Week 2: Webhooks & Monitoring

**Days 1-2:**
- [ ]  Build webhook subscription system
- [ ]  Implement webhook delivery worker
- [ ]  Add HMAC signature generation

**Days 3-4:**
- [ ]  Create webhook management UI
- [ ]  Build webhook delivery logs viewer
- [ ]  Implement retry logic

**Day 5:**
- [ ]  API usage dashboard
- [ ]  Performance optimization
- [ ]  End-to-end testing

---

## 🎯 Definition of Done

- [ ]  REST API endpoints functional
- [ ]  API documentation published (Swagger)
- [ ]  Rate limiting working (100 req/min)
- [ ]  Webhooks functional for 5+ events
- [ ]  API response time <200ms (p95)
- [ ]  API key management UI complete
- [ ]  Webhook management UI complete
- [ ]  Unit test coverage >80%
- [ ]  Integration tests passing
- [ ]  Performance benchmarks met
- [ ]  Security audit passed
- [ ]  Documentation complete

---

## 🔮 Future Enhancements

1. **GraphQL API**: Alternative to REST for complex queries
2. **API Versioning**: Support v2, v3 with deprecation warnings
3. **SDK Libraries**: Official SDKs (JavaScript, Python, Ruby, Go)
4. **WebSocket API**: Real-time data streaming
5. **Batch Operations**: Bulk create/update endpoints
6. **Field Filtering**: Select specific fields in responses (?fields=name,domain)
7. **Pagination Cursors**: Cursor-based pagination for large datasets
8. **API Analytics**: Detailed usage analytics per API key
9. **Mock API**: Sandbox environment with mock data
10. **OAuth 2.0**: Allow third-party apps to authenticate users

---

## 📚 Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)
- [Webhook Security](https://webhooks.fyi/security/hmac)
- [Rate Limiting Algorithms](https://en.wikipedia.org/wiki/Token_bucket)
- [API Versioning Strategies](https://www.troyhunt.com/your-api-versioning-is-wrong-which-is/)

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __

**QA Engineer:** ___ **Date:** __

**Product Manager:** ___ **Date:** __
