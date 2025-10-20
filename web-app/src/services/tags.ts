// @ts-nocheck
/**
 * Tag Service
 * Handles tag management and entity tagging
 */

import { createClient } from '@/lib/supabase/client'
import {
  Tag,
  TagCreate,
  EntityType,
  EntityTag,
  EntityTagCreate,
  TagFilters,
} from '@/types'

// ============================================================================
// TAG CRUD OPERATIONS
// ============================================================================

/**
 * Create a new tag
 */
export async function createTag(data: TagCreate): Promise<Tag> {
  try {
    const supabase = createClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return tag as Tag
  } catch (error) {
    console.error('Failed to create tag:', error)
    throw new Error('Failed to create tag')
  }
}

/**
 * Get all tags for a workspace, optionally filtered by entity type
 */
export async function getTags(
  workspaceId: string,
  entityType?: EntityType
): Promise<Tag[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('tags')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true })

    if (entityType) {
      // Get tags that are either specific to this entity type or universal (entity_type is null)
      query = query.or(`entity_type.eq.${entityType},entity_type.is.null`)
    }

    const { data: tags, error } = await query

    if (error) throw error
    return (tags || []) as Tag[]
  } catch (error) {
    console.error('Failed to get tags:', error)
    throw new Error('Failed to get tags')
  }
}

/**
 * Get a single tag by ID
 */
export async function getTag(id: string): Promise<Tag | null> {
  try {
    const supabase = createClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return tag as Tag
  } catch (error) {
    console.error('Failed to get tag:', error)
    throw new Error('Failed to get tag')
  }
}

/**
 * Update a tag
 */
export async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
  try {
    const supabase = createClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return tag as Tag
  } catch (error) {
    console.error('Failed to update tag:', error)
    throw new Error('Failed to update tag')
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<void> {
  try {
    const supabase = createClient()

    // Delete the tag (this will also cascade delete all entity_tags via database constraint)
    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete tag:', error)
    throw new Error('Failed to delete tag')
  }
}

// ============================================================================
// TAG ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Add a tag to an entity
 */
export async function addTagToEntity(
  tagId: string,
  entityType: EntityType,
  entityId: string
): Promise<EntityTag> {
  try {
    const supabase = createClient()

    const entityTagData: EntityTagCreate = {
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
      tagged_by: null, // Will be set by RLS/database trigger if needed
    }

    const { data: entityTag, error } = await supabase
      .from('entity_tags')
      .insert(entityTagData)
      .select()
      .single()

    if (error) {
      // Handle duplicate tag assignment gracefully
      if (error.code === '23505') {
        // Unique violation - tag already assigned
        throw new Error('Tag is already assigned to this entity')
      }
      throw error
    }

    return entityTag as EntityTag
  } catch (error) {
    console.error('Failed to add tag to entity:', error)
    if (error instanceof Error && error.message === 'Tag is already assigned to this entity') {
      throw error
    }
    throw new Error('Failed to add tag to entity')
  }
}

/**
 * Remove a tag from an entity
 */
export async function removeTagFromEntity(
  tagId: string,
  entityType: EntityType,
  entityId: string
): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('entity_tags')
      .delete()
      .eq('tag_id', tagId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to remove tag from entity:', error)
    throw new Error('Failed to remove tag from entity')
  }
}

/**
 * Get all tags for a specific entity
 */
export async function getEntityTags(
  entityType: EntityType,
  entityId: string
): Promise<Tag[]> {
  try {
    const supabase = createClient()

    // Join entity_tags with tags to get full tag information
    const { data: entityTags, error } = await supabase
      .from('entity_tags')
      .select('tag_id, tags(*)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) throw error

    // Extract the tags from the joined data
    const tags = (entityTags || [])
      .map((et: any) => et.tags)
      .filter((tag: any) => tag !== null) as Tag[]

    return tags
  } catch (error) {
    console.error('Failed to get entity tags:', error)
    throw new Error('Failed to get entity tags')
  }
}

/**
 * Get all entities with a specific tag
 */
export async function getEntitiesWithTag(
  tagId: string,
  entityType?: EntityType
): Promise<EntityTag[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('entity_tags')
      .select('*')
      .eq('tag_id', tagId)

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data: entityTags, error } = await query

    if (error) throw error
    return (entityTags || []) as EntityTag[]
  } catch (error) {
    console.error('Failed to get entities with tag:', error)
    throw new Error('Failed to get entities with tag')
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk assign a tag to multiple entities
 */
export async function bulkTagEntities(
  tagId: string,
  entityType: EntityType,
  entityIds: string[]
): Promise<EntityTag[]> {
  try {
    const supabase = createClient()

    // Create array of entity tag records
    const entityTags: EntityTagCreate[] = entityIds.map((entityId) => ({
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
      tagged_by: null,
    }))

    const { data, error } = await supabase
      .from('entity_tags')
      .insert(entityTags)
      .select()

    if (error) {
      // Handle partial success on duplicate key violations
      if (error.code === '23505') {
        console.warn('Some entities already had this tag assigned')
      } else {
        throw error
      }
    }

    return (data || []) as EntityTag[]
  } catch (error) {
    console.error('Failed to bulk tag entities:', error)
    throw new Error('Failed to bulk tag entities')
  }
}

/**
 * Bulk remove a tag from multiple entities
 */
export async function bulkUntagEntities(
  tagId: string,
  entityType: EntityType,
  entityIds: string[]
): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('entity_tags')
      .delete()
      .eq('tag_id', tagId)
      .eq('entity_type', entityType)
      .in('entity_id', entityIds)

    if (error) throw error
  } catch (error) {
    console.error('Failed to bulk untag entities:', error)
    throw new Error('Failed to bulk untag entities')
  }
}

/**
 * Replace all tags for an entity
 */
export async function replaceEntityTags(
  entityType: EntityType,
  entityId: string,
  tagIds: string[]
): Promise<EntityTag[]> {
  try {
    const supabase = createClient()

    // First, remove all existing tags
    await supabase
      .from('entity_tags')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    // Then add the new tags
    if (tagIds.length === 0) {
      return []
    }

    const entityTags: EntityTagCreate[] = tagIds.map((tagId) => ({
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
      tagged_by: null,
    }))

    const { data, error } = await supabase
      .from('entity_tags')
      .insert(entityTags)
      .select()

    if (error) throw error
    return (data || []) as EntityTag[]
  } catch (error) {
    console.error('Failed to replace entity tags:', error)
    throw new Error('Failed to replace entity tags')
  }
}

// ============================================================================
// SEARCH AND FILTER
// ============================================================================

/**
 * Search tags by name
 */
export async function searchTags(
  workspaceId: string,
  query: string,
  entityType?: EntityType
): Promise<Tag[]> {
  try {
    const supabase = createClient()
    let dbQuery = supabase
      .from('tags')
      .select('*')
      .eq('workspace_id', workspaceId)
      .ilike('name', `%${query}%`)
      .limit(20)

    if (entityType) {
      dbQuery = dbQuery.or(`entity_type.eq.${entityType},entity_type.is.null`)
    }

    const { data: tags, error } = await dbQuery

    if (error) throw error
    return (tags || []) as Tag[]
  } catch (error) {
    console.error('Failed to search tags:', error)
    throw new Error('Failed to search tags')
  }
}

/**
 * Get tag usage count
 */
export async function getTagUsageCount(tagId: string): Promise<number> {
  try {
    const supabase = createClient()

    const { count, error } = await supabase
      .from('entity_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Failed to get tag usage count:', error)
    throw new Error('Failed to get tag usage count')
  }
}
