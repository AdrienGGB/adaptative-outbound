# F019: Sequence Builder

## 📋 Overview

**Feature ID:** F019
**Priority:** P0 - Critical Feature
**Timeline:** Week 15-16 (Sprint 4)
**Dependencies:** F002 (Database), F016 (AI Message Generator)
**Status:** Ready for Development

---

## 🎯 Goals

Build a visual sequence builder that:

1. Provides drag-and-drop interface for sequence design
2. Includes 5+ pre-built template sequences
3. Supports conditional branching based on engagement
4. Enables sequence cloning and versioning
5. Integrates with AI message generation
6. Tracks sequence performance metrics

---

## 👥 User Stories

### Sequence Creation

1. **As an SDR**, I want to build email sequences so I can automate my outreach
2. **As a manager**, I want to use template sequences so reps follow best practices
3. **As a user**, I want drag-and-drop builder so sequence creation is intuitive
4. **As a user**, I want to clone sequences so I can create variations quickly

### Sequence Configuration

1. **As an SDR**, I want to set delays between steps so I don't spam prospects
2. **As a user**, I want to add tasks (calls, LinkedIn) so sequences are multi-channel
3. **As a user**, I want conditional logic so sequences adapt to engagement
4. **As a manager**, I want to require approval before sequences go live

### Templates & Reusability

1. **As a manager**, I want to create sequence templates so team uses proven playbooks
2. **As an SDR**, I want to personalize template steps so messages feel authentic
3. **As a user**, I want to A/B test sequences so I optimize performance
4. **As a system**, I want to suggest improvements based on performance data

---

## ✅ Success Criteria

### Functional Requirements

- [ ]  Drag-and-drop builder functional
- [ ]  5+ template sequences available
- [ ]  Conditional branching working (if opened, if replied, if clicked)
- [ ]  Sequences cloneable
- [ ]  Multi-step sequences (email, task, delay)
- [ ]  AI message integration for step content
- [ ]  A/B testing variants supported

### Performance Requirements

- [ ]  Sequence load: <1 second
- [ ]  Save sequence: <2 seconds
- [ ]  Clone sequence: <1 second
- [ ]  Template library load: <500ms

### UX Requirements

- [ ]  Visual flowchart view
- [ ]  Step editing inline
- [ ]  Preview mode shows full sequence
- [ ]  Validation prevents broken sequences

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- Sequences
CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Sequence Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'cold_outreach', 'follow_up', 'nurture', 'reengagement'

  -- Configuration
  is_active BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE, -- Can be cloned by others
  is_public BOOLEAN DEFAULT FALSE, -- Available workspace-wide

  -- Performance Tracking
  total_enrolled INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  total_replied INT DEFAULT 0,
  total_meetings INT DEFAULT 0,
  reply_rate DECIMAL(5,2),
  meeting_rate DECIMAL(5,2),

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'archived'
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_sequences_workspace ON sequences(workspace_id);
CREATE INDEX idx_sequences_status ON sequences(status);
CREATE INDEX idx_sequences_template ON sequences(is_template) WHERE is_template = TRUE;
CREATE INDEX idx_sequences_created_by ON sequences(created_by);

-- RLS
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sequences in their workspace"
  ON sequences FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    OR is_public = TRUE
  );

CREATE POLICY "Users can create sequences"
  ON sequences FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sequences"
  ON sequences FOR UPDATE
  USING (created_by = auth.uid());

-- Sequence Steps
CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,

  -- Step Configuration
  step_number INT NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  -- Types: 'email', 'task', 'delay', 'conditional_split', 'webhook'

  -- Content (for email steps)
  template_id UUID REFERENCES message_templates(id),
  subject TEXT,
  body TEXT,

  -- Task (for manual tasks)
  task_type VARCHAR(50), -- 'call', 'linkedin_message', 'linkedin_connect', 'research'
  task_instructions TEXT,

  -- Delay (for wait steps)
  delay_days INT DEFAULT 0,
  delay_hours INT DEFAULT 0,
  skip_weekends BOOLEAN DEFAULT TRUE,
  send_time TIME DEFAULT '09:00:00', -- Preferred send time

  -- Conditional Logic
  condition_type VARCHAR(50),
  -- Types: 'email_opened', 'email_clicked', 'email_replied',
  --        'task_completed', 'link_clicked', 'form_submitted'

  condition_config JSONB,
  -- {
  --   "if_true_goto": "step_5",
  --   "if_false_goto": "step_3",
  --   "wait_hours": 24
  -- }

  -- A/B Testing
  is_variant BOOLEAN DEFAULT FALSE,
  variant_percentage INT, -- 0-100, what % gets this variant
  variant_group VARCHAR(10), -- 'A', 'B', 'C'

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(sequence_id, step_number)
);

