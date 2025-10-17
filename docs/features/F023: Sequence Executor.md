# F023: Sequence Executor

## 📋 Overview

**Feature ID:** F023
**Priority:** P0 - Critical Feature
**Timeline:** Week 19-20 (Sprint 5)
**Dependencies:** F019 (Sequence Builder), F020 (Email Integration), F044 (Data Pipeline)
**Status:** Ready for Development

---

## 🎯 Goals

Build an automated sequence execution engine that:

1. Executes sequences on schedule with <5 min delay
2. Auto-stops on reply
3. Implements engagement-based branching
4. Handles errors gracefully with retry logic
5. Scales to 10,000+ active enrollments
6. Provides real-time progress visibility

---

## 👥 User Stories

### Automated Execution

1. **As an SDR**, I want sequences to run automatically so I don't send emails manually
2. **As a user**, I want emails to send at specified times so prospects receive them when they're active
3. **As a system**, I want to respect send limits so accounts don't get suspended
4. **As a user**, I want to see what's queued so I know what's happening

### Auto-Stop Rules

1. **As an SDR**, I want sequences to stop when prospect replies so I don't spam them
2. **As a user**, I want sequences to pause on bounce so I don't damage sender reputation
3. **As a system**, I want to exit on unsubscribe so we comply with regulations
4. **As a user**, I want to manually pause enrollments so I can handle edge cases

### Engagement-Based Logic

1. **As a user**, I want different paths based on opens so I personalize follow-ups
2. **As an SDR**, I want to prioritize engaged contacts so I focus on hot leads
3. **As a system**, I want to track engagement signals so branching works correctly
4. **As a user**, I want conditional wait times based on activity

### Error Handling

1. **As a system**, I want to retry failed sends so temporary errors don't stop sequences
2. **As a user**, I want error notifications so I can fix issues
3. **As a system**, I want to quarantine problematic enrollments so they don't block queue
4. **As an admin**, I want to see failed steps so I can investigate

---

## ✅ Success Criteria

### Performance Requirements

- [ ]  Execution queue delay: <5 minutes (p95)
- [ ]  Processing throughput: 1000+ emails/hour
- [ ]  Conditional evaluation: <100ms
- [ ]  Scale to 10,000+ active enrollments
- [ ]  Worker restart: Resume within 1 minute

### Functional Requirements

- [ ]  Sequences run on schedule
- [ ]  Auto-stop on reply working
- [ ]  Engagement branching functional
- [ ]  Retry logic for failures
- [ ]  Execution logs captured
- [ ]  Manual pause/resume working
- [ ]  Send limits respected

### Reliability Requirements

- [ ]  Zero lost executions during 7-day test
- [ ]  Graceful handling of email provider outages
- [ ]  Transaction safety for state updates
- [ ]  Dead letter queue for unrecoverable errors

---

## 🏗️ Technical Architecture

### Execution Worker Architecture

