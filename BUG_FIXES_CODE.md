# Bug Fixes - Ready to Apply Code

This document contains ready-to-apply code fixes for all identified bugs.

---

## BUG-001: Contact Edit Button Not Functional (CRITICAL)

**File:** `/web-app/src/app/contacts/[id]/page.tsx`

### Step 1: Add Import Statements (top of file)

```tsx
// Add these to existing imports:
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContactForm } from "@/components/contacts/contact-form"
```

### Step 2: Add State (around line 40, after other useState declarations)

```tsx
const [editDialogOpen, setEditDialogOpen] = useState(false)
```

### Step 3: Add Handler Function (around line 93, after refreshActivities)

```tsx
const refreshContact = async () => {
  try {
    const contactData = await getContact(contactId)
    setContact(contactData)
  } catch (error) {
    console.error("Failed to refresh contact:", error)
  }
}

const handleEditSuccess = async () => {
  setEditDialogOpen(false)
  await refreshContact()
  toast.success("Contact updated successfully")
}
```

### Step 4: Update Edit Button (replace lines 131-134)

**BEFORE:**
```tsx
<Button variant="outline">
  <Edit className="mr-2 h-4 w-4" />
  Edit
</Button>
```

**AFTER:**
```tsx
<Button variant="outline" onClick={() => setEditDialogOpen(true)}>
  <Edit className="mr-2 h-4 w-4" />
  Edit
</Button>
```

### Step 5: Add Dialog Component (before closing </div> tag, around line 432)

```tsx
      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information for {contact.full_name}
            </DialogDescription>
          </DialogHeader>
          <ContactForm
            workspaceId={workspace.id}
            contact={contact}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

## BUG-002: Cancel Button Runtime Error (MEDIUM)

**File:** `/web-app/src/components/activities/log-activity-dialog.tsx`

### Fix (line 374)

**BEFORE:**
```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => setOpen(false)}
>
  Cancel
</Button>
```

**AFTER:**
```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => onOpenChange(false)}
>
  Cancel
</Button>
```

---

## BUG-003: No Navigation Link to Tasks (LOW)

**File:** `/web-app/src/app/workspace/page.tsx`

### Add Tasks Button (after line 164, in Quick Actions section)

**Find this section:**
```tsx
<CardContent className="space-y-2">
  <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
    Go to Dashboard
  </Button>
  <Button variant="outline" className="w-full" onClick={() => router.push('/accounts')}>
    View Accounts
  </Button>
  <Button variant="outline" className="w-full" onClick={() => router.push('/sequences')}>
    View Sequences
  </Button>
</CardContent>
```

**Add this button after "View Accounts" button:**
```tsx
<Button variant="outline" className="w-full" onClick={() => router.push('/tasks')}>
  View Tasks
</Button>
```

**Complete updated section:**
```tsx
<CardContent className="space-y-2">
  <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
    Go to Dashboard
  </Button>
  <Button variant="outline" className="w-full" onClick={() => router.push('/accounts')}>
    View Accounts
  </Button>
  <Button variant="outline" className="w-full" onClick={() => router.push('/tasks')}>
    View Tasks
  </Button>
  <Button variant="outline" className="w-full" onClick={() => router.push('/sequences')}>
    View Sequences
  </Button>
</CardContent>
```

---

## BUG-004: Dialog State Loss (HIGH)

**Files:**
- `/web-app/src/app/accounts/[id]/page.tsx`
- `/web-app/src/app/contacts/[id]/page.tsx`

### Option 1: Add State Persistence (Recommended for Quick Fix)

Add this useEffect hook for each dialog state:

```tsx
// For CreateContactDialog state persistence
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Store form state before tab becomes hidden
      console.log('Tab hidden - dialog state:', createContactDialogOpen)
    } else if (createContactDialogOpen) {
      // Force dialog re-render when tab becomes visible
      const wasOpen = createContactDialogOpen
      setCreateContactDialogOpen(false)
      setTimeout(() => {
        if (wasOpen) setCreateContactDialogOpen(true)
      }, 0)
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [createContactDialogOpen])
```

### Option 2: Move to Separate Pages (Long-term Solution)

Instead of dialogs, create dedicated pages:
- `/accounts/[id]/contacts/create`
- `/accounts/[id]/activities/create`

This is more robust but requires more refactoring.

---

## BUG-005: Controlled/Uncontrolled Input Warnings (MEDIUM)

**File:** `/web-app/src/components/tasks/create-task-dialog.tsx`

### Fix defaultValues (lines 84-90)

**BEFORE:**
```tsx
const form = useForm<TaskFormValues>({
  resolver: zodResolver(taskSchema),
  defaultValues: {
    task_type: "call",
    description: "",
    priority: "medium",
    contact_id: defaultContactId || "",
    account_id: defaultAccountId || "",
  },
})
```

**AFTER:**
```tsx
const form = useForm<TaskFormValues>({
  resolver: zodResolver(taskSchema),
  defaultValues: {
    task_type: "call",
    description: "",
    due_date: "",           // ← Add this
    priority: "medium",
    assigned_to: "",        // ← Add this
    contact_id: defaultContactId || "",
    account_id: defaultAccountId || "",
  },
})
```

---

## BUG-006: Form State Not Reset (HIGH)

**File:** `/web-app/src/components/contacts/contact-form.tsx`

### Add form.reset() (after line 207)

**Find this section (around line 200-210):**
```tsx
const newContact = await createContact(contactData)
toast.success("Contact created successfully")

