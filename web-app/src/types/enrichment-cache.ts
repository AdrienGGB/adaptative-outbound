/**
 * Enrichment Cache Types
 * F001: Data Quality & Import System
 */

export type EnrichmentProvider = 'apollo' | 'clearbit' | 'zoominfo';

export type EnrichmentLookupType = 'domain' | 'email' | 'company_name';

export interface EnrichmentCache {
  id: string;
  workspace_id: string;

  // Cache Key
  provider: EnrichmentProvider;
  lookup_type: EnrichmentLookupType;
  lookup_value: string;

  // Cached Data
  enrichment_data: Record<string, any>;
  data_version: number;

  // Metadata
  created_at: string;
  expires_at: string | null;
  hit_count: number;
  last_accessed_at: string | null;
}

export interface EnrichmentCacheStats {
  total_entries: number;
  total_hits: number;
  avg_hits_per_entry: number;
  oldest_entry: string | null;
  newest_entry: string | null;
  expiring_soon_count: number;
}

export interface CreateEnrichmentCachePayload {
  workspace_id: string;
  provider: EnrichmentProvider;
  lookup_type: EnrichmentLookupType;
  lookup_value: string;
  enrichment_data: Record<string, any>;
  expires_at?: string;
}

export interface CacheCheckResult {
  found: boolean;
  data?: Record<string, any>;
  cache_entry?: EnrichmentCache;
}
