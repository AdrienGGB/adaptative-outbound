"use client"

import type { Activity } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  MailOpen,
  Phone,
  Calendar,
  MessageSquare,
  FileText,
  MousePointer,
  PhoneOff,
  CalendarX,
  Linkedin,
  Globe,
  Download,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface ActivityTimelineProps {
  activities: Activity[]
}

// Map activity types to icons
const activityIcons = {
  email_sent: Mail,
  email_opened: MailOpen,
  email_clicked: MousePointer,
  email_replied: Mail,
  email_bounced: Mail,
  call_completed: Phone,
  call_missed: PhoneOff,
  call_voicemail: Phone,
  meeting_scheduled: Calendar,
  meeting_held: Calendar,
  meeting_no_show: CalendarX,
  linkedin_message_sent: Linkedin,
  linkedin_connection_request: Linkedin,
  linkedin_connection_accepted: Linkedin,
  website_visit: Globe,
  content_downloaded: Download,
  demo_completed: CheckCircle2,
  trial_started: CheckCircle2,
  note_added: FileText,
  task_completed: CheckCircle2,
}

// Map activity types to colors
const activityColors = {
  email_sent: "text-blue-500",
  email_opened: "text-green-500",
  email_clicked: "text-purple-500",
  email_replied: "text-green-600",
  email_bounced: "text-red-500",
  call_completed: "text-blue-600",
  call_missed: "text-orange-500",
  call_voicemail: "text-yellow-600",
  meeting_scheduled: "text-indigo-500",
  meeting_held: "text-indigo-600",
  meeting_no_show: "text-red-400",
  linkedin_message_sent: "text-blue-700",
  linkedin_connection_request: "text-blue-600",
  linkedin_connection_accepted: "text-green-500",
  website_visit: "text-gray-500",
  content_downloaded: "text-purple-600",
  demo_completed: "text-green-600",
  trial_started: "text-green-700",
  note_added: "text-gray-600",
  task_completed: "text-green-500",
}

// Map outcome to badge variant
const outcomeBadgeVariant = (
  outcome: Activity["outcome"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (outcome) {
    case "positive":
    case "interested":
    case "callback_requested":
      return "default"
    case "neutral":
    case "voicemail_left":
      return "secondary"
    case "negative":
    case "not_interested":
      return "destructive"
    case "no_answer":
      return "outline"
    default:
      return "outline"
  }
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">No activities recorded yet</p>
        <p className="text-sm text-muted-foreground">
          Activities will appear here as they occur
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.activity_type] || FileText
        const iconColor = activityColors[activity.activity_type] || "text-gray-500"

        return (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${iconColor}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              {index < activities.length - 1 && (
                <div className="h-full w-px bg-border" />
              )}
            </div>

            {/* Activity content */}
            <div className="flex-1 pb-8">
              <div className="rounded-lg border bg-card p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        {activity.subject || formatActivityType(activity.activity_type)}
                      </h4>
                      {activity.outcome && (
                        <Badge variant={outcomeBadgeVariant(activity.outcome)}>
                          {activity.outcome.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(new Date(activity.occurred_at), "PPp")}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {activity.description && (
                  <p className="mt-3 text-sm">{activity.description}</p>
                )}

                {/* Activity-specific details */}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {activity.activity_category && (
                    <span className="flex items-center gap-1">
                      Category: <Badge variant="outline">{activity.activity_category}</Badge>
                    </span>
                  )}

                  {activity.duration_seconds && (
                    <span>
                      Duration: {formatDuration(activity.duration_seconds)}
                    </span>
                  )}

                  {activity.source && (
                    <span>
                      Source: {activity.source.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {/* Links to related entities */}
                <div className="mt-3 flex gap-4 text-sm">
                  {activity.contact_id && (
                    <Link
                      href={`/contacts/${activity.contact_id}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Contact
                    </Link>
                  )}
                  {activity.account_id && (
                    <Link
                      href={`/accounts/${activity.account_id}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Account
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper functions
function formatActivityType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`
}
