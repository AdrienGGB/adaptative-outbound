# F016: AI Message Generator

## 📋 Overview

**Feature ID:** F016
**Priority:** P1 - Core Feature
**Timeline:** Week 13-14 (Sprint 4)
**Dependencies:** F002 (Database)
**Status:** Ready for Development

---

## 🎯 Goals

Build an AI-powered message generation system that:

1. Integrates with LLMs (GPT-4, Claude) for message generation
2. Achieves message quality score >7/10 (user rating)
3. Generates persona-specific email templates
4. Produces messages in <3 seconds
5. Personalizes messages using account/contact data
6. Supports multi-language generation

---

## 👥 User Stories

### Message Generation

1. **As an SDR**, I want AI to write personalized emails so I save time on outreach
2. **As a user**, I want to specify tone/style so messages match my voice
3. **As a user**, I want AI to use account data for personalization so emails are relevant
4. **As a system**, I want to generate messages in <3 seconds so users don't wait

### Templates & Personas

1. **As a manager**, I want to create persona templates so reps have consistent messaging
2. **As an SDR**, I want to select from pre-built templates so I start quickly
3. **As a user**, I want to save my best messages as templates so I can reuse them
4. **As a user**, I want A/B test variations so I optimize messaging

### Quality & Iteration

1. **As a user**, I want to rate AI-generated messages so the system learns
2. **As a user**, I want to edit AI suggestions so I can add my touch
3. **As a system**, I want to track which messages get replies so I improve over time
4. **As a user**, I want message quality score so I know if it's good before sending

---

## ✅ Success Criteria

### Quality Requirements

- [ ]  LLM integration complete (GPT-4 or Claude)
- [ ]  Message quality score >7/10 (user rating average)
- [ ]  Persona-specific templates working (5+ personas)
- [ ]  Personalization uses 5+ data points (name, company, industry, etc.)
- [ ]  Message coherence score >0.8 (automated quality check)

### Performance Requirements

- [ ]  Message generation: <3 seconds (p95)
- [ ]  Concurrent generations: Support 50+ simultaneous requests
- [ ]  Template load: <500ms
- [ ]  Message history retrieval: <1 second

### Functional Requirements

- [ ]  Generate cold email
- [ ]  Generate follow-up email
- [ ]  Generate LinkedIn message
- [ ]  Generate call script
- [ ]  Multi-language support (English, Spanish, French)
- [ ]  Tone adjustment (professional, casual, direct)
- [ ]  Length control (short, medium, long)

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- Message Templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Template Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'cold_email', 'follow_up', 'linkedin', 'call_script'

  -- Template Content
  subject_template TEXT, -- For emails
  body_template TEXT NOT NULL,

  -- Personalization Variables
  variables TEXT[], -- ['first_name', 'company_name', 'industry', etc.]
  required_variables TEXT[],

  -- AI Generation Config
  tone VARCHAR(50) DEFAULT 'professional', -- 'professional', 'casual', 'direct', 'friendly'
  length VARCHAR(20) DEFAULT 'medium', -- 'short', 'medium', 'long'
  language VARCHAR(10) DEFAULT 'en', -- ISO 639-1 code
  persona VARCHAR(100), -- Target persona (CEO, VP Sales, etc.)

  -- System Prompt (for AI generation)
  system_prompt TEXT,
  -- Example: "You are an SDR reaching out to CTOs at B2B SaaS companies..."

  -- Performance Tracking
  use_count INT DEFAULT 0,
  average_rating DECIMAL(3,2),
  reply_rate DECIMAL(5,2), -- Percentage of replies
  meeting_rate DECIMAL(5,2), -- Percentage leading to meetings

  -- Status
  is_public BOOLEAN DEFAULT FALSE, -- Available to all in workspace
  is_featured BOOLEAN DEFAULT FALSE, -- Highlighted in UI

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_message_templates_workspace ON message_templates(workspace_id);
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_public ON message_templates(is_public) WHERE is_public = TRUE;

-- RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their workspace"
  ON message_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    OR is_public = TRUE
  );

CREATE POLICY "Users can create templates in their workspace"
  ON message_templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own templates"
  ON message_templates FOR UPDATE
  USING (created_by = auth.uid());

