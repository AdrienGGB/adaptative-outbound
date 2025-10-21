"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import {
  getAccount,
  getAccountContacts,
  getAccountActivities,
  deleteAccount,
} from "@/services"
import type { Account, Contact, Activity } from "@/types"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Globe,
  MapPin,
  Users,
  Briefcase,
  Calendar,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  Sparkles,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AccountForm } from "@/components/accounts/account-form"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { LogActivityDialog } from "@/components/activities/log-activity-dialog"

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { workspace, loading: authLoading } = useAuth()
  const [account, setAccount] = useState<Account | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createContactDialogOpen, setCreateContactDialogOpen] = useState(false)
  const [logActivityDialogOpen, setLogActivityDialogOpen] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const accountId = params.id as string

  useEffect(() => {
    if (!authLoading && !workspace) {
      router.push("/login")
    }
  }, [authLoading, workspace, router])

  useEffect(() => {
    if (!workspace || !accountId) return

    const fetchAccountData = async () => {
      setLoading(true)
      try {
        const [accountData, contactsData, activitiesData] = await Promise.all([
          getAccount(accountId),
          getAccountContacts(accountId),
          getAccountActivities(accountId),
        ])

        setAccount(accountData)
        setContacts(contactsData)
        setActivities(activitiesData)
      } catch (error) {
        console.error("Failed to fetch account data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccountData()
  }, [workspace, accountId])

  const handleEditSuccess = async () => {
    setEditDialogOpen(false)
    // Refresh account data
    if (accountId) {
      const accountData = await getAccount(accountId)
      setAccount(accountData)
    }
  }

  const handleContactCreated = async () => {
    setCreateContactDialogOpen(false)
    // Refresh contacts
    if (accountId) {
      const contactsData = await getAccountContacts(accountId)
      setContacts(contactsData)
      // Also refresh account to update contact_count
      const accountData = await getAccount(accountId)
      setAccount(accountData)
    }
  }

  const handleActivityLogged = async () => {
    setLogActivityDialogOpen(false)
    // Refresh activities
    if (accountId) {
      const activitiesData = await getAccountActivities(accountId)
      setActivities(activitiesData)
      // Also refresh account to update activity_count and last_activity_at
      const accountData = await getAccount(accountId)
      setAccount(accountData)
    }
  }

  const handleEnrich = async () => {
    if (!workspace || !account) return

    try {
      setEnriching(true)

      // Create enrichment job
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          job_type: 'enrich_account',
          payload: {
            account_id: account.id,
            account_name: account.name,
            domain: account.domain,
          },
          priority: 5,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create enrichment job')
      }

      const job = await response.json()

      // Navigate to job detail page
      router.push(`/jobs/${job.id}`)
    } catch (error) {
      console.error('Failed to create enrichment job:', error)
    } finally {
      setEnriching(false)
    }
  }

  const handleDelete = async () => {
    if (!account) return

    try {
      setDeleting(true)
      await deleteAccount(account.id)
      router.push('/accounts')
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    )
  }

  if (!workspace || !account) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle>Account Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/accounts")}>
                Back to Accounts
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLifecycleColor = (stage?: string | null) => {
    if (!stage) return "bg-gray-100 text-gray-800"

    switch (stage) {
      case "target":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300"
      case "engaged":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "opportunity":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "customer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "churned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatRevenue = (cents?: number | null) => {
    if (!cents) return null
    const dollars = cents / 100
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars)
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Accounts', href: '/accounts' },
        { label: account.name }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(account.status)}>
            {account.status}
          </Badge>
          {account.lifecycle_stage && (
            <Badge className={getLifecycleColor(account.lifecycle_stage)}>
              {account.lifecycle_stage}
            </Badge>
          )}
          <Button onClick={handleEnrich} disabled={enriching} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {enriching ? 'Enriching...' : 'Enrich'}
          </Button>
          <Button onClick={() => setEditDialogOpen(true)} disabled={deleting}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={deleting || enriching}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {account.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this account and all associated data including {contacts.length} contacts, {activities.length} activities, and related tasks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">
              Contacts ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="activities">
              Activities ({activities.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {account.contact_count}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {account.activity_count}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {account.open_opportunity_count}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {account.last_activity_at
                      ? new Date(account.last_activity_at).toLocaleDateString()
                      : "No activity"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Details */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {account.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Website</p>
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {account.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {account.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">
                        {account.description}
                      </p>
                    </div>
                  )}

                  {(account.headquarters_city ||
                    account.headquarters_state ||
                    account.headquarters_country) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {[
                            account.headquarters_city,
                            account.headquarters_state,
                            account.headquarters_country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {account.industry && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Industry</p>
                        <p className="text-sm text-muted-foreground">
                          {account.industry}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Firmographics */}
              <Card>
                <CardHeader>
                  <CardTitle>Firmographics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {account.employee_range && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Employee Range</p>
                        <p className="text-sm text-muted-foreground">
                          {account.employee_range}
                        </p>
                      </div>
                    </div>
                  )}

                  {account.employee_count && (
                    <div>
                      <p className="text-sm font-medium">Employee Count</p>
                      <p className="text-sm text-muted-foreground">
                        {account.employee_count.toLocaleString()} employees
                      </p>
                    </div>
                  )}

                  {account.annual_revenue && (
                    <div>
                      <p className="text-sm font-medium">Annual Revenue</p>
                      <p className="text-sm text-muted-foreground">
                        {formatRevenue(account.annual_revenue)}
                      </p>
                    </div>
                  )}

                  {account.account_tier && (
                    <div>
                      <p className="text-sm font-medium">Account Tier</p>
                      <Badge variant="outline" className="capitalize">
                        {account.account_tier.replace("-", " ")}
                      </Badge>
                    </div>
                  )}

                  {account.business_model && (
                    <div>
                      <p className="text-sm font-medium">Business Model</p>
                      <p className="text-sm text-muted-foreground">
                        {account.business_model}
                      </p>
                    </div>
                  )}

                  {account.company_type && (
                    <div>
                      <p className="text-sm font-medium">Company Type</p>
                      <p className="text-sm text-muted-foreground">
                        {account.company_type}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contacts</CardTitle>
                  <Button onClick={() => setCreateContactDialogOpen(true)}>
                    Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No contacts yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add contacts to start building relationships with this
                      account.
                    </p>
                    <Button onClick={() => setCreateContactDialogOpen(true)}>
                      Add First Contact
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/contacts/${contact.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {contact.first_name} {contact.last_name}
                          </h4>
                          {contact.job_title && (
                            <p className="text-sm text-muted-foreground">
                              {contact.job_title}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            contact.status === "active"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {contact.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity Timeline</CardTitle>
                  <Button onClick={() => setLogActivityDialogOpen(true)}>
                    Log Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No activities yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start logging activities to track engagement with this
                      account.
                    </p>
                    <Button onClick={() => setLogActivityDialogOpen(true)}>
                      Log First Activity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{activity.activity_type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(
                                activity.occurred_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm">{activity.description}</p>
                          )}
                          {activity.outcome && (
                            <Badge className="mt-2" variant="secondary">
                              {activity.outcome}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update account information for {account.name}
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            workspaceId={workspace.id}
            account={account}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={createContactDialogOpen}
        onOpenChange={setCreateContactDialogOpen}
        workspaceId={workspace.id}
        accountId={accountId}
        onSuccess={handleContactCreated}
      />

      {/* Log Activity Dialog */}
      <LogActivityDialog
        open={logActivityDialogOpen}
        onOpenChange={setLogActivityDialogOpen}
        workspaceId={workspace.id}
        accountId={accountId}
        onSuccess={handleActivityLogged}
      />
    </AppShell>
  )
}
