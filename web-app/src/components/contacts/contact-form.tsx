"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createContact, updateContact } from "@/services"
import type {
  Contact,
  ContactCreate,
  ContactUpdate,
  Department,
  SeniorityLevel,
  ContactStatus,
} from "@/types"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getAccounts } from "@/services"
import type { Account } from "@/types"

// Zod validation schema
const contactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  job_title: z.string().optional(),
  department: z.enum([
    "Sales",
    "Marketing",
    "Engineering",
    "Finance",
    "Operations",
    "HR",
    "IT",
    "Product",
    "Customer Success",
    "Legal",
    "Executive",
  ] as const).optional(),
  seniority_level: z.enum([
    "C-Level",
    "VP",
    "Director",
    "Manager",
    "Individual Contributor",
    "Entry Level",
  ] as const).optional(),
  account_id: z.string().uuid().optional().or(z.literal("")),
  is_decision_maker: z.boolean(),
  is_champion: z.boolean(),
  status: z.enum(["active", "bounced", "opted_out", "invalid", "archived"] as const).optional(),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactFormProps {
  workspaceId: string
  contact?: Contact
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContactForm({
  workspaceId,
  contact,
  onSuccess,
  onCancel,
}: ContactFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Fetch accounts for the dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getAccounts({ workspace_id: workspaceId })
        setAccounts(data)
      } catch (error) {
        console.error("Failed to fetch accounts:", error)
        toast.error("Failed to load accounts")
      } finally {
        setLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [workspaceId])

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact?.first_name || "",
      last_name: contact?.last_name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      mobile_phone: contact?.mobile_phone || "",
      job_title: contact?.job_title || "",
      department: contact?.department || undefined,
      seniority_level: contact?.seniority_level || undefined,
      account_id: contact?.account_id || "",
      is_decision_maker: contact?.is_decision_maker ?? false,
      is_champion: contact?.is_champion ?? false,
      status: contact?.status || "active",
    },
  })

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true)
    try {
      // Generate full_name from first_name and last_name
      const fullName = [values.first_name, values.last_name]
        .filter(Boolean)
        .join(" ")

      // Convert empty strings to null
      const cleanedValues = {
        ...values,
        first_name: values.first_name || null,
        phone: values.phone || null,
        mobile_phone: values.mobile_phone || null,
        job_title: values.job_title || null,
        department: values.department || null,
        seniority_level: values.seniority_level || null,
        account_id: values.account_id || null,
      }

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
          workspace_id: workspaceId,
          full_name: fullName,
          first_name: cleanedValues.first_name,
          last_name: cleanedValues.last_name,
          email: cleanedValues.email,
          phone: cleanedValues.phone,
          mobile_phone: cleanedValues.mobile_phone,
          direct_dial: null,
          job_title: cleanedValues.job_title,
          normalized_title: null,
          department: cleanedValues.department as Department | null,
          seniority_level: cleanedValues.seniority_level as SeniorityLevel | null,
          reports_to_id: null,
          city: null,
          state: null,
          country: null,
          timezone: null,
          linkedin_url: null,
          linkedin_id: null,
          twitter_handle: null,
          twitter_url: null,
          github_username: null,
          email_status: "unverified",
          phone_status: null,
          last_verified_at: null,
          status: (cleanedValues.status as ContactStatus) || "active",
          do_not_contact: false,
          opted_out_at: null,
          bounce_reason: null,
          is_decision_maker: cleanedValues.is_decision_maker,
          is_champion: cleanedValues.is_champion,
          is_blocker: false,
          buying_role: null,
          influence_score: null,
          engagement_level: null,
          owner_id: null,
          source: "manual",
          created_by: null,
          last_contacted_at: null,
          last_enriched_at: null,
          external_id: null,
          account_id: cleanedValues.account_id,
        }

        const newContact = await createContact(contactData)
        toast.success("Contact created successfully")

        // Navigate to the new contact detail page
        router.push(`/contacts/${newContact.id}`)
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to save contact:", error)
      toast.error("Failed to save contact. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Basic Information</h3>
            <p className="text-sm text-muted-foreground">
              Personal details about the contact
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 987-6543" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Professional Details Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Professional Details</h3>
            <p className="text-sm text-muted-foreground">
              Work-related information
            </p>
          </div>

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="VP of Sales" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Customer Success">
                        Customer Success
                      </SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seniority_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seniority Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="C-Level">C-Level</SelectItem>
                      <SelectItem value="VP">VP</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Individual Contributor">
                        Individual Contributor
                      </SelectItem>
                      <SelectItem value="Entry Level">Entry Level</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Account Association Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Account</h3>
            <p className="text-sm text-muted-foreground">
              Associate contact with an account
            </p>
          </div>

          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingAccounts}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingAccounts
                            ? "Loading accounts..."
                            : "Select account"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this contact to an account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Influence Flags Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Influence</h3>
            <p className="text-sm text-muted-foreground">
              Decision-making and influence indicators
            </p>
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="is_decision_maker"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Decision Maker</FormLabel>
                    <FormDescription>
                      This person has decision-making authority
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_champion"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Champion</FormLabel>
                    <FormDescription>
                      This person actively advocates for your solution
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? contact
                ? "Updating..."
                : "Creating..."
              : contact
              ? "Update Contact"
              : "Create Contact"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
