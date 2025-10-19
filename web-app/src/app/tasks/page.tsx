"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { TaskList } from "@/components/tasks/task-list"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { getMyTasks, getOverdueTasks, getTasksDueToday, completeTask } from "@/services"
import { Task, TaskStatus, TaskPriority } from "@/types"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Clock, ListTodo } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TasksPage() {
  const { user, workspace } = useAuth()
  const router = useRouter()

  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all")

  useEffect(() => {
    if (user && workspace) {
      loadTasks()
    }
  }, [user, workspace])

  const loadTasks = async () => {
    if (!user || !workspace) return

    setIsLoading(true)
    try {
      const [myTasks, overdue, today] = await Promise.all([
        getMyTasks(user.id),
        getOverdueTasks(workspace.id),
        getTasksDueToday(user.id),
      ])

      setAllTasks(myTasks)
      setOverdueTasks(overdue)
      setTodayTasks(today)

      // Calculate upcoming tasks (not overdue, not due today)
      const now = new Date()
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const upcoming = myTasks.filter((task) => {
        if (!task.due_date) return false
        const dueDate = new Date(task.due_date)
        return dueDate > todayEnd && task.status !== "completed" && task.status !== "cancelled"
      })
      setUpcomingTasks(upcoming)
    } catch (error) {
      console.error("Failed to load tasks:", error)
      toast.error("Failed to load tasks")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId)
      toast.success("Task completed!")
      loadTasks()
    } catch (error) {
      console.error("Failed to complete task:", error)
      toast.error("Failed to complete task")
    }
  }

  const filterTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false
      return true
    })
  }

  const filteredAllTasks = filterTasks(allTasks)
  const filteredOverdueTasks = filterTasks(overdueTasks)
  const filteredTodayTasks = filterTasks(todayTasks)
  const filteredUpcomingTasks = filterTasks(upcomingTasks)

  if (!user || !workspace) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[50vh]">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Please sign in to view tasks</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      actions={<CreateTaskDialog workspaceId={workspace.id} onSuccess={loadTasks} />}
    >
      <div className="container mx-auto py-8 px-4 max-w-6xl">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{allTasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{overdueTasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{todayTasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{upcomingTasks.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all")
                  setPriorityFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Tasks ({filteredAllTasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({filteredOverdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="today">
            Due Today ({filteredTodayTasks.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({filteredUpcomingTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TaskList
            tasks={filteredAllTasks}
            onTaskComplete={handleCompleteTask}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <TaskList
            tasks={filteredOverdueTasks}
            onTaskComplete={handleCompleteTask}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="today">
          <TaskList
            tasks={filteredTodayTasks}
            onTaskComplete={handleCompleteTask}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="upcoming">
          <TaskList
            tasks={filteredUpcomingTasks}
            onTaskComplete={handleCompleteTask}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  )
}