CREATE INDEX idx_sequence_steps_sequence ON sequence_steps(sequence_id, step_number);
CREATE INDEX idx_sequence_steps_type ON sequence_steps(step_type);

-- RLS (inherits from sequence permissions)
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps for accessible sequences"
  ON sequence_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sequences s
      WHERE s.id = sequence_steps.sequence_id
      AND (
        s.created_by = auth.uid()
        OR s.is_public = TRUE
      )
    )
  );

CREATE POLICY "Users can manage steps for their sequences"
  ON sequence_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sequences
      WHERE sequences.id = sequence_steps.sequence_id
      AND sequences.created_by = auth.uid()
    )
  );

-- Sequence Enrollments (Contacts in sequences)
CREATE TABLE sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,

  -- Enrollment Details
  current_step_number INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  -- States: 'active', 'paused', 'completed', 'bounced', 'replied', 'unsubscribed'

  -- Variant Assignment (for A/B testing)
  assigned_variant VARCHAR(10), -- 'A', 'B', 'C', NULL

  -- Email Configuration (for F023 Sequence Executor)
  email_account_id UUID REFERENCES email_accounts(id), -- Which email account to send from
  from_address VARCHAR(255), -- Email address to send from
  assigned_to UUID REFERENCES auth.users(id), -- SDR assigned to handle replies/tasks

  -- Progress Tracking
  steps_completed INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,

  -- Outcome
  replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP,
  meeting_booked BOOLEAN DEFAULT FALSE,
  meeting_booked_at TIMESTAMP,

  -- Auto-Exit Conditions
  auto_exited BOOLEAN DEFAULT FALSE,
  auto_exit_reason VARCHAR(100), -- 'replied', 'bounced', 'unsubscribed'

  -- Error Handling & Retry (for F023)
  retry_count INT DEFAULT 0,
  last_error TEXT,

  -- Scheduling
  next_step_at TIMESTAMP,
  paused_until TIMESTAMP,

  -- Metadata
  enrolled_by UUID REFERENCES auth.users(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(sequence_id, contact_id)
);

CREATE INDEX idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_contact ON sequence_enrollments(contact_id);
CREATE INDEX idx_sequence_enrollments_status ON sequence_enrollments(status);
CREATE INDEX idx_sequence_enrollments_next_step ON sequence_enrollments(next_step_at)
  WHERE status = 'active';
CREATE INDEX idx_sequence_enrollments_assigned_to ON sequence_enrollments(assigned_to);
CREATE INDEX idx_sequence_enrollments_email_account ON sequence_enrollments(email_account_id);

-- RLS
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments in their workspace"
  ON sequence_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sequences s
      JOIN workspace_members wm ON wm.workspace_id = s.workspace_id
      WHERE s.id = sequence_enrollments.sequence_id
      AND wm.user_id = auth.uid()
    )
  );

-- Sequence Templates (Pre-built sequences)
CREATE TABLE sequence_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  industry VARCHAR(100), -- Industry-specific templates

  -- Template Structure (JSON representation)
  template_structure JSONB NOT NULL,
  -- {
  --   "steps": [
  --     {"type": "email", "delay_days": 0, "subject": "...", "body": "..."},
  --     {"type": "delay", "delay_days": 3},
  --     {"type": "email", "delay_days": 0, "subject": "...", "body": "..."}
  --   ]
  -- }

  -- Metadata
  use_count INT DEFAULT 0,
  average_reply_rate DECIMAL(5,2),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sequence_templates_category ON sequence_templates(category);
CREATE INDEX idx_sequence_templates_featured ON sequence_templates(is_featured) WHERE is_featured = TRUE;
```

---

## 🔌 API Endpoints

### Sequences

```
POST   /api/sequences
Body: { name, description, category }
Response: { sequence }

GET    /api/sequences
Query: { status?, isTemplate?, createdBy? }
Response: { sequences: [] }

GET    /api/sequences/:id
Response: { sequence, steps: [], enrollments: [], stats: {...} }

