/**
 * Enrichment Cache Service
 * F001: Data Quality & Import System
 *
 * Provides caching layer for enrichment data from external providers (Apollo.io, etc.)
 * Reduces API calls and costs by caching results for 30 days
 */

import { createClient } from '@/lib/supabase/server';
import type {
  EnrichmentCache,
  EnrichmentProvider,
  EnrichmentLookupType,
  CacheCheckResult,
  EnrichmentCacheStats,
  CreateEnrichmentCachePayload,
} from '@/types/enrichment-cache';

/**
 * Check if enrichment data exists in cache
 * Returns cached data if found and not expired
 */
export async function checkCache(
  workspaceId: string,
  provider: EnrichmentProvider,
  lookupType: EnrichmentLookupType,
  lookupValue: string
): Promise<CacheCheckResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('enrichment_cache')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .eq('lookup_type', lookupType)
    .eq('lookup_value', lookupValue.toLowerCase())
    .gt('expires_at', new Date().toISOString()) // Only get non-expired entries
    .maybeSingle();

  if (error) {
    console.error('Error checking cache:', error);
    return { found: false };
  }

  if (!data) {
    return { found: false };
  }

  // Update hit count and last_accessed_at
  await supabase
    .from('enrichment_cache')
    .update({
      hit_count: data.hit_count + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  return {
    found: true,
    data: data.enrichment_data,
    cache_entry: data as EnrichmentCache,
  };
}

/**
 * Write enrichment data to cache
 * Automatically sets expiration to 30 days from now
 */
export async function writeCache(
  payload: CreateEnrichmentCachePayload
): Promise<EnrichmentCache | null> {
  const supabase = await createClient();

  // Normalize lookup value to lowercase for consistent matching
  const normalizedPayload = {
    ...payload,
    lookup_value: payload.lookup_value.toLowerCase(),
  };

  const { data, error } = await supabase
    .from('enrichment_cache')
    .upsert(normalizedPayload, {
      onConflict: 'provider,lookup_type,lookup_value',
    })
    .select()
    .single();

  if (error) {
    console.error('Error writing to cache:', error);
    return null;
  }

  return data as EnrichmentCache;
}

/**
 * Get cache statistics for a workspace
 */
export async function getCacheStats(
  workspaceId: string,
  provider?: EnrichmentProvider
): Promise<EnrichmentCacheStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_cache_stats', {
    p_workspace_id: workspaceId,
    p_provider: provider || null,
  });

  if (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return {
      total_entries: 0,
      total_hits: 0,
      avg_hits_per_entry: 0,
      oldest_entry: null,
      newest_entry: null,
      expiring_soon_count: 0,
    };
  }

  return data[0] as EnrichmentCacheStats;
}

/**
 * Clear specific cache entry
 */
export async function clearCacheEntry(cacheId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('enrichment_cache')
    .delete()
    .eq('id', cacheId);

  if (error) {
    console.error('Error clearing cache entry:', error);
    return false;
  }

  return true;
}

/**
 * Clear all cache for a workspace
 */
export async function clearWorkspaceCache(
  workspaceId: string,
  provider?: EnrichmentProvider
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from('enrichment_cache')
    .delete()
    .eq('workspace_id', workspaceId);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { error, count } = await query;

  if (error) {
    console.error('Error clearing workspace cache:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Clean up expired cache entries
 * Returns count of deleted entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('cleanup_expired_cache');

  if (error) {
    console.error('Error cleaning up expired cache:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Get all cache entries for a workspace (with pagination)
 */
export async function getCacheEntries(
  workspaceId: string,
  options?: {
    provider?: EnrichmentProvider;
    limit?: number;
    offset?: number;
  }
): Promise<{ entries: EnrichmentCache[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('enrichment_cache')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.provider) {
    query = query.eq('provider', options.provider);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error getting cache entries:', error);
    return { entries: [], total: 0 };
  }

  return {
    entries: (data as EnrichmentCache[]) || [],
    total: count || 0,
  };
}