-- AI Generated Messages (for tracking and learning)
CREATE TABLE ai_generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Context
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Generated Content
  subject TEXT,
  body TEXT NOT NULL,
  message_type VARCHAR(50), -- 'email', 'linkedin', 'call_script'

  -- Generation Parameters
  tone VARCHAR(50),
  length VARCHAR(20),
  language VARCHAR(10),
  personalization_data JSONB, -- Data used for personalization

  -- AI Model Details
  model VARCHAR(50), -- 'gpt-4', 'claude-3-opus', etc.
  model_version VARCHAR(50),
  prompt_tokens INT,
  completion_tokens INT,
  generation_time_ms INT,

  -- Quality Metrics
  user_rating INT CHECK(user_rating >= 1 AND user_rating <= 10),
  quality_score DECIMAL(3,2), -- Automated quality assessment
  coherence_score DECIMAL(3,2),
  personalization_score DECIMAL(3,2),

  -- Usage & Performance
  was_sent BOOLEAN DEFAULT FALSE,
  was_edited BOOLEAN DEFAULT FALSE,
  edit_distance INT, -- How much user edited (Levenshtein)

  -- Outcome Tracking
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  replied BOOLEAN DEFAULT FALSE,
  meeting_booked BOOLEAN DEFAULT FALSE,

  -- Metadata
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_workspace ON ai_generated_messages(workspace_id);
CREATE INDEX idx_ai_messages_template ON ai_generated_messages(template_id);
CREATE INDEX idx_ai_messages_account ON ai_generated_messages(account_id);
CREATE INDEX idx_ai_messages_contact ON ai_generated_messages(contact_id);
CREATE INDEX idx_ai_messages_rating ON ai_generated_messages(user_rating) WHERE user_rating IS NOT NULL;
CREATE INDEX idx_ai_messages_created ON ai_generated_messages(created_at DESC);

-- RLS
ALTER TABLE ai_generated_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI messages in their workspace"
  ON ai_generated_messages FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Persona Library (Pre-built buyer personas)
CREATE TABLE buyer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Persona Details
  name VARCHAR(255) NOT NULL, -- "Enterprise CTO", "Startup Founder"
  description TEXT,
  job_titles TEXT[], -- Common job titles
  seniority_levels TEXT[], -- 'C-Level', 'VP', 'Director'
  departments TEXT[], -- 'Engineering', 'Product'

  -- Pain Points & Value Props
  pain_points TEXT[],
  value_propositions TEXT[],

  -- Messaging Guidance
  preferred_tone VARCHAR(50),
  preferred_length VARCHAR(20),
  key_talking_points TEXT[],
  avoid_topics TEXT[],

  -- Example Messages
  sample_messages JSONB, -- Array of example good messages

  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buyer_personas_workspace ON buyer_personas(workspace_id);

-- RLS
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view personas in their workspace"
  ON buyer_personas FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    OR is_default = TRUE
  );
```

---

## 🤖 AI Integration Architecture

### LLM Provider Configuration

```typescript
// Edge Function: /api/ai/generate-message

interface MessageGenerationRequest {
  templateId?: string
  accountId: string
  contactId: string
  messageType: 'email' | 'linkedin' | 'call_script'
  tone?: 'professional' | 'casual' | 'direct' | 'friendly'
  length?: 'short' | 'medium' | 'long'
  language?: string
  customInstructions?: string
}