PATCH  /api/sequences/:id
Body: { name?, description?, status?, isActive? }
Response: { sequence }

DELETE /api/sequences/:id
Response: { success: true }

POST   /api/sequences/:id/clone
Body: { name }
Response: { sequence }

POST   /api/sequences/:id/activate
Response: { sequence }

POST   /api/sequences/:id/pause
Response: { sequence }
```

### Sequence Steps

```
POST   /api/sequences/:id/steps
Body: { stepType, stepNumber, subject?, body?, delayDays?, ... }
Response: { step }

GET    /api/sequences/:id/steps
Response: { steps: [] }

PATCH  /api/sequences/:id/steps/:stepId
Body: { subject?, body?, delayDays?, ... }
Response: { step }

DELETE /api/sequences/:id/steps/:stepId
Response: { success: true }

POST   /api/sequences/:id/steps/reorder
Body: { stepId, newPosition }
Response: { steps: [] }
```

### Enrollments

```
POST   /api/sequences/:id/enroll
Body: { contactIds: [...], startImmediately?: boolean }
Response: { enrolledCount, job_id }

GET    /api/sequences/:id/enrollments
Query: { status?, page?, limit? }
Response: { enrollments: [], pagination }

PATCH  /api/sequences/:id/enrollments/:enrollmentId
Body: { status: 'paused' | 'active' }
Response: { enrollment }

DELETE /api/sequences/:id/enrollments/:enrollmentId
Response: { success: true }
```

### Templates

```
GET    /api/sequence-templates
Query: { category?, industry? }
Response: { templates: [] }

POST   /api/sequences/from-template/:templateId
Body: { name, customizations? }
Response: { sequence }
```

---

## 🎨 UI/UX Screens

### 1. Sequence Builder (Visual Editor)

**Header:**
- Sequence name (editable inline)
- Status toggle: Draft / Active
- Actions: Save, Preview, Test, Clone

**Left Sidebar - Step Palette:**
- Drag-and-drop components:
  - 📧 Email
  - ⏰ Delay
  - ✅ Task
  - 🔀 Conditional Split
  - 🎯 A/B Test

**Center Canvas - Visual Flow:**
- Vertical flowchart showing steps
- Connected with arrows
- Each step card shows:
  - Step number
  - Step type icon
  - Summary (subject line for emails, delay for waits)
  - Edit button
  - Delete button
- Drag to reorder steps

**Right Sidebar - Step Editor:**
- (Appears when step selected)
- **Email Step:**
  - Subject line input
  - Body editor with AI assist
  - Template selector
  - Personalization variables
- **Delay Step:**
  - Days input
  - Hours input
  - Skip weekends checkbox
  - Preferred send time picker
- **Task Step:**
  - Task type dropdown
  - Instructions textarea
- **Conditional Split:**
  - Condition selector
  - If true → goto step dropdown
  - If false → goto step dropdown
  - Wait time before checking

**Bottom Bar:**
- Sequence stats: 142 enrolled, 23% reply rate
- Last saved: 2 minutes ago

---

### 2. Sequence Templates Gallery

**Header:** "Start with a template"

**Categories:**
- Cold Outreach
- Follow-Up
- Nurture
- Re-engagement

**Template Cards:**
- Template name
- Description
- Number of steps: "5 steps"
- Average reply rate: "18%"
- Use count: "Used 234 times"
- Preview button
- "Use template" button

**Template Preview Modal:**
- Shows full sequence flow
- Sample content for each step
- "Customize and use" button

---

### 3. Sequence Management List

**Header:** "Sequences"
- Search box
- Filter: Status, Category, Creator
- "Create Sequence" button

**Table:**
- Columns: Name, Status, Enrolled, Reply Rate, Meeting Rate, Created, Actions
- Per row:
  - Name with status badge
  - Active toggle
  - Enrolled count
  - Performance metrics
  - Actions: Edit, Clone, View Stats, Archive

**Bulk Actions:**
- Select multiple sequences
- Bulk activate/pause
- Bulk archive

---

### 4. Sequence Enrollment Modal

**Step 1: Select Contacts**
- Import from list
- Search and select individuals
- Shows: X contacts selected

**Step 2: Configure Enrollment**
- Start sequence: Immediately / Schedule for date
- Variant assignment (if A/B test): Auto / Specific variant
- Skip contacts already in sequence: Checkbox
- Preview: "Step 1 will send on Jan 15 at 9:00 AM"

**Step 3: Review & Confirm**
- Summary: X contacts, Y steps, starts on date
- Estimated completion: Feb 20
- "Enroll contacts" button

---

### 5. Sequence Performance Dashboard

**Overview Metrics:**
- Total enrolled: 450
- Active: 298
- Completed: 120
- Replied: 89 (19.8%)
- Meetings: 34 (7.6%)

**Step Performance Table:**
- Columns: Step, Type, Sent, Opened, Clicked, Replied
- Identifies drop-off points
- Highlights best-performing steps

**Funnel Visualization:**
- Shows conversion through sequence
- Drop-off rates between steps

**A/B Test Results (if applicable):**
- Variant A vs Variant B comparison
- Winner badge
- Statistical significance

**Contact List:**
- Enrolled contacts with status
- Filter by status
- Actions: Pause, Resume, Remove

---

## 🔐 Business Logic

### Sequence Execution Logic

```typescript
// Executed by F023: Sequence Executor

