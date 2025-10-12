"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import {
  getContact,
  getContactActivities,
  getContactAccount,
} from "@/services"
import type { Contact, Activity, Account } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { LogActivityDialog } from "@/components/activities/log-activity-dialog"
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Crown,
  Award,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { workspace, loading: authLoading } = useAuth()
  const [contact, setContact] = useState<Contact | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const contactId = params.id as string

  // Fetch contact data
  useEffect(() => {
    if (!workspace) return

    const fetchContactData = async () => {
      setLoading(true)
      try {
        const [contactData, activitiesData] = await Promise.all([
          getContact(contactId),
          getContactActivities(contactId),
        ])

        if (!contactData) {
          router.push("/contacts")
          return
        }

        setContact(contactData)
        setActivities(activitiesData)

        // Fetch account if contact has one
        if (contactData.account_id) {
          const accountData = await getContactAccount(contactId)
          setAccount(accountData)
        }
      } catch (error) {
        console.error("Failed to fetch contact:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContactData()
  }, [workspace, contactId, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !workspace) {
      router.push("/login")
    }
  }, [authLoading, workspace, router])

  const refreshActivities = async () => {
    try {
      const activitiesData = await getContactActivities(contactId)
      setActivities(activitiesData)
    } catch (error) {
      console.error("Failed to refresh activities:", error)
    }
  }

  const refreshContact = async () => {
    try {
      const contactData = await getContact(contactId)
      if (contactData) {
        setContact(contactData)
      }
      await refreshActivities()
    } catch (error) {
      console.error("Failed to refresh contact:", error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!workspace || !contact) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/contacts")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Contacts
              </Button>
            </div>
            <div className="flex gap-2">
              <LogActivityDialog
                workspaceId={workspace.id}
                contactId={contact.id}
                onSuccess={refreshActivities}
              />
              <EditContactDialog
                workspaceId={workspace.id}
                contact={contact}
                onSuccess={refreshContact}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Contact Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{contact.full_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                {contact.job_title && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {contact.job_title}
                  </span>
                )}
                {contact.department && (
                  <Badge variant="outline">{contact.department}</Badge>
                )}
                {contact.seniority_level && (
                  <Badge variant="secondary">{contact.seniority_level}</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {contact.is_decision_maker && (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Decision Maker
                  </Badge>
                )}
                {contact.is_champion && (
                  <Badge variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" />
                    Champion
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant={contact.status === "active" ? "default" : "secondary"}>
              {contact.status}
            </Badge>
          </div>

          {/* Account Link */}
          {account && (
            <Link
              href={`/accounts/${account.id}`}
              className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Building2 className="h-4 w-4" />
              {account.name}
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Activities
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contact.activity_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Emails Sent
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contact.email_sent_count}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Emails Opened
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contact.email_opened_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {contact.email_sent_count > 0
                  ? `${Math.round(
                      (contact.email_opened_count / contact.email_sent_count) *
                        100
                    )}% open rate`
                  : "No emails sent"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Emails Replied
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contact.email_replied_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {contact.email_sent_count > 0
                  ? `${Math.round(
                      (contact.email_replied_count /
                        contact.email_sent_count) *
                        100
                    )}% reply rate`
                  : "No emails sent"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-primary hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {(contact.phone || contact.mobile_phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${contact.mobile_phone || contact.phone}`}
                        className="text-primary hover:underline"
                      >
                        {contact.mobile_phone || contact.phone}
                      </a>
                    </div>
                  )}
                  {(contact.city || contact.state || contact.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[contact.city, contact.state, contact.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Job Title</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.job_title || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.department || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Seniority Level</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.seniority_level || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Influence & Role */}
              <Card>
                <CardHeader>
                  <CardTitle>Influence & Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Buying Role</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.buying_role || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Influence Score</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.influence_score
                        ? `${contact.influence_score}/100`
                        : "Not scored"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Engagement Level</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.engagement_level || "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Email Status</p>
                    <Badge variant="outline">{contact.email_status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Do Not Contact</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.do_not_contact ? "Yes" : "No"}
                    </p>
                  </div>
                  {contact.last_contacted_at && (
                    <div>
                      <p className="text-sm font-medium">Last Contacted</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(contact.last_contacted_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={activities} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">
                    Task management coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
