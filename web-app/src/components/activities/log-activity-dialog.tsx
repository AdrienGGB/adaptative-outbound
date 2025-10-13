"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { logActivity } from "@/services"
import { getAccounts, getContacts } from "@/services"
import type { ActivityCreate, ActivityType, ActivityOutcome, Account, Contact } from "@/types"
import { toast } from "sonner"

const activitySchema = z.object({
  activity_type: z.enum([
    "email_sent",
    "call_completed",
    "meeting_held",
    "note_added",
  ] as const),
  subject: z.string().optional(),
  description: z.string().optional(),
  outcome: z.enum([
    "positive",
    "neutral",
    "negative",
    "no_answer",
    "not_interested",
    "interested",
    "callback_requested",
    "voicemail_left",
  ] as const).optional(),
  occurred_at: z.string(),
  account_id: z.string().uuid().optional().or(z.literal("")),
  contact_id: z.string().uuid().optional().or(z.literal("")),
})

type ActivityFormValues = z.infer<typeof activitySchema>

interface LogActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  accountId?: string
  contactId?: string
  onSuccess?: () => void
}

export function LogActivityDialog({
  open,
  onOpenChange,
  workspaceId,
  accountId,
  contactId,
  onSuccess,
}: LogActivityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Fetch accounts and contacts for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsData, contactsData] = await Promise.all([
          getAccounts({ workspace_id: workspaceId }),
          getContacts({ workspace_id: workspaceId }),
        ])
        setAccounts(accountsData)
        setContacts(contactsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load accounts and contacts")
      } finally {
        setLoadingData(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, workspaceId])

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity_type: "note_added",
      subject: "",
      description: "",
      outcome: undefined,
      occurred_at: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      account_id: accountId || "",
      contact_id: contactId || "",
    },
  })

  const onSubmit = async (values: ActivityFormValues) => {
    setIsSubmitting(true)
    try {
      const activityData: ActivityCreate = {
        workspace_id: workspaceId,
        account_id: values.account_id || null,
        contact_id: values.contact_id || null,
        user_id: null,
        activity_type: values.activity_type as ActivityType,
        activity_category: getCategoryFromType(values.activity_type),
        subject: values.subject || null,
        description: values.description || null,
        body: null,
        activity_data: {},
        outcome: (values.outcome as ActivityOutcome) || null,
        sentiment_score: null,
        occurred_at: new Date(values.occurred_at).toISOString(),
        duration_seconds: null,
        scheduled_for: null,
        source: "manual",
        source_id: null,
        external_id: null,
      }

      await logActivity(activityData)
      toast.success("Activity logged successfully")
      form.reset()
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to log activity:", error)
      toast.error("Failed to log activity. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>
            Record a new activity for a contact or account
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Activity Type */}
            <FormField
              control={form.control}
              name="activity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email_sent">Email Sent</SelectItem>
                      <SelectItem value="call_completed">
                        Call Completed
                      </SelectItem>
                      <SelectItem value="meeting_held">Meeting Held</SelectItem>
                      <SelectItem value="note_added">Note Added</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Quick summary..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed notes about this activity..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Outcome */}
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="not_interested">
                        Not Interested
                      </SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="callback_requested">
                        Callback Requested
                      </SelectItem>
                      <SelectItem value="voicemail_left">
                        Voicemail Left
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The outcome or result of this activity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & Time */}
            <FormField
              control={form.control}
              name="occurred_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    When did this activity occur?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account */}
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingData
                              ? "Loading accounts..."
                              : "Select account (optional)"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link this activity to an account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact */}
            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingData
                              ? "Loading contacts..."
                              : "Select contact (optional)"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link this activity to a contact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging..." : "Log Activity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to determine category from activity type
function getCategoryFromType(type: string): "email" | "call" | "meeting" | "note" | null {
  if (type.startsWith("email_")) return "email"
  if (type.startsWith("call_")) return "call"
  if (type.startsWith("meeting_")) return "meeting"
  if (type === "note_added") return "note"
  return null
}