```typescript
// Background worker (Supabase Edge Function or Node.js process)

class SequenceExecutor {
  private isRunning = false
  private pollInterval = 30000 // 30 seconds

  async start() {
    this.isRunning = true
    console.log('Sequence Executor started')

    while (this.isRunning) {
      try {
        await this.processQueue()
        await this.sleep(this.pollInterval)
      } catch (error) {
        console.error('Executor error:', error)
        await this.sleep(this.pollInterval)
      }
    }
  }

  async processQueue() {
    // 1. Fetch due enrollments
    const dueEnrollments = await this.getDueEnrollments()

    console.log(`Processing ${dueEnrollments.length} due enrollments`)

    // 2. Process in batches (avoid overwhelming system)
    const batches = chunk(dueEnrollments, 10)

    for (const batch of batches) {
      await Promise.all(
        batch.map(enrollment => this.processEnrollment(enrollment))
      )
    }
  }

  async getDueEnrollments() {
    const { data, error } = await supabase
      .from('sequence_enrollments')
      .select(`
        *,
        sequence:sequences(*),
        contact:contacts(*),
        account:accounts(*)
      `)
      .eq('status', 'active')
      .lte('next_step_at', new Date().toISOString())
      .order('next_step_at', { ascending: true })
      .limit(100)

    if (error) throw error
    return data || []
  }

  async processEnrollment(enrollment: SequenceEnrollment) {
    try {
      // 1. Get current step
      const step = await this.getStep(
        enrollment.sequence_id,
        enrollment.current_step_number
      )

      if (!step) {
        // No more steps, complete enrollment
        await this.completeEnrollment(enrollment.id)
        return
      }

      // 2. Check auto-exit conditions
      const shouldExit = await this.checkAutoExit(enrollment)
      if (shouldExit.exit) {
        await this.exitEnrollment(enrollment.id, shouldExit.reason)
        return
      }

      // 3. Execute step based on type
      await this.executeStep(enrollment, step)

      // 4. Advance to next step
      await this.advanceToNextStep(enrollment, step)

      // 5. Log execution
      await this.logExecution(enrollment.id, step.id, 'success')

    } catch (error) {
      await this.handleExecutionError(enrollment, error)
    }
  }

  async executeStep(enrollment: SequenceEnrollment, step: SequenceStep) {
    switch (step.step_type) {
      case 'email':
        await this.sendSequenceEmail(enrollment, step)
        break

      case 'task':
        await this.createTask(enrollment, step)
        break

      case 'delay':
        // Nothing to do, just wait
        break

      case 'conditional_split':
        await this.evaluateConditional(enrollment, step)
        break

      default:
        throw new Error(`Unknown step type: ${step.step_type}`)
    }
  }

  async sendSequenceEmail(enrollment: SequenceEnrollment, step: SequenceStep) {
    // 1. Check send limits
    const canSend = await this.checkSendLimits(enrollment.user_id)
    if (!canSend) {
      throw new Error('Send limit exceeded, will retry later')
    }

    // 2. Render email with personalization
    const renderedEmail = await this.renderEmail(step, enrollment.contact, enrollment.account)

    // 3. Queue email for sending (uses F020)
    const { data: emailMessage, error } = await supabase
      .from('email_messages')
      .insert({
        workspace_id: enrollment.workspace_id,
        email_account_id: enrollment.email_account_id,
        contact_id: enrollment.contact_id,
        account_id: enrollment.account_id,
        sequence_enrollment_id: enrollment.id,
        from_address: enrollment.from_address,
        to_addresses: [enrollment.contact.email],
        subject: renderedEmail.subject,
        body_html: renderedEmail.body,
        status: 'queued',
        scheduled_for: new Date()
      })
      .select()
      .single()

    if (error) throw error

    // 4. Trigger email sending job
    await this.queueEmailSend(emailMessage.id)

    // 5. Update enrollment stats
    await supabase
      .from('sequence_enrollments')
      .update({
        emails_sent: enrollment.emails_sent + 1
      })
      .eq('id', enrollment.id)
  }

  async createTask(enrollment: SequenceEnrollment, step: SequenceStep) {
    // Create task for manual action
    await supabase.from('tasks').insert({
      workspace_id: enrollment.workspace_id,
      assigned_to: enrollment.assigned_to,
      contact_id: enrollment.contact_id,
      account_id: enrollment.account_id,
      task_type: step.task_type,
      description: step.task_instructions,
      due_date: new Date(),
      status: 'pending',
      sequence_enrollment_id: enrollment.id
    })
  }

  async evaluateConditional(enrollment: SequenceEnrollment, step: SequenceStep) {
    // Evaluate condition based on engagement
    const conditionMet = await this.checkCondition(
      enrollment,
      step.condition_type,
      step.condition_config
    )

    // Set next step based on result
    const nextStepNumber = conditionMet
      ? step.condition_config.if_true_goto
      : step.condition_config.if_false_goto

    await supabase
      .from('sequence_enrollments')
      .update({
        current_step_number: nextStepNumber,
        next_step_at: this.calculateNextStepTime(step)
      })
      .eq('id', enrollment.id)
  }

  async checkCondition(
    enrollment: SequenceEnrollment,
    conditionType: string,
    config: any
  ): Promise<boolean> {
    switch (conditionType) {
      case 'email_opened':
        return this.wasEmailOpened(enrollment, config.wait_hours)

      case 'email_clicked':
        return this.wasEmailClicked(enrollment, config.wait_hours)

      case 'email_replied':
        return this.wasEmailReplied(enrollment)

      case 'task_completed':
        return this.wasTaskCompleted(enrollment)

      default:
        return false
    }
  }

  async wasEmailOpened(enrollment: SequenceEnrollment, waitHours: number): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - waitHours * 60 * 60 * 1000)

    const { data } = await supabase
      .from('email_messages')
      .select('opened')
      .eq('sequence_enrollment_id', enrollment.id)
      .gte('sent_at', cutoffTime.toISOString())
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()

    return data?.opened || false
  }

  async checkAutoExit(enrollment: SequenceEnrollment): Promise<{ exit: boolean; reason?: string }> {
    // Check for reply
    if (enrollment.replied) {
      return { exit: true, reason: 'replied' }
    }

    // Check for unsubscribe
    const { data: unsubscribe } = await supabase
      .from('unsubscribes')
      .select('id')
      .eq('contact_id', enrollment.contact_id)
      .single()

    if (unsubscribe) {
      return { exit: true, reason: 'unsubscribed' }
    }

    // Check for bounce
    const { data: bouncedEmail } = await supabase
      .from('email_messages')
      .select('bounced, bounce_type')
      .eq('sequence_enrollment_id', enrollment.id)
      .eq('bounced', true)
      .eq('bounce_type', 'hard')
      .limit(1)
      .single()

    if (bouncedEmail) {
      return { exit: true, reason: 'bounced' }
    }

    return { exit: false }
  }

  async advanceToNextStep(enrollment: SequenceEnrollment, currentStep: SequenceStep) {
    const nextStepNumber = enrollment.current_step_number + 1
    const nextStep = await this.getStep(enrollment.sequence_id, nextStepNumber)

    if (!nextStep) {
      // Sequence completed
      await this.completeEnrollment(enrollment.id)
      return
    }

    // Calculate when to execute next step
    const nextStepAt = this.calculateNextStepTime(nextStep)

    await supabase
      .from('sequence_enrollments')
      .update({
        current_step_number: nextStepNumber,
        next_step_at: nextStepAt.toISOString(),
        steps_completed: enrollment.steps_completed + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id)
  }

  calculateNextStepTime(step: SequenceStep): Date {
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

      // If time has passed today, schedule for tomorrow
      if (nextTime < new Date()) {
        nextTime = new Date(nextTime.getTime() + 24 * 60 * 60 * 1000)
      }
    }

    return nextTime
  }

  async completeEnrollment(enrollmentId: string) {
    await supabase
      .from('sequence_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
  }

  async exitEnrollment(enrollmentId: string, reason: string) {
    await supabase
      .from('sequence_enrollments')
      .update({
        status: reason === 'replied' ? 'replied' : 'auto_exited',
        auto_exited: true,
        auto_exit_reason: reason,
        completed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
  }

  async handleExecutionError(enrollment: SequenceEnrollment, error: Error) {
    console.error(`Error processing enrollment ${enrollment.id}:`, error)

    // Log error
    await this.logExecution(enrollment.id, null, 'error', error.message)

    // Retry logic
    const retryCount = enrollment.retry_count || 0

    if (retryCount < 3) {
      // Retry with exponential backoff
      const delayMinutes = Math.pow(2, retryCount) * 5 // 5, 10, 20 minutes
      const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000)

      await supabase
        .from('sequence_enrollments')
        .update({
          retry_count: retryCount + 1,
          next_step_at: nextRetryAt.toISOString(),
          last_error: error.message
        })
        .eq('id', enrollment.id)
    } else {
      // Max retries exceeded, pause enrollment
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'paused',
          last_error: `Max retries exceeded: ${error.message}`
        })
        .eq('id', enrollment.id)

      // Alert admin
      await this.alertAdmin(enrollment, error)
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Start worker
const executor = new SequenceExecutor()
executor.start()
```

