"use client"

import { Task, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Clock, User } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TaskListProps {
  tasks: Task[]
  onTaskComplete?: (taskId: string) => void
  isLoading?: boolean
}

export function TaskList({ tasks, onTaskComplete, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-1">No tasks found</h3>
          <p className="text-sm text-muted-foreground">
            All caught up! No tasks to display.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white border-red-500"
      case "high":
        return "bg-orange-500 text-white border-orange-500"
      case "medium":
        return "bg-blue-500 text-white border-blue-500"
      case "low":
        return "bg-slate-500 text-white border-slate-500"
      default:
        return "bg-slate-500 text-white border-slate-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500"
      case "in_progress":
        return "bg-blue-500 text-white border-blue-500"
      case "pending":
        return "bg-slate-500 text-white border-slate-500"
      case "cancelled":
        return "bg-red-500 text-white border-red-500"
      default:
        return "bg-slate-500 text-white border-slate-500"
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={cn(
            "transition-all hover:shadow-md",
            task.status === "completed" && "opacity-60"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium truncate">
                    {task.description || "Untitled Task"}
                  </h4>
                  {task.due_date && isOverdue(task.due_date) && task.status !== "completed" && (
                    <Badge variant="destructive" className="shrink-0">
                      Overdue
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Due {format(new Date(task.due_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  {task.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Assigned</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge className={getPriorityColor(task.priority)}>
                  {TASK_PRIORITY_LABELS[task.priority]}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
                {task.status !== "completed" && task.status !== "cancelled" && onTaskComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTaskComplete(task.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            </div>

            {task.completion_notes && task.status === "completed" && (
              <>
                <Separator className="my-3" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Notes:</span> {task.completion_notes}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