async function generateMessage(req: MessageGenerationRequest) {
  // 1. Fetch context data
  const account = await getAccount(req.accountId)
  const contact = await getContact(req.contactId)
  const template = req.templateId ? await getTemplate(req.templateId) : null

  // 2. Build personalization context
  const context = {
    contact_first_name: contact.first_name,
    contact_job_title: contact.job_title,
    company_name: account.name,
    company_industry: account.industry,
    company_size: account.employee_range,
    company_technologies: account.technologies,
    // ... more contextual data
  }

  // 3. Build system prompt
  const systemPrompt = buildSystemPrompt({
    messageType: req.messageType,
    tone: req.tone || 'professional',
    length: req.length || 'medium',
    persona: template?.persona
  })

  // 4. Build user prompt
  const userPrompt = buildUserPrompt({
    template,
    context,
    customInstructions: req.customInstructions
  })

  // 5. Call LLM (OpenAI GPT-4 or Anthropic Claude)
  const startTime = Date.now()

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: req.length === 'short' ? 150 : req.length === 'long' ? 500 : 300
  })

  const generationTime = Date.now() - startTime

  const generatedText = response.choices[0].message.content

  // 6. Parse subject and body (for emails)
  const { subject, body } = parseEmailContent(generatedText)

  // 7. Quality assessment
  const qualityScore = await assessMessageQuality(body, context)

  // 8. Store generated message
  const savedMessage = await supabase.from('ai_generated_messages').insert({
    workspace_id: req.workspaceId,
    template_id: req.templateId,
    account_id: req.accountId,
    contact_id: req.contactId,
    subject,
    body,
    message_type: req.messageType,
    tone: req.tone,
    length: req.length,
    language: req.language,
    model: 'gpt-4-turbo-preview',
    prompt_tokens: response.usage.prompt_tokens,
    completion_tokens: response.usage.completion_tokens,
    generation_time_ms: generationTime,
    quality_score: qualityScore,
    personalization_data: context
  })

  return {
    id: savedMessage.id,
    subject,
    body,
    qualityScore,
    generationTime
  }
}
```

### System Prompt Templates

```typescript
function buildSystemPrompt(params: {
  messageType: string
  tone: string
  length: string
  persona?: string
}): string {
  const basePrompt = `You are an expert sales development representative (SDR) writing personalized outbound messages.`

  const toneInstructions = {
    professional: 'Use a professional, respectful tone. Avoid slang.',
    casual: 'Use a friendly, conversational tone. Be approachable.',
    direct: 'Be concise and to-the-point. No fluff.',
    friendly: 'Be warm and personable. Build rapport.'
  }

  const lengthInstructions = {
    short: 'Keep the message under 75 words. Be extremely concise.',
    medium: 'Aim for 100-150 words. Balance detail and brevity.',
    long: 'Write 200-300 words. Provide thorough context and value proposition.'
  }

  const typeInstructions = {
    email: `Write a compelling sales email with:
- Subject line that grabs attention
- Opening that personalizes using provided context
- Value proposition focused on recipient's likely pain points
- Clear, low-friction call-to-action
- Professional closing`,

    linkedin: `Write a LinkedIn connection request or message that:
- References shared context or interests
- Briefly mentions relevant value
- Keeps it conversational and non-salesy
- Ends with a simple question or CTA`,

    call_script: `Write a cold call script that:
- Has a strong opening hook
- Qualifies the prospect quickly
- Handles common objections
- Moves to next step (meeting/demo)`
  }

  return `${basePrompt}

${typeInstructions[params.messageType]}

TONE: ${toneInstructions[params.tone]}
LENGTH: ${lengthInstructions[params.length]}
${params.persona ? `TARGET PERSONA: ${params.persona}` : ''}

IMPORTANT:
- Use the provided context for personalization
- Never make up facts about the company or person
- Keep claims truthful and verifiable
- Avoid overpromising
- Focus on value, not features`
}
```

---

## 🔌 API Endpoints

```
POST   /api/ai/generate-message
Body: { templateId?, accountId, contactId, messageType, tone?, length?, customInstructions? }
Response: { id, subject?, body, qualityScore, generationTime }

POST   /api/ai/regenerate
Body: { messageId, feedback }
Response: { id, subject?, body }

PATCH  /api/ai/messages/:id/rate
Body: { rating: 1-10, feedback? }
Response: { message }

GET    /api/ai/messages
Query: { accountId?, contactId?, templateId?, page?, limit? }
Response: { messages: [], pagination }

GET    /api/ai/messages/:id
Response: { message }

POST   /api/ai/assess-quality
Body: { text }
Response: { qualityScore, coherenceScore, personalizationScore, suggestions: [] }
```

### Templates

```
POST   /api/message-templates
Body: { name, category, bodyTemplate, tone?, persona?, systemPrompt? }
Response: { template }

GET    /api/message-templates
Query: { category?, isPublic? }
Response: { templates: [] }

PATCH  /api/message-templates/:id
Body: { name?, bodyTemplate?, ... }
Response: { template }

DELETE /api/message-templates/:id
Response: { success: true }

GET    /api/message-templates/:id/analytics
Response: { useCount, avgRating, replyRate, meetingRate }
```

### Personas

```
GET    /api/buyer-personas
Response: { personas: [] }