// Navigate to the new contact detail page
router.push(`/contacts/${newContact.id}`)
```

**Update to:**
```tsx
const newContact = await createContact(contactData)
toast.success("Contact created successfully")

// Reset form for next use
form.reset()

// Navigate to the new contact detail page
router.push(`/contacts/${newContact.id}`)
```

**Complete updated section:**
```tsx
if (contact) {
  // Update existing contact
  await updateContact(contact.id, {
    ...cleanedValues,
    full_name: fullName,
  } as ContactUpdate)
  toast.success("Contact updated successfully")
} else {
  // Create new contact
  const contactData: ContactCreate = {
    // ... all the contact data ...
  }

  const newContact = await createContact(contactData)
  toast.success("Contact created successfully")

  // Reset form for next use
  form.reset()

  // Navigate to the new contact detail page
  router.push(`/contacts/${newContact.id}`)
}

if (onSuccess) {
  onSuccess()
}
```

---

## Testing Commands

After applying fixes, test with these commands:

```bash
# Start the development server
cd web-app
npm run dev

# Open browser to http://localhost:3001

# Test contact edit:
# 1. Navigate to any contact
# 2. Click Edit button
# 3. Modify fields
# 4. Save
# 5. Verify changes appear

# Test form reset:
# 1. Create a contact
# 2. Create another contact
# 3. Verify form is empty

# Test cancel button:
# 1. Open log activity dialog
# 2. Click cancel
# 3. Check console for errors

# Test task form:
# 1. Open create task dialog
# 2. Check console for warnings
# 3. Should see no warnings

# Test tasks navigation:
# 1. Go to /workspace
# 2. Click "View Tasks" button
# 3. Verify navigates to /tasks
```

---

## Verification Checklist

After applying all fixes:

- [ ] BUG-001: Contact edit button opens dialog and saves changes
- [ ] BUG-002: Cancel button closes dialog without errors
- [ ] BUG-003: Tasks button appears in workspace and works
- [ ] BUG-004: Dialog state persists across tab switches
- [ ] BUG-005: No controlled/uncontrolled input warnings
- [ ] BUG-006: Contact form resets after creation

---

## Git Commit Messages

```bash
# After fixing BUG-001
git add web-app/src/app/contacts/[id]/page.tsx
git commit -m "fix(contacts): Implement contact edit functionality (BUG-001)

- Add edit dialog state management
- Add edit button click handler
- Add ContactForm dialog component
- Add refresh handler after successful edit

Fixes critical bug where edit button was non-functional"

# After fixing BUG-002
git add web-app/src/components/activities/log-activity-dialog.tsx
git commit -m "fix(activities): Fix cancel button error (BUG-002)

- Change setOpen to onOpenChange
- Fixes runtime error when cancel button clicked"

# After fixing BUG-003
git add web-app/src/app/workspace/page.tsx
git commit -m "feat(navigation): Add tasks navigation link (BUG-003)

- Add View Tasks button to workspace quick actions
- Improves discoverability of tasks feature"

# After fixing BUG-005
git add web-app/src/components/tasks/create-task-dialog.tsx
git commit -m "fix(tasks): Initialize all form fields to prevent warnings (BUG-005)

- Add due_date and assigned_to to defaultValues
- Fixes controlled/uncontrolled input warnings"

# After fixing BUG-006
git add web-app/src/components/contacts/contact-form.tsx
git commit -m "fix(contacts): Reset form after contact creation (BUG-006)

- Add form.reset() after successful creation
- Prevents data leakage between consecutive contact creations"

# After fixing BUG-004 (if implementing Option 1)
git add web-app/src/app/accounts/[id]/page.tsx web-app/src/app/contacts/[id]/page.tsx
git commit -m "fix(dialogs): Add state persistence for tab visibility changes (BUG-004)

- Add visibilitychange event listener
- Force dialog re-render when tab becomes visible
- Prevents dialog state corruption on window switch"
```

---

## Notes

1. **Import Statements**: Make sure all imports are added at the top of files
2. **Toast Messages**: The `toast` import from 'sonner' should already be present
3. **Type Safety**: All code maintains TypeScript type safety
4. **Testing**: Test each fix individually before moving to the next
5. **Console Errors**: Check browser console after each fix to verify no new errors

---

**Last Updated:** 2025-01-08
**Status:** Ready to Apply
