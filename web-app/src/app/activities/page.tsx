"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getActivities } from "@/services"
import type { Activity, ActivityFilters, ActivityType } from "@/types"
import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { LogActivityDialog } from "@/components/activities/log-activity-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Activity as ActivityIcon,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns"

export default function ActivitiesPage() {
  const { workspace, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all")
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all")
  const [logActivityOpen, setLogActivityOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !workspace) {
      router.push("/login")
    }
  }, [authLoading, workspace, router])

  // Fetch activities
  useEffect(() => {
    if (!workspace) return

    const fetchActivities = async () => {
      setLoading(true)
      try {
        const filters: ActivityFilters = {
          workspace_id: workspace.id,
        }

        // Activity type filter
        if (activityTypeFilter !== "all") {
          if (activityTypeFilter === "email") {
            filters.activity_type = [
              "email_sent",
              "email_opened",
              "email_clicked",
              "email_replied",
              "email_bounced",
            ] as ActivityType[]
          } else if (activityTypeFilter === "call") {
            filters.activity_type = [
              "call_completed",
              "call_missed",
              "call_voicemail",
            ] as ActivityType[]
          } else if (activityTypeFilter === "meeting") {
            filters.activity_type = [
              "meeting_scheduled",
              "meeting_held",
              "meeting_no_show",
            ] as ActivityType[]
          } else if (activityTypeFilter === "social") {
            filters.activity_type = [
              "linkedin_message_sent",
              "linkedin_connection_request",
              "linkedin_connection_accepted",
            ] as ActivityType[]
          } else if (activityTypeFilter === "website") {
            filters.activity_type = [
              "website_visit",
              "content_downloaded",
              "demo_completed",
              "trial_started",
            ] as ActivityType[]
          } else if (activityTypeFilter === "note") {
            filters.activity_type = ["note_added"] as ActivityType[]
          } else if (activityTypeFilter === "task") {
            filters.activity_type = ["task_completed"] as ActivityType[]
          }
        }

        // Date range filter
        if (dateRangeFilter !== "all") {
          const now = new Date()
          let startDate: Date

          switch (dateRangeFilter) {
            case "today":
              startDate = startOfDay(now)
              break
            case "week":
              startDate = startOfWeek(now)
              break
            case "month":
              startDate = startOfMonth(now)
              break
            case "7days":
              startDate = subDays(now, 7)
              break
            case "30days":
              startDate = subDays(now, 30)
              break
            default:
              startDate = startOfDay(now)
          }

          filters.created_after = startDate.toISOString()
        }

        // Outcome filter
        if (outcomeFilter !== "all") {
          filters.outcome = outcomeFilter as any
        }

        const data = await getActivities(filters)

        // Client-side search filter
        let filteredData = data
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filteredData = data.filter(
            (activity) =>
              activity.description?.toLowerCase().includes(query) ||
              activity.notes?.toLowerCase().includes(query) ||
              activity.activity_type.toLowerCase().includes(query)
          )
        }

        setActivities(filteredData)
      } catch (error) {
        console.error("Failed to fetch activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [workspace, searchQuery, activityTypeFilter, dateRangeFilter, outcomeFilter])

  // Calculate stats
  const stats = {
    total: activities.length,
    emails: activities.filter((a) =>
      a.activity_type.startsWith("email_")
    ).length,
    calls: activities.filter((a) => a.activity_type.startsWith("call_")).length,
    meetings: activities.filter((a) =>
      a.activity_type.startsWith("meeting_")
    ).length,
  }

  const refreshActivities = () => {
    // Trigger re-fetch by updating a dependency
    setLogActivityOpen(false)
    // Force re-fetch
    if (workspace) {
      setLoading(true)
      getActivities({ workspace_id: workspace.id }).then((data) => {
        setActivities(data)
        setLoading(false)
      })
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/workspace")}
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ActivityIcon className="h-6 w-6" />
                  Activities
                </h1>
                <p className="text-sm text-muted-foreground">
                  {workspace.name}
                </p>
              </div>
            </div>
            <Button onClick={() => setLogActivityOpen(true)}>
              Log Activity
            </Button>
            <LogActivityDialog
              open={logActivityOpen}
              onOpenChange={setLogActivityOpen}
              workspaceId={workspace.id}
              onSuccess={refreshActivities}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Activities
              </CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All activity types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emails}</div>
              <p className="text-xs text-muted-foreground">
                Sent, opened, replied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calls}</div>
              <p className="text-xs text-muted-foreground">
                Completed, missed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.meetings}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled, held
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities by description or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Button - Mobile */}
            <Button variant="outline" className="md:hidden">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filters - Desktop */}
          <div className="hidden md:flex gap-4">
            <Select
              value={activityTypeFilter}
              onValueChange={setActivityTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="social">Social (LinkedIn)</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="callback_requested">
                  Callback Requested
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activities Timeline */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ActivityTimeline activities={activities} />
        )}
      </main>
    </div>
  )
}