POST   /api/buyer-personas
Body: { name, jobTitles, painPoints, valuePropositions, ... }
Response: { persona }
```

---

## 🎨 UI/UX Screens

### 1. Message Generator Modal

**Header:** "Generate Message"

**Step 1: Select Recipient**
- Account search/select
- Contact dropdown (from selected account)
- Shows: Contact name, title, company

**Step 2: Choose Template (Optional)**
- Grid of template cards
- Categories: Cold Email, Follow-up, LinkedIn, Call Script
- "Start from scratch" option

**Step 3: Customize Generation**
- Message type: Radio (Email, LinkedIn, Call Script)
- Tone: Dropdown (Professional, Casual, Direct, Friendly)
- Length: Dropdown (Short, Medium, Long)
- Language: Dropdown (English, Spanish, French, etc.)
- Custom instructions: Textarea ("Mention our new product launch...")

**Step 4: Generate & Review**
- Loading: "Generating personalized message..."
- Generated output:
  - Subject line (if email)
  - Body text
  - Quality score badge (7.5/10)
- Actions:
  - "Regenerate" button
  - "Edit" button (opens editor)
  - "Use this message" button
  - "Rate this message" (1-10 stars)

**Personalization Panel (Sidebar):**
- Shows data being used:
  - Contact: John Smith, VP Engineering
  - Company: Acme Corp, 500 employees, SaaS
  - Industry: Technology
  - Recent activity: Visited pricing page

---

### 2. Template Library

**Header:** "Message Templates"
- Search box
- Filter: Category, Creator, Performance
- "Create Template" button

**Templates Grid:**
- Per card:
  - Template name
  - Category badge
  - Creator avatar
  - Performance metrics: ⭐ 8.2/10, 📈 25% reply rate
  - Use count: "Used 142 times"
  - Actions: Use, Edit, Duplicate, Delete

**Template Detail Modal:**
- Name and description
- Body preview (with highlighted variables)
- Configuration: Tone, Length, Persona
- Analytics:
  - Total uses
  - Average rating
  - Reply rate trend (chart)
  - Best performing variations

---

### 3. Message Editor

**Left Panel:**
- Subject line input (for emails)
- Body editor (rich text)
- Variable insertion: Dropdown to insert {{first_name}}, {{company_name}}, etc.
- Personalization preview: Toggle to see rendered version

**Right Panel:**
- Quality score: 7.5/10
- Quality breakdown:
  - Coherence: ✓ 9/10
  - Personalization: ~ 7/10
  - Length: ✓ Optimal
- Suggestions:
  - "Consider adding social proof"
  - "Strengthen call-to-action"
- AI assist: "Improve this section" button

**Footer:**
- "Save as template" button
- "Cancel" button
- "Use message" button

---

### 4. Persona Builder

**Header:** "Buyer Personas"

**Create Persona Form:**
- Name: "Enterprise CTO"
- Description: Textarea
- Job titles: Tag input (CTO, VP Engineering, etc.)
- Seniority: Multi-select
- Pain points: Multi-line input
- Value propositions: Multi-line input
- Preferred tone: Dropdown
- Key talking points: List builder
- Avoid topics: List builder

**Sample Messages Section:**
- Upload example messages that worked well
- AI learns from these examples

---

## 🧪 Testing Strategy

### Quality Testing

- [ ]  Generate 100 messages, score by humans >7/10 average
- [ ]  Coherence score validation
- [ ]  Personalization accuracy (uses correct data)
- [ ]  No hallucinations (false claims about company)

### Performance Testing

- [ ]  Generation time <3s (p95)
- [ ]  50 concurrent generations
- [ ]  LLM API rate limiting handling

### A/B Testing

- [ ]  Compare AI vs human-written reply rates
- [ ]  Test tone variations
- [ ]  Test length variations

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.24.0",
    "@anthropic-ai/sdk": "^0.14.0",
    "zod": "^3.22.4",
    "react-markdown": "^9.0.0"
  }
}
```

---

## 🚀 Implementation Plan

**Week 1:**
- [ ]  LLM integration (OpenAI/Anthropic)
- [ ]  Message generation API
- [ ]  Template system
- [ ]  Basic UI

**Week 2:**
- [ ]  Quality assessment
- [ ]  Persona builder
- [ ]  Analytics tracking
- [ ]  Performance optimization

---

## 🎯 Definition of Done

- [ ]  LLM integration complete
- [ ]  Message quality >7/10
- [ ]  Persona templates working
- [ ]  Generation <3s
- [ ]  Tests passing
- [ ]  Documentation complete

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
