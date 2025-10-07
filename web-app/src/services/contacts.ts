/**
 * Contact Service
 * Handles all CRUD operations and business logic for contacts
 */

import { createClient } from '@/lib/supabase/client'
import {
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactFilters,
  Activity,
  Account,
} from '@/types'

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new contact
 */
export async function createContact(data: ContactCreate): Promise<Contact> {
  try {
    const supabase = createClient()

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return contact as Contact
  } catch (error) {
    console.error('Failed to create contact:', error)
    throw new Error('Failed to create contact')
  }
}

/**
 * Get a single contact by ID
 */
export async function getContact(id: string): Promise<Contact | null> {
  try {
    const supabase = createClient()

    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return contact as Contact
  } catch (error) {
    console.error('Failed to get contact:', error)
    throw new Error('Failed to get contact')
  }
}

/**
 * Get contacts with optional filtering
 */
export async function getContacts(filters?: ContactFilters): Promise<Contact[]> {
  try {
    const supabase = createClient()
    let query = supabase.from('contacts').select('*')

    if (filters) {
      // Workspace filter
      if (filters.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id)
      }

      // Account filter
      if (filters.account_id) {
        if (Array.isArray(filters.account_id)) {
          query = query.in('account_id', filters.account_id)
        } else {
          query = query.eq('account_id', filters.account_id)
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

      // Department filter
      if (filters.department) {
        if (Array.isArray(filters.department)) {
          query = query.in('department', filters.department)
        } else {
          query = query.eq('department', filters.department)
        }
      }

      // Seniority level filter
      if (filters.seniority_level) {
        if (Array.isArray(filters.seniority_level)) {
          query = query.in('seniority_level', filters.seniority_level)
        } else {
          query = query.eq('seniority_level', filters.seniority_level)
        }
      }

      // Buying role filter
      if (filters.buying_role) {
        if (Array.isArray(filters.buying_role)) {
          query = query.in('buying_role', filters.buying_role)
        } else {
          query = query.eq('buying_role', filters.buying_role)
        }
      }

      // Engagement level filter
      if (filters.engagement_level) {
        if (Array.isArray(filters.engagement_level)) {
          query = query.in('engagement_level', filters.engagement_level)
        } else {
          query = query.eq('engagement_level', filters.engagement_level)
        }
      }

      // Email status filter
      if (filters.email_status) {
        if (Array.isArray(filters.email_status)) {
          query = query.in('email_status', filters.email_status)
        } else {
          query = query.eq('email_status', filters.email_status)
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

      // Country filter
      if (filters.country) {
        if (Array.isArray(filters.country)) {
          query = query.in('country', filters.country)
        } else {
          query = query.eq('country', filters.country)
        }
      }

      // Boolean filters
      if (filters.is_decision_maker !== undefined) {
        query = query.eq('is_decision_maker', filters.is_decision_maker)
      }
      if (filters.is_champion !== undefined) {
        query = query.eq('is_champion', filters.is_champion)
      }
      if (filters.do_not_contact !== undefined) {
        query = query.eq('do_not_contact', filters.do_not_contact)
      }
      if (filters.has_email !== undefined) {
        if (filters.has_email) {
          query = query.not('email', 'is', null)
        } else {
          query = query.is('email', null)
        }
      }
      if (filters.has_phone !== undefined) {
        if (filters.has_phone) {
          query = query.not('phone', 'is', null)
        } else {
          query = query.is('phone', null)
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

    const { data: contacts, error } = await query

    if (error) throw error
    return (contacts || []) as Contact[]
  } catch (error) {
    console.error('Failed to get contacts:', error)
    throw new Error('Failed to get contacts')
  }
}

/**
 * Update a contact
 */
export async function updateContact(
  id: string,
  data: ContactUpdate
): Promise<Contact> {
  try {
    const supabase = createClient()

    const { data: contact, error } = await supabase
      .from('contacts')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return contact as Contact
  } catch (error) {
    console.error('Failed to update contact:', error)
    throw new Error('Failed to update contact')
  }
}

/**
 * Soft delete a contact (set status to 'archived')
 */
export async function deleteContact(id: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('contacts')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete contact:', error)
    throw new Error('Failed to delete contact')
  }
}

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Get all activities for a contact
 */
export async function getContactActivities(contactId: string): Promise<Activity[]> {
  try {
    const supabase = createClient()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('activity_at', { ascending: false })

    if (error) throw error
    return (activities || []) as Activity[]
  } catch (error) {
    console.error('Failed to get contact activities:', error)
    throw new Error('Failed to get contact activities')
  }
}

/**
 * Get the account associated with a contact
 */
export async function getContactAccount(contactId: string): Promise<Account | null> {
  try {
    const supabase = createClient()

    // First get the contact to find the account_id
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('account_id')
      .eq('id', contactId)
      .single()

    if (contactError) throw contactError
    if (!contact?.account_id) return null

    // Then get the account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', contact.account_id)
      .single()

    if (accountError) {
      if (accountError.code === 'PGRST116') return null // Not found
      throw accountError
    }

    return account as Account
  } catch (error) {
    console.error('Failed to get contact account:', error)
    throw new Error('Failed to get contact account')
  }
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search contacts by name or email
 */
export async function searchContacts(
  query: string,
  workspaceId: string
): Promise<Contact[]> {
  try {
    const supabase = createClient()

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(50)

    if (error) throw error
    return (contacts || []) as Contact[]
  } catch (error) {
    console.error('Failed to search contacts:', error)
    throw new Error('Failed to search contacts')
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk create contacts
 */
export async function bulkCreateContacts(
  contacts: ContactCreate[]
): Promise<Contact[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contacts')
      .insert(contacts)
      .select()

    if (error) throw error
    return (data || []) as Contact[]
  } catch (error) {
    console.error('Failed to bulk create contacts:', error)
    throw new Error('Failed to bulk create contacts')
  }
}
