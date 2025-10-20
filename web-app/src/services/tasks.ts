// @ts-nocheck
/**
 * Task Service
 * Handles task management and queries
 */

import { createClient } from '@/lib/supabase/client'
import {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskFilters,
  TaskStatus,
} from '@/types'

// ============================================================================
// TASK CRUD OPERATIONS
// ============================================================================

/**
 * Create a new task
 */
export async function createTask(data: TaskCreate): Promise<Task> {
  try {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return task as Task
  } catch (error) {
    console.error('Failed to create task:', error)
    throw new Error('Failed to create task')
  }
}

/**
 * Get tasks with optional filtering
 */
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  try {
    const supabase = createClient()
    let query = supabase.from('tasks').select('*')

    if (filters) {
      // Workspace filter
      if (filters.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id)
      }

      // Assignment filters
      if (filters.assigned_to) {
        if (Array.isArray(filters.assigned_to)) {
          query = query.in('assigned_to', filters.assigned_to)
        } else {
          query = query.eq('assigned_to', filters.assigned_to)
        }
      }

      // Entity filters
      if (filters.contact_id) {
        if (Array.isArray(filters.contact_id)) {
          query = query.in('contact_id', filters.contact_id)
        } else {
          query = query.eq('contact_id', filters.contact_id)
        }
      }

      if (filters.account_id) {
        if (Array.isArray(filters.account_id)) {
          query = query.in('account_id', filters.account_id)
        } else {
          query = query.eq('account_id', filters.account_id)
        }
      }

      // Task type filter
      if (filters.task_type) {
        if (Array.isArray(filters.task_type)) {
          query = query.in('task_type', filters.task_type)
        } else {
          query = query.eq('task_type', filters.task_type)
        }
      }

      // Status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      // Priority filter
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority)
        } else {
          query = query.eq('priority', filters.priority)
        }
      }

      // Date filters
      if (filters.due_before) {
        query = query.lte('due_date', filters.due_before)
      }
      if (filters.due_after) {
        query = query.gte('due_date', filters.due_after)
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after)
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before)
      }
      if (filters.completed_after) {
        query = query.gte('completed_at', filters.completed_after)
      }
      if (filters.completed_before) {
        query = query.lte('completed_at', filters.completed_before)
      }

      // Boolean filters
      if (filters.is_overdue) {
        const now = new Date().toISOString()
        query = query
          .lte('due_date', now)
          .neq('status', 'completed')
          .neq('status', 'cancelled')
      }

      if (filters.is_due_today) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        query = query
          .gte('due_date', today.toISOString())
          .lt('due_date', tomorrow.toISOString())
      }

      if (filters.is_due_this_week) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)
        query = query
          .gte('due_date', today.toISOString())
          .lt('due_date', nextWeek.toISOString())
      }

      if (filters.has_reminder !== undefined) {
        if (filters.has_reminder) {
          query = query.not('reminder_at', 'is', null)
        } else {
          query = query.is('reminder_at', null)
        }
      }

      // Limit and offset
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      // Order by
      if (filters.order_by) {
        const direction = filters.order_direction || 'asc'
        query = query.order(filters.order_by, { ascending: direction === 'asc' })
      } else {
        // Default: due date ascending, then priority descending
        query = query.order('due_date', { ascending: true, nullsFirst: false })
      }
    } else {
      // Default ordering
      query = query.order('due_date', { ascending: true, nullsFirst: false })
    }

    const { data: tasks, error } = await query

    if (error) throw error
    return (tasks || []) as Task[]
  } catch (error) {
    console.error('Failed to get tasks:', error)
    throw new Error('Failed to get tasks')
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  try {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return task as Task
  } catch (error) {
    console.error('Failed to get task:', error)
    throw new Error('Failed to get task')
  }
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: TaskUpdate): Promise<Task> {
  try {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return task as Task
  } catch (error) {
    console.error('Failed to update task:', error)
    throw new Error('Failed to update task')
  }
}

