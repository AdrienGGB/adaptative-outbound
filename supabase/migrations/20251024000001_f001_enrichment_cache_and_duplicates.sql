-- F001: Data Quality & Import System
-- Migration: enrichment_cache and duplicate_candidates tables
-- Description: Support enrichment caching and duplicate detection
-- Dependencies: 003_core_data_schema.sql (accounts, contacts tables)

-- ============================================================================
-- ENRICHMENT CACHE TABLE
-- ============================================================================

CREATE TABLE enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Cache Key
  provider VARCHAR(50) NOT NULL, -- 'apollo', 'clearbit', 'zoominfo'
  lookup_type VARCHAR(50) NOT NULL, -- 'domain', 'email', 'company_name'
  lookup_value VARCHAR(255) NOT NULL,

  -- Cached Data
  enrichment_data JSONB NOT NULL,
  data_version INT DEFAULT 1,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Cache expiration (30 days default)
  hit_count INT DEFAULT 0, -- Track cache hits
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(provider, lookup_type, lookup_value)
);

-- Indexes for enrichment_cache
CREATE INDEX idx_enrichment_cache_workspace ON enrichment_cache(workspace_id);
CREATE INDEX idx_enrichment_cache_lookup ON enrichment_cache(provider, lookup_type, lookup_value);
CREATE INDEX idx_enrichment_cache_expires ON enrichment_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_enrichment_cache_workspace_provider ON enrichment_cache(workspace_id, provider);

-- RLS for enrichment_cache
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access cache in their workspace"
  ON enrichment_cache FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to automatically set expiration date
CREATE OR REPLACE FUNCTION set_enrichment_cache_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrichment_cache_expiration_trigger
  BEFORE INSERT ON enrichment_cache
  FOR EACH ROW
  EXECUTE FUNCTION set_enrichment_cache_expiration();

-- ============================================================================
-- DUPLICATE CANDIDATES TABLE
-- ============================================================================

CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Entity Information
  entity_type VARCHAR(50) NOT NULL, -- 'account', 'contact'
  entity_id_1 UUID NOT NULL,
  entity_id_2 UUID NOT NULL,

  -- Similarity Metrics
  similarity_score DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  matching_fields TEXT[], -- ['domain', 'name', 'email']

  -- Detailed Similarity Breakdown
  field_similarities JSONB,
  -- {
  --   "domain_score": 100,
  --   "name_score": 85,
  --   "email_score": 20,
  --   "city_score": 0
  -- }

  -- Detection Method
  detection_method VARCHAR(50), -- 'domain_match', 'fuzzy_name', 'email_match'
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Resolution
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'merged', 'not_duplicate', 'ignored'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  merged_into UUID, -- Which record was kept (entity_id_1 or entity_id_2)

  -- Ensure entity_id_1 < entity_id_2 to prevent duplicate pairs
  CHECK(entity_id_1 < entity_id_2),

  -- Ensure unique pairs per workspace and entity type
  UNIQUE(workspace_id, entity_type, entity_id_1, entity_id_2)
);

-- Indexes for duplicate_candidates
CREATE INDEX idx_duplicate_candidates_workspace ON duplicate_candidates(workspace_id, status);
CREATE INDEX idx_duplicate_candidates_entity_type ON duplicate_candidates(entity_type, status);
CREATE INDEX idx_duplicate_candidates_score ON duplicate_candidates(similarity_score DESC)
  WHERE status = 'pending';
CREATE INDEX idx_duplicate_candidates_detected ON duplicate_candidates(detected_at DESC);
CREATE INDEX idx_duplicate_candidates_entity_1 ON duplicate_candidates(entity_id_1);
CREATE INDEX idx_duplicate_candidates_entity_2 ON duplicate_candidates(entity_id_2);

-- RLS for duplicate_candidates
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view duplicates in their workspace"
  ON duplicate_candidates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert duplicates in their workspace"
  ON duplicate_candidates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update duplicates in their workspace"
  ON duplicate_candidates FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete duplicates in their workspace"
  ON duplicate_candidates FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM enrichment_cache
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats(p_workspace_id UUID, p_provider VARCHAR DEFAULT NULL)
RETURNS TABLE (
  total_entries BIGINT,
  total_hits BIGINT,
  avg_hits_per_entry NUMERIC,
  oldest_entry TIMESTAMP WITH TIME ZONE,
  newest_entry TIMESTAMP WITH TIME ZONE,
  expiring_soon_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    COALESCE(SUM(hit_count), 0)::BIGINT as total_hits,
    COALESCE(AVG(hit_count), 0) as avg_hits_per_entry,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry,
    COUNT(*) FILTER (WHERE expires_at < NOW() + INTERVAL '7 days')::BIGINT as expiring_soon_count
  FROM enrichment_cache
  WHERE workspace_id = p_workspace_id
    AND (p_provider IS NULL OR provider = p_provider);
END;
$$ LANGUAGE plpgsql;

-- Function to get duplicate statistics
CREATE OR REPLACE FUNCTION get_duplicate_stats(p_workspace_id UUID, p_entity_type VARCHAR DEFAULT NULL)
RETURNS TABLE (
  pending_count BIGINT,
  merged_count BIGINT,
  not_duplicate_count BIGINT,
  ignored_count BIGINT,
  total_detected BIGINT,
  avg_similarity_score NUMERIC,
  highest_similarity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'merged')::BIGINT as merged_count,
    COUNT(*) FILTER (WHERE status = 'not_duplicate')::BIGINT as not_duplicate_count,
    COUNT(*) FILTER (WHERE status = 'ignored')::BIGINT as ignored_count,
    COUNT(*)::BIGINT as total_detected,
    COALESCE(AVG(similarity_score), 0) as avg_similarity_score,
    COALESCE(MAX(similarity_score), 0) as highest_similarity
  FROM duplicate_candidates
  WHERE workspace_id = p_workspace_id
    AND (p_entity_type IS NULL OR entity_type = p_entity_type);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE enrichment_cache IS 'F001: Caches enrichment results from external providers (Apollo, Clearbit) to reduce API calls and costs';
COMMENT ON TABLE duplicate_candidates IS 'F001: Stores detected duplicate account/contact pairs with similarity scores for review and merging';
COMMENT ON FUNCTION cleanup_expired_cache() IS 'Removes expired cache entries, returns count of deleted rows';
COMMENT ON FUNCTION get_cache_stats(UUID, VARCHAR) IS 'Returns cache statistics for a workspace and optional provider';
COMMENT ON FUNCTION get_duplicate_stats(UUID, VARCHAR) IS 'Returns duplicate detection statistics for a workspace and optional entity type';
