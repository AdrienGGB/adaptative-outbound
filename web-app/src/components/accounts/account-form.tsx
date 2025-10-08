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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAccount, updateAccount } from "@/services"
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  EmployeeRange,
  AccountTier,
  LifecycleStage,
  BusinessModel,
  CompanyType,
} from "@/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Zod validation schema
const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  industry: z.string().optional(),
  employee_count: z.number().int().positive().optional().nullable(),
  employee_range: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"]).optional(),
  annual_revenue: z.number().int().positive().optional().nullable(),
  headquarters_city: z.string().optional(),
  headquarters_state: z.string().optional(),
  headquarters_country: z.string().length(2, "Use 2-letter country code (e.g., US)").optional().or(z.literal("")),
  account_tier: z.enum(["enterprise", "mid-market", "smb", "startup"]).optional(),
  lifecycle_stage: z.enum(["target", "engaged", "opportunity", "customer", "churned"]).optional(),
  business_model: z.enum(["B2B", "B2C", "B2B2C", "Marketplace"]).optional(),
  company_type: z.enum(["Public", "Private", "Non-profit", "Government"]).optional(),
  owner_id: z.string().uuid().optional().or(z.literal("")),
})

type AccountFormValues = z.infer<typeof accountSchema>

interface AccountFormProps {
  workspaceId: string
  account?: Account
  onSuccess?: () => void
  onCancel?: () => void
}

export function AccountForm({
  workspaceId,
  account,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || "",
      domain: account?.domain || "",
      website: account?.website || "",
      description: account?.description || "",
      industry: account?.industry || "",
      employee_count: account?.employee_count || null,
      employee_range: account?.employee_range || undefined,
      annual_revenue: account?.annual_revenue || null,
      headquarters_city: account?.headquarters_city || "",
      headquarters_state: account?.headquarters_state || "",
      headquarters_country: account?.headquarters_country || "",
      account_tier: account?.account_tier || undefined,
      lifecycle_stage: account?.lifecycle_stage || undefined,
      business_model: account?.business_model || undefined,
      company_type: account?.company_type || undefined,
      owner_id: account?.owner_id || "",
    },
  })

  const onSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true)
    try {
      // Convert empty strings to null
      const cleanedValues = {
        ...values,
        domain: values.domain || null,
        website: values.website || null,
        description: values.description || null,
        industry: values.industry || null,
        employee_count: values.employee_count || null,
        employee_range: values.employee_range || null,
        annual_revenue: values.annual_revenue || null,
        headquarters_city: values.headquarters_city || null,
        headquarters_state: values.headquarters_state || null,
        headquarters_country: values.headquarters_country || null,
        account_tier: values.account_tier || null,
        lifecycle_stage: values.lifecycle_stage || null,
        business_model: values.business_model || null,
        company_type: values.company_type || null,
        owner_id: values.owner_id || null,
      }

      if (account) {
        // Update existing account
        await updateAccount(account.id, cleanedValues as AccountUpdate)
        toast.success("Account updated successfully")
      } else {
        // Create new account
        const accountData: AccountCreate = {
          workspace_id: workspaceId,
          name: cleanedValues.name,
          domain: cleanedValues.domain,
          website: cleanedValues.website,
          description: cleanedValues.description,
          industry: cleanedValues.industry,
          sub_industry: null,
          employee_count: cleanedValues.employee_count,
          employee_range: cleanedValues.employee_range as EmployeeRange | null,
          annual_revenue: cleanedValues.annual_revenue,
          revenue_range: null,
          headquarters_address: null,
          headquarters_city: cleanedValues.headquarters_city,
          headquarters_state: cleanedValues.headquarters_state,
          headquarters_country: cleanedValues.headquarters_country,
          headquarters_postal_code: null,
          headquarters_timezone: null,
          latitude: null,
          longitude: null,
          founded_year: null,
          business_model: cleanedValues.business_model as BusinessModel | null,
          company_type: cleanedValues.company_type as CompanyType | null,
          stock_ticker: null,
          naics_code: null,
          sic_code: null,
          funding_stage: null,
          funding_total: null,
          last_funding_date: null,
          last_funding_amount: null,
          last_funding_type: null,
          investors: null,
          technologies: {},
          tech_stack_last_updated: null,
          linkedin_url: null,
          linkedin_id: null,
          twitter_handle: null,
          twitter_url: null,
          facebook_url: null,
          crunchbase_url: null,
          github_url: null,
          status: "active",
          account_tier: cleanedValues.account_tier as AccountTier | null,
          lifecycle_stage: cleanedValues.lifecycle_stage as LifecycleStage | null,
          owner_id: cleanedValues.owner_id,
          assigned_team_id: null,
          parent_account_id: null,
          ultimate_parent_id: null,
          source: "manual",
          created_by: null,
          last_activity_at: null,
          last_enriched_at: null,
          external_id: null,
          logo_url: null,
        }

        const newAccount = await createAccount(accountData)
        toast.success("Account created successfully")

        // Navigate to the new account detail page
        router.push(`/accounts/${newAccount.id}`)
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to save account:", error)
      toast.error("Failed to save account. Please try again.")
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
              Core details about the account
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corporation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain</FormLabel>
                <FormControl>
                  <Input placeholder="acme.com" {...field} />
                </FormControl>
                <FormDescription>
                  Company domain name (e.g., acme.com)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.acme.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the company..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Firmographics Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Firmographics</h3>
            <p className="text-sm text-muted-foreground">
              Company size and industry information
            </p>
          </div>

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="Technology" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employee_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="150"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employee_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Range</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501-1000">501-1000</SelectItem>
                      <SelectItem value="1001-5000">1001-5000</SelectItem>
                      <SelectItem value="5000+">5000+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="annual_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Revenue</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10000000"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Enter revenue in cents (e.g., 10000000 = $100,000)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="account_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="mid-market">Mid-Market</SelectItem>
                      <SelectItem value="smb">SMB</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lifecycle_stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lifecycle Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="target">Target</SelectItem>
                      <SelectItem value="engaged">Engaged</SelectItem>
                      <SelectItem value="opportunity">Opportunity</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="business_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Model</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="B2B">B2B</SelectItem>
                      <SelectItem value="B2C">B2C</SelectItem>
                      <SelectItem value="B2B2C">B2B2C</SelectItem>
                      <SelectItem value="Marketplace">Marketplace</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Non-profit">Non-profit</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Location</h3>
            <p className="text-sm text-muted-foreground">
              Headquarters location information
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="headquarters_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="headquarters_state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="headquarters_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country Code</FormLabel>
                <FormControl>
                  <Input placeholder="US" maxLength={2} {...field} />
                </FormControl>
                <FormDescription>
                  2-letter ISO country code (e.g., US, CA, GB)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Owner Assignment Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Assignment</h3>
            <p className="text-sm text-muted-foreground">
              Account ownership and team assignment
            </p>
          </div>

          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <FormControl>
                  <Input placeholder="Owner ID (UUID)" {...field} />
                </FormControl>
                <FormDescription>
                  Assign an owner to this account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
              ? account
                ? "Updating..."
                : "Creating..."
              : account
              ? "Update Account"
              : "Create Account"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