/**
 * Delete a task (hard delete)
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete task:', error)
    throw new Error('Failed to delete task')
  }
}

// ============================================================================
// TASK COMPLETION
// ============================================================================

/**
 * Mark a task as completed
 */
export async function completeTask(
  id: string,
  notes?: string
): Promise<Task> {
  try {
    const supabase = createClient()

    const updateData: TaskUpdate = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_notes: notes || null,
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return task as Task
  } catch (error) {
    console.error('Failed to complete task:', error)
    throw new Error('Failed to complete task')
  }
}

/**
 * Cancel a task
 */
export async function cancelTask(id: string): Promise<Task> {
  try {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return task as Task
  } catch (error) {
    console.error('Failed to cancel task:', error)
    throw new Error('Failed to cancel task')
  }
}

/**
 * Reopen a completed or cancelled task
 */
export async function reopenTask(id: string): Promise<Task> {
  try {
    const supabase = createClient()

    const updateData: TaskUpdate = {
      status: 'pending',
      completed_at: null,
      completed_by: null,
      completion_notes: null,
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return task as Task
  } catch (error) {
    console.error('Failed to reopen task:', error)
    throw new Error('Failed to reopen task')
  }
}

// ============================================================================
// TASK QUERIES
// ============================================================================

/**
 * Get all tasks assigned to a user
 */
export async function getMyTasks(
  userId: string,
  status?: TaskStatus
): Promise<Task[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      // By default, exclude completed and cancelled
      query = query.in('status', ['pending', 'in_progress'])
    }

    const { data: tasks, error } = await query

    if (error) throw error
    return (tasks || []) as Task[]
  } catch (error) {
    console.error('Failed to get my tasks:', error)
    throw new Error('Failed to get my tasks')
  }
}

/**
 * Get all overdue tasks in a workspace
 */
export async function getOverdueTasks(workspaceId: string): Promise<Task[]> {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .lte('due_date', now)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })

    if (error) throw error
    return (tasks || []) as Task[]
  } catch (error) {
    console.error('Failed to get overdue tasks:', error)
    throw new Error('Failed to get overdue tasks')
  }
}

/**
 * Get all tasks for a contact
 */
export async function getContactTasks(contactId: string): Promise<Task[]> {
  try {
    const supabase = createClient()

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('contact_id', contactId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) throw error
    return (tasks || []) as Task[]
  } catch (error) {
    console.error('Failed to get contact tasks:', error)
    throw new Error('Failed to get contact tasks')
  }
}

/**
 * Get all tasks for an account
 */
export async function getAccountTasks(accountId: string): Promise<Task[]> {
  try {
    const supabase = createClient()

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('account_id', accountId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) throw error
    return (tasks || []) as Task[]
  } catch (error) {
    console.error('Failed to get account tasks:', error)
    throw new Error('Failed to get account tasks')
  }
}

/**
 * Get tasks due today for a user
 */
export async function getTasksDueToday(userId: string): Promise<Task[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const supabase = createClient()

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString())
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })

    if (error) throw error
    return (tasks || []) as Task[]
  } catch (error) {
    console.error('Failed to get tasks due today:', error)
    throw new Error('Failed to get tasks due today')
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk create tasks
 */
export async function bulkCreateTasks(tasks: TaskCreate[]): Promise<Task[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select()

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Failed to bulk create tasks:', error)
    throw new Error('Failed to bulk create tasks')
  }
}

/**
 * Bulk update task status
 */
export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: TaskStatus
): Promise<Task[]> {
  try {
    const supabase = createClient()

    const updateData: TaskUpdate = { status }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .in('id', taskIds)
      .select()

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Failed to bulk update task status:', error)
    throw new Error('Failed to bulk update task status')
  }
}

/**
 * Bulk assign tasks to a user
 */
export async function bulkAssignTasks(
  taskIds: string[],
  userId: string
): Promise<Task[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId })
      .in('id', taskIds)
      .select()

    if (error) throw error
    return (data || []) as Task[]
  } catch (error) {
    console.error('Failed to bulk assign tasks:', error)
    throw new Error('Failed to bulk assign tasks')
  }
}
