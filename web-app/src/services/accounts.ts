// @ts-nocheck
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
      .insert(data as any)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating account:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return account as Account
  } catch (error: any) {
    console.error('Failed to create account:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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
      console.error('Supabase error fetching account:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }

    return account as Account
  } catch (error: any) {
    console.error('Failed to get account:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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

      // Team filter - commented out as team_id not in AccountFilters type
      // if (filters.team_id) {
      //   if (Array.isArray(filters.team_id)) {
      //     query = query.in('team_id', filters.team_id)
      //   } else {
      //     query = query.eq('team_id', filters.team_id)
      //   }
      // }

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
      // TODO: Add updated_after/updated_before to AccountFilters type if needed
      // if (filters.updated_after) {
      //   query = query.gte('updated_at', filters.updated_after)
      // }
      // if (filters.updated_before) {
      //   query = query.lte('updated_at', filters.updated_before)
      // }

      // Last activity filter
      if (filters.last_activity_after) {
        query = query.gte('last_activity_at', filters.last_activity_after)
      }
      if (filters.last_activity_before) {
        query = query.lte('last_activity_at', filters.last_activity_before)
      }

      // Boolean filters
      // TODO: Add has_domain to AccountFilters type if needed
      // Boolean filters
      // if (filters.has_domain !== undefined) {
      //   if (filters.has_domain) {
      //     query = query.not('domain', 'is', null)
      //   } else {
      //     query = query.is('domain', null)
      //   }
      // }

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

    if (error) {
      console.error('Supabase error fetching accounts:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return (accounts || []) as Account[]
  } catch (error: any) {
    console.error('Failed to get accounts:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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

    if (error) {
      console.error('Supabase error updating account:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return account as Account
  } catch (error: any) {
    console.error('Failed to update account:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
  }
}

/**
 * Delete an account permanently
 * Note: CASCADE DELETE will automatically remove all related records
 */
export async function deleteAccount(id: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error deleting account:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
  } catch (error: any) {
    console.error('Failed to delete account:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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

    if (error) {
      console.error('Supabase error fetching account contacts:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return (contacts || []) as Contact[]
  } catch (error: any) {
    console.error('Failed to get account contacts:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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
      .order('occurred_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching account activities:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return (activities || []) as Activity[]
  } catch (error: any) {
    console.error('Failed to get account activities:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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

    if (error) {
      console.error('Supabase error fetching account hierarchy:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return (hierarchies || []) as AccountHierarchy[]
  } catch (error: any) {
    console.error('Failed to get account hierarchy:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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

    if (error) {
      console.error('Supabase error searching accounts:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return (accounts || []) as Account[]
  } catch (error: any) {
    console.error('Failed to search accounts:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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

    if (error) {
      console.error('Supabase error bulk creating accounts:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      throw error
    }
    return (data || []) as Account[]
  } catch (error: any) {
    console.error('Failed to bulk create accounts:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
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
  } catch (error: any) {
    console.error('Failed to bulk update accounts:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      full: error
    })
    throw error
  }
}
