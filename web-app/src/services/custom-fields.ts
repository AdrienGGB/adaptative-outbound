/**
 * Custom Field Service
 * Handles custom field definitions and values
 */

import { createClient } from '@/lib/supabase/client'
import {
  CustomField,
  CustomFieldCreate,
  CustomFieldEntityType,
  CustomFieldValue,
  CustomFieldValueCreate,
} from '@/types'

// ============================================================================
// CUSTOM FIELD CRUD OPERATIONS
// ============================================================================

/**
 * Create a new custom field definition
 */
export async function createCustomField(data: CustomFieldCreate): Promise<CustomField> {
  try {
    const supabase = createClient()

    const { data: customField, error } = await supabase
      .from('custom_fields')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return customField as CustomField
  } catch (error) {
    console.error('Failed to create custom field:', error)
    throw new Error('Failed to create custom field')
  }
}

/**
 * Get all custom fields for a workspace and entity type
 */
export async function getCustomFields(
  workspaceId: string,
  entityType: CustomFieldEntityType
): Promise<CustomField[]> {
  try {
    const supabase = createClient()

    const { data: customFields, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('entity_type', entityType)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return (customFields || []) as CustomField[]
  } catch (error) {
    console.error('Failed to get custom fields:', error)
    throw new Error('Failed to get custom fields')
  }
}

/**
 * Get a single custom field by ID
 */
export async function getCustomField(id: string): Promise<CustomField | null> {
  try {
    const supabase = createClient()

    const { data: customField, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return customField as CustomField
  } catch (error) {
    console.error('Failed to get custom field:', error)
    throw new Error('Failed to get custom field')
  }
}

/**
 * Update a custom field definition
 */
export async function updateCustomField(
  id: string,
  data: Partial<CustomField>
): Promise<CustomField> {
  try {
    const supabase = createClient()

    const { data: customField, error } = await supabase
      .from('custom_fields')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return customField as CustomField
  } catch (error) {
    console.error('Failed to update custom field:', error)
    throw new Error('Failed to update custom field')
  }
}

/**
 * Delete a custom field (soft delete by hiding it)
 */
export async function deleteCustomField(id: string): Promise<void> {
  try {
    const supabase = createClient()

    // Soft delete by setting is_visible to false
    const { error } = await supabase
      .from('custom_fields')
      .update({ is_visible: false })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete custom field:', error)
    throw new Error('Failed to delete custom field')
  }
}

/**
 * Hard delete a custom field (removes field and all values)
 */
export async function hardDeleteCustomField(id: string): Promise<void> {
  try {
    const supabase = createClient()

    // This will cascade delete all custom_field_values
    const { error } = await supabase
      .from('custom_fields')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Failed to hard delete custom field:', error)
    throw new Error('Failed to hard delete custom field')
  }
}

// ============================================================================
// CUSTOM FIELD VALUE OPERATIONS
// ============================================================================

/**
 * Set a custom field value for an entity
 */
export async function setCustomFieldValue(
  fieldId: string,
  entityId: string,
  value: any
): Promise<CustomFieldValue> {
  try {
    const supabase = createClient()

    // First check if a value already exists
    const { data: existingValue } = await supabase
      .from('custom_field_values')
      .select('id')
      .eq('custom_field_id', fieldId)
      .eq('entity_id', entityId)
      .single()

    let result

    if (existingValue) {
      // Update existing value
      result = await supabase
        .from('custom_field_values')
        .update({ value })
        .eq('id', existingValue.id)
        .select()
        .single()
    } else {
      // Insert new value
      const valueData: CustomFieldValueCreate = {
        custom_field_id: fieldId,
        entity_id: entityId,
        value: value,
      }

      result = await supabase
        .from('custom_field_values')
        .insert(valueData)
        .select()
        .single()
    }

    if (result.error) throw result.error
    return result.data as CustomFieldValue
  } catch (error) {
    console.error('Failed to set custom field value:', error)
    throw new Error('Failed to set custom field value')
  }
}

/**
 * Get a custom field value for an entity
 */
export async function getCustomFieldValue(
  fieldId: string,
  entityId: string
): Promise<CustomFieldValue | null> {
  try {
    const supabase = createClient()

    const { data: value, error } = await supabase
      .from('custom_field_values')
      .select('*')
      .eq('custom_field_id', fieldId)
      .eq('entity_id', entityId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return value as CustomFieldValue
  } catch (error) {
    console.error('Failed to get custom field value:', error)
    throw new Error('Failed to get custom field value')
  }
}

/**
 * Delete a custom field value
 */
export async function deleteCustomFieldValue(
  fieldId: string,
  entityId: string
): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('custom_field_values')
      .delete()
      .eq('custom_field_id', fieldId)
      .eq('entity_id', entityId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete custom field value:', error)
    throw new Error('Failed to delete custom field value')
  }
}

/**
 * Get all custom field values for an entity with their field definitions
 */
export async function getEntityCustomFields(
  entityType: CustomFieldEntityType,
  entityId: string
): Promise<Array<CustomField & { value: any }>> {
  try {
    const supabase = createClient()

    // Get the entity to find workspace_id
    let workspaceId: string | null = null

    // Query based on entity type
    if (entityType === 'account') {
      const { data } = await supabase
        .from('accounts')
        .select('workspace_id')
        .eq('id', entityId)
        .single()
      workspaceId = data?.workspace_id || null
    } else if (entityType === 'contact') {
      const { data } = await supabase
        .from('contacts')
        .select('workspace_id')
        .eq('id', entityId)
        .single()
      workspaceId = data?.workspace_id || null
    }

    if (!workspaceId) {
      return []
    }

    // Get all custom fields for this entity type
    const customFields = await getCustomFields(workspaceId, entityType)

    // Get all values for this entity
    const { data: values, error } = await supabase
      .from('custom_field_values')
      .select('*')
      .eq('entity_id', entityId)

    if (error) throw error

    // Create a map of field_id -> value
    const valueMap = new Map<string, any>()
    ;(values || []).forEach((v: CustomFieldValue) => {
      valueMap.set(v.custom_field_id, v.value)
    })

    // Combine fields with their values
    return customFields.map((field) => ({
      ...field,
      value: valueMap.get(field.id) ?? null,
    }))
  } catch (error) {
    console.error('Failed to get entity custom fields:', error)
    throw new Error('Failed to get entity custom fields')
  }
}

/**
 * Bulk set custom field values for multiple entities
 */
export async function bulkSetCustomFieldValues(
  fieldId: string,
  entityValues: Array<{ entityId: string; value: any }>
): Promise<CustomFieldValue[]> {
  try {
    const supabase = createClient()
    const results: CustomFieldValue[] = []

    // Process each entity value
    for (const { entityId, value } of entityValues) {
      const result = await setCustomFieldValue(fieldId, entityId, value)
      results.push(result)
    }

    return results
  } catch (error) {
    console.error('Failed to bulk set custom field values:', error)
    throw new Error('Failed to bulk set custom field values')
  }
}

/**
 * Get all entities with a specific custom field value
 */
export async function getEntitiesWithCustomFieldValue(
  fieldId: string,
  value: any
): Promise<CustomFieldValue[]> {
  try {
    const supabase = createClient()

    const { data: values, error } = await supabase
      .from('custom_field_values')
      .select('*')
      .eq('custom_field_id', fieldId)
      .eq('value', value)

    if (error) throw error
    return (values || []) as CustomFieldValue[]
  } catch (error) {
    console.error('Failed to get entities with custom field value:', error)
    throw new Error('Failed to get entities with custom field value')
  }
}

// ============================================================================
// REORDERING
// ============================================================================

/**
 * Reorder custom fields
 */
export async function reorderCustomFields(
  fieldOrders: Array<{ id: string; display_order: number }>
): Promise<void> {
  try {
    const supabase = createClient()

    // Update each field's display_order
    for (const { id, display_order } of fieldOrders) {
      await supabase
        .from('custom_fields')
        .update({ display_order })
        .eq('id', id)
    }
  } catch (error) {
    console.error('Failed to reorder custom fields:', error)
    throw new Error('Failed to reorder custom fields')
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a custom field value against field rules
 */
export async function validateCustomFieldValue(
  fieldId: string,
  value: any
): Promise<{ valid: boolean; error?: string }> {
  try {
    const field = await getCustomField(fieldId)
    if (!field) {
      return { valid: false, error: 'Custom field not found' }
    }

    // Check required
    if (field.is_required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'This field is required' }
    }

    // If no value and not required, it's valid
    if (!value && !field.is_required) {
      return { valid: true }
    }

    const rules = field.validation_rules

    if (!rules) {
      return { valid: true }
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.min_length && value.length < rules.min_length) {
        return { valid: false, error: `Minimum length is ${rules.min_length}` }
      }
      if (rules.max_length && value.length > rules.max_length) {
        return { valid: false, error: `Maximum length is ${rules.max_length}` }
      }
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern)
        if (!regex.test(value)) {
          return { valid: false, error: rules.error_message || 'Invalid format' }
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return { valid: false, error: `Minimum value is ${rules.min}` }
      }
      if (rules.max !== undefined && value > rules.max) {
        return { valid: false, error: `Maximum value is ${rules.max}` }
      }
    }

    // Array validations (for multi_select)
    if (Array.isArray(value)) {
      if (rules.min_items && value.length < rules.min_items) {
        return { valid: false, error: `Select at least ${rules.min_items} items` }
      }
      if (rules.max_items && value.length > rules.max_items) {
        return { valid: false, error: `Select at most ${rules.max_items} items` }
      }
    }

    // Allowed/disallowed values
    if (rules.allowed_values && !rules.allowed_values.includes(value)) {
      return { valid: false, error: 'Invalid value' }
    }
    if (rules.disallowed_values && rules.disallowed_values.includes(value)) {
      return { valid: false, error: 'This value is not allowed' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Failed to validate custom field value:', error)
    return { valid: false, error: 'Validation failed' }
  }
}
