/**
 * Account Service
 * Handles all CRUD operations and business logic for accounts
 */

import { createClient } from '@/lib/supabase/client'
import {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountFilters,
  Contact,
  Activity,
  AccountHierarchy,
} from '@/types'

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new account
 */
export async function createAccount(data: AccountCreate): Promise<Account> {
  try {
    const supabase = createClient()

    const { data: account, error } = await supabase
      .from('accounts')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return account as Account
  } catch (error) {
    console.error('Failed to create account:', error)
    throw new Error('Failed to create account')
  }
}

/**
 * Get a single account by ID
 */
export async function getAccount(id: string): Promise<Account | null> {
  try {
    const supabase = createClient()

    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return account as Account
  } catch (error) {
    console.error('Failed to get account:', error)
    throw new Error('Failed to get account')
  }
}

/**
 * Get accounts with optional filtering
 */
export async function getAccounts(filters?: AccountFilters): Promise<Account[]> {
  try {
    const supabase = createClient()
    let query = supabase.from('accounts').select('*')

    if (filters) {
      // Workspace filter
      if (filters.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id)
      }

      // Status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      // Tier filter
      if (filters.account_tier) {
        if (Array.isArray(filters.account_tier)) {
          query = query.in('account_tier', filters.account_tier)
        } else {
          query = query.eq('account_tier', filters.account_tier)
        }
      }

      // Lifecycle stage filter
      if (filters.lifecycle_stage) {
        if (Array.isArray(filters.lifecycle_stage)) {
          query = query.in('lifecycle_stage', filters.lifecycle_stage)
        } else {
          query = query.eq('lifecycle_stage', filters.lifecycle_stage)
        }
      }

      // Owner filter
      if (filters.owner_id) {
        if (Array.isArray(filters.owner_id)) {
          query = query.in('owner_id', filters.owner_id)
        } else {
          query = query.eq('owner_id', filters.owner_id)
        }
      }

      // Team filter
      if (filters.team_id) {
        if (Array.isArray(filters.team_id)) {
          query = query.in('team_id', filters.team_id)
        } else {
          query = query.eq('team_id', filters.team_id)
        }
      }

      // Industry filter
      if (filters.industry) {
        if (Array.isArray(filters.industry)) {
          query = query.in('industry', filters.industry)
        } else {
          query = query.eq('industry', filters.industry)
        }
      }

      // Employee range filter
      if (filters.employee_range) {
        if (Array.isArray(filters.employee_range)) {
          query = query.in('employee_range', filters.employee_range)
        } else {
          query = query.eq('employee_range', filters.employee_range)
        }
      }

      // Revenue range filter
      if (filters.revenue_range) {
        if (Array.isArray(filters.revenue_range)) {
          query = query.in('revenue_range', filters.revenue_range)
        } else {
          query = query.eq('revenue_range', filters.revenue_range)
        }
      }

      // Country filter
      if (filters.headquarters_country) {
        if (Array.isArray(filters.headquarters_country)) {
          query = query.in('headquarters_country', filters.headquarters_country)
        } else {
          query = query.eq('headquarters_country', filters.headquarters_country)
        }
      }

      // Date filters
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after)
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before)
      }
      if (filters.updated_after) {
        query = query.gte('updated_at', filters.updated_after)
      }
      if (filters.updated_before) {
        query = query.lte('updated_at', filters.updated_before)
      }

      // Last activity filter
      if (filters.last_activity_after) {
        query = query.gte('last_activity_at', filters.last_activity_after)
      }
      if (filters.last_activity_before) {
        query = query.lte('last_activity_at', filters.last_activity_before)
      }

      // Boolean filters
      if (filters.has_domain !== undefined) {
        if (filters.has_domain) {
          query = query.not('domain', 'is', null)
        } else {
          query = query.is('domain', null)
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
      }
    }

    const { data: accounts, error } = await query

    if (error) throw error
    return (accounts || []) as Account[]
  } catch (error) {
    console.error('Failed to get accounts:', error)
    throw new Error('Failed to get accounts')
  }
}

/**
 * Update an account
 */
export async function updateAccount(
  id: string,
  data: AccountUpdate
): Promise<Account> {
  try {
    const supabase = createClient()

    const { data: account, error } = await supabase
      .from('accounts')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return account as Account
  } catch (error) {
    console.error('Failed to update account:', error)
    throw new Error('Failed to update account')
  }
}

/**
 * Soft delete an account (set status to 'archived')
 */
export async function deleteAccount(id: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('accounts')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete account:', error)
    throw new Error('Failed to delete account')
  }
}

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Get all contacts for an account
 */
export async function getAccountContacts(accountId: string): Promise<Contact[]> {
  try {
    const supabase = createClient()

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (contacts || []) as Contact[]
  } catch (error) {
    console.error('Failed to get account contacts:', error)
    throw new Error('Failed to get account contacts')
  }
}

/**
 * Get all activities for an account
 */
export async function getAccountActivities(accountId: string): Promise<Activity[]> {
  try {
    const supabase = createClient()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('account_id', accountId)
      .order('activity_at', { ascending: false })

    if (error) throw error
    return (activities || []) as Activity[]
  } catch (error) {
    console.error('Failed to get account activities:', error)
    throw new Error('Failed to get account activities')
  }
}

/**
 * Get account hierarchy (parent/child relationships)
 */
export async function getAccountHierarchy(
  accountId: string
): Promise<AccountHierarchy[]> {
  try {
    const supabase = createClient()

    // Get both parent and child relationships
    const { data: hierarchies, error } = await supabase
      .from('account_hierarchies')
      .select('*')
      .or(`parent_account_id.eq.${accountId},child_account_id.eq.${accountId}`)

    if (error) throw error
    return (hierarchies || []) as AccountHierarchy[]
  } catch (error) {
    console.error('Failed to get account hierarchy:', error)
    throw new Error('Failed to get account hierarchy')
  }
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search accounts by name or domain
 */
export async function searchAccounts(
  query: string,
  workspaceId: string
): Promise<Account[]> {
  try {
    const supabase = createClient()

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .or(`name.ilike.%${query}%,domain.ilike.%${query}%`)
      .limit(50)

    if (error) throw error
    return (accounts || []) as Account[]
  } catch (error) {
    console.error('Failed to search accounts:', error)
    throw new Error('Failed to search accounts')
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk create accounts
 */
export async function bulkCreateAccounts(
  accounts: AccountCreate[]
): Promise<Account[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('accounts')
      .insert(accounts)
      .select()

    if (error) throw error
    return (data || []) as Account[]
  } catch (error) {
    console.error('Failed to bulk create accounts:', error)
    throw new Error('Failed to bulk create accounts')
  }
}

/**
 * Bulk update accounts
 */
export async function bulkUpdateAccounts(
  updates: Array<{ id: string; data: AccountUpdate }>
): Promise<Account[]> {
  try {
    const supabase = createClient()
    const updatedAccounts: Account[] = []

    // Process updates in a transaction-like manner
    for (const update of updates) {
      const account = await updateAccount(update.id, update.data)
      updatedAccounts.push(account)
    }

    return updatedAccounts
  } catch (error) {
    console.error('Failed to bulk update accounts:', error)
    throw new Error('Failed to bulk update accounts')
  }
}