---

## 🔌 API Endpoints

```
GET    /api/sequence-executor/status
Response: { isRunning, queueDepth, lastProcessedAt }

POST   /api/sequence-executor/pause
Response: { success: true }

POST   /api/sequence-executor/resume
Response: { success: true }

GET    /api/sequence-executor/queue
Query: { limit? }
Response: { queue: [] }

GET    /api/sequence-enrollments/:id/logs
Response: { logs: [] }

POST   /api/sequence-enrollments/:id/pause
Response: { enrollment }

POST   /api/sequence-enrollments/:id/resume
Response: { enrollment }

POST   /api/sequence-enrollments/:id/skip-step
Response: { enrollment }
```

---

## 🎨 UI/UX Screens

### 1. Execution Queue Dashboard (Admin)

**Metrics:**
- Queue depth: 42 enrollments due
- Processing: 5 active
- Completed (last hour): 234
- Errors (last hour): 3

**Queue Table:**
- Columns: Contact, Sequence, Next Step, Due At, Status
- Filter: Overdue, Errors, Paused
- Actions: View, Pause, Skip Step

---

### 2. Enrollment Activity Log

**Timeline View:**
- Shows each step execution
- Status icons: ✅ Sent, 👁️ Opened, 🖱️ Clicked, 💬 Replied
- Timestamps
- Error details if failed

---

## 🧪 Testing Strategy

- [ ]  Execute sequence end-to-end
- [ ]  Auto-stop on reply
- [ ]  Conditional branching
- [ ]  Error retry logic
- [ ]  Send limit enforcement
- [ ]  Graceful degradation

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "date-fns": "^3.0.0",
    "bull": "^4.12.0"
  }
}
```

---

## 🚀 Implementation Plan

**Week 1:**
- [ ]  Executor worker
- [ ]  Step execution logic
- [ ]  Auto-exit conditions
- [ ]  Error handling

**Week 2:**
- [ ]  Conditional branching
- [ ]  Send limit enforcement
- [ ]  Monitoring dashboard
- [ ]  Testing

---

## 🎯 Definition of Done

- [ ]  Sequences run on schedule
- [ ]  Auto-stop on reply working
- [ ]  Engagement branching functional
- [ ]  Queue delay <5 min
- [ ]  Tests passing

---

## ✅ Sign-Off

**Developer:** ___ **Date:** __
**QA Engineer:** ___ **Date:** __
**Product Manager:** ___ **Date:** __