async function processSequenceStep(enrollmentId: string) {
  const enrollment = await getEnrollment(enrollmentId)
  const sequence = await getSequence(enrollment.sequence_id)
  const step = await getStep(sequence.id, enrollment.current_step_number)

  // Check if it's time to execute
  if (enrollment.next_step_at > new Date()) {
    return // Not yet
  }

  switch (step.step_type) {
    case 'email':
      await sendSequenceEmail(enrollment, step)
      break

    case 'task':
      await createTask(enrollment, step)
      break

    case 'delay':
      // Just wait, move to next step
      break

    case 'conditional_split':
      await evaluateCondition(enrollment, step)
      return // Don't auto-advance

    case 'webhook':
      await triggerWebhook(enrollment, step)
      break
  }

  // Move to next step
  await advanceToNextStep(enrollment)
}

async function advanceToNextStep(enrollment: Enrollment) {
  const nextStepNumber = enrollment.current_step_number + 1
  const nextStep = await getStep(enrollment.sequence_id, nextStepNumber)

  if (!nextStep) {
    // Sequence completed
    await completeEnrollment(enrollment.id)
    return
  }

  // Calculate next execution time
  const nextStepAt = calculateNextStepTime(nextStep)

  await updateEnrollment(enrollment.id, {
    current_step_number: nextStepNumber,
    next_step_at: nextStepAt,
    steps_completed: enrollment.steps_completed + 1
  })
}

function calculateNextStepTime(step: SequenceStep): Date {
  const now = new Date()
  const delayMs = (step.delay_days * 24 + step.delay_hours) * 60 * 60 * 1000

  let nextTime = new Date(now.getTime() + delayMs)

  // Skip weekends if configured
  if (step.skip_weekends) {
    while (nextTime.getDay() === 0 || nextTime.getDay() === 6) {
      nextTime = new Date(nextTime.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  // Set to preferred send time
  if (step.send_time) {
    const [hours, minutes] = step.send_time.split(':')
    nextTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  }

  return nextTime
}
```

---

## 🧪 Testing Strategy

### Unit Tests

- [ ]  Sequence CRUD operations
- [ ]  Step reordering logic
- [ ]  Next step time calculation
- [ ]  Conditional branching logic

### Integration Tests

- [ ]  Create sequence with 5 steps
- [ ]  Enroll contacts
- [ ]  Clone sequence
- [ ]  A/B test variant assignment

### E2E Tests

- [ ]  Build sequence via UI
- [ ]  Add contacts
- [ ]  Activate sequence
- [ ]  Verify first email sent

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-flow-renderer": "^10.3.17",
    "react-dnd": "^16.0.1",
    "zod": "^3.22.4"
  }
}
```

---

## 🚀 Implementation Plan

**Week 1:**
- [ ]  Database schema
- [ ]  Sequence CRUD API
- [ ]  Step management API
- [ ]  Basic UI

**Week 2:**
- [ ]  Drag-and-drop builder
- [ ]  Conditional logic
- [ ]  Template system
- [ ]  Testing

---

## 🎯 Definition of Done

- [ ]  Drag-and-drop builder functional
- [ ]  5+ templates available
- [ ]  Conditional branching working
- [ ]  Sequences cloneable
- [ ]  Tests passing
- [ ]  Documentation complete

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
