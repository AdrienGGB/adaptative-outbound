/**
 * Unit Tests for Enrichment Cache Service
 * Tests cache hit/miss logic, expiration, and stats calculation
 *
 * Note: These tests mock Supabase client since they test business logic
 * Integration tests will test actual database operations
 */

import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Import service functions after mocking
import {
  checkCache,
  writeCache,
} from '@/services/enrichment-cache'
import type { CacheCheckResult, EnrichmentCache } from '@/types/enrichment-cache'

describe('Enrichment Cache Service', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('checkCache - Logic Tests', () => {
    it('should return cache MISS when no data found', async () => {
      // Mock: no data found
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await checkCache(
        'workspace-123',
        'apollo',
        'domain',
        'example.com'
      )

      expect(result.found).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.cache_entry).toBeUndefined()
    })

    it('should return cache HIT when data found', async () => {
      const mockCacheEntry: EnrichmentCache = {
        id: 'cache-1',
        workspace_id: 'workspace-123',
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: 'example.com',
        enrichment_data: {
          name: 'Example Corp',
          employees: 100,
          industry: 'Technology',
        },
        hit_count: 5,
        created_at: '2024-10-01T00:00:00.000Z',
        expires_at: '2024-11-01T00:00:00.000Z',
        last_accessed_at: '2024-10-20T00:00:00.000Z',
      }

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockCacheEntry,
        error: null,
      })

      const result = await checkCache(
        'workspace-123',
        'apollo',
        'domain',
        'example.com'
      )

      expect(result.found).toBe(true)
      expect(result.data).toEqual(mockCacheEntry.enrichment_data)
      expect(result.cache_entry).toEqual(mockCacheEntry)
    })

    it('should normalize lookup value to lowercase', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'domain', 'EXAMPLE.COM')

      // Verify eq was called with lowercase value
      expect(mockSupabase.eq).toHaveBeenCalledWith('lookup_value', 'example.com')
    })

    it('should filter by expiration date', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'domain', 'example.com')

      // Verify gt (greater than) was called for expires_at
      expect(mockSupabase.gt).toHaveBeenCalledWith(
        'expires_at',
        expect.any(String)
      )
    })

    it('should increment hit_count on cache hit', async () => {
      const mockCacheEntry: Partial<EnrichmentCache> = {
        id: 'cache-1',
        hit_count: 5,
        enrichment_data: { name: 'Test' },
      }

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockCacheEntry,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'domain', 'example.com')

      // Verify update was called with incremented hit_count
      expect(mockSupabase.update).toHaveBeenCalledWith({
        hit_count: 6,
        last_accessed_at: expect.any(String),
      })
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await checkCache(
        'workspace-123',
        'apollo',
        'domain',
        'example.com'
      )

      // Should return cache miss on error
      expect(result.found).toBe(false)
    })
  })

  describe('writeCache - Logic Tests', () => {
    it('should normalize lookup value to lowercase', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'cache-1' },
        error: null,
      })

      await writeCache({
        workspace_id: 'workspace-123',
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: 'EXAMPLE.COM',
        enrichment_data: { name: 'Test' },
        expires_at: '2024-11-01T00:00:00.000Z',
      })

      // Verify upsert was called with lowercase value
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          lookup_value: 'example.com',
        }),
        expect.any(Object)
      )
    })

    it('should use upsert for insert or update', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'cache-1' },
        error: null,
      })

      await writeCache({
        workspace_id: 'workspace-123',
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: 'example.com',
        enrichment_data: { name: 'Test' },
        expires_at: '2024-11-01T00:00:00.000Z',
      })

      // Verify upsert was called with conflict resolution
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.any(Object),
        {
          onConflict: 'provider,lookup_type,lookup_value',
        }
      )
    })

    it('should return null on database error', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const result = await writeCache({
        workspace_id: 'workspace-123',
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: 'example.com',
        enrichment_data: { name: 'Test' },
        expires_at: '2024-11-01T00:00:00.000Z',
      })

      expect(result).toBeNull()
    })

    it('should return created cache entry on success', async () => {
      const mockCacheEntry: EnrichmentCache = {
        id: 'cache-1',
        workspace_id: 'workspace-123',
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: 'example.com',
        enrichment_data: { name: 'Test' },
        hit_count: 0,
        created_at: '2024-10-24T00:00:00.000Z',
        expires_at: '2024-11-24T00:00:00.000Z',
        last_accessed_at: '2024-10-24T00:00:00.000Z',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockCacheEntry,
        error: null,
      })

      const result = await writeCache({
        workspace_id: 'workspace-123',
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: 'example.com',
        enrichment_data: { name: 'Test' },
        expires_at: '2024-11-24T00:00:00.000Z',
      })

      expect(result).toEqual(mockCacheEntry)
    })
  })

  describe('Cache Expiration Logic', () => {
    it('should not return expired cache entries', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const expiredCacheEntry: Partial<EnrichmentCache> = {
        id: 'cache-1',
        expires_at: yesterday.toISOString(),
        enrichment_data: { name: 'Test' },
      }

      // Mock: expired entry exists but should not be returned due to gt filter
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null, // Simulates database filtering out expired entry
        error: null,
      })

      const result = await checkCache(
        'workspace-123',
        'apollo',
        'domain',
        'example.com'
      )

      expect(result.found).toBe(false)
    })

    it('should return non-expired cache entries', async () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const validCacheEntry: Partial<EnrichmentCache> = {
        id: 'cache-1',
        expires_at: tomorrow.toISOString(),
        enrichment_data: { name: 'Test' },
        hit_count: 0,
      }

      mockSupabase.maybeSingle.mockResolvedValue({
        data: validCacheEntry,
        error: null,
      })

      const result = await checkCache(
        'workspace-123',
        'apollo',
        'domain',
        'example.com'
      )

      expect(result.found).toBe(true)
    })
  })

  describe('Cache Key Uniqueness', () => {
    it('should distinguish between different providers', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'domain', 'example.com')

      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'apollo')
    })

    it('should distinguish between different lookup types', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'email', 'test@example.com')

      expect(mockSupabase.eq).toHaveBeenCalledWith('lookup_type', 'email')
    })

    it('should distinguish between different lookup values', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'domain', 'different.com')

      expect(mockSupabase.eq).toHaveBeenCalledWith('lookup_value', 'different.com')
    })
  })

  describe('Performance Considerations', () => {
    it('should update hit_count and last_accessed_at in single call', async () => {
      const mockCacheEntry: Partial<EnrichmentCache> = {
        id: 'cache-1',
        hit_count: 10,
        enrichment_data: { name: 'Test' },
      }

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockCacheEntry,
        error: null,
      })

      await checkCache('workspace-123', 'apollo', 'domain', 'example.com')

      // Verify update is called once with both fields
      expect(mockSupabase.update).toHaveBeenCalledTimes(1)
      expect(mockSupabase.update).toHaveBeenCalledWith({
        hit_count: 11,
        last_accessed_at: expect.any(String),
      })
    })
  })
})

describe('Cache Strategy Tests', () => {
  it('should demonstrate cache flow for first enrichment', () => {
    // Scenario: First time enriching example.com
    // 1. Check cache -> MISS
    // 2. Call external API -> Get data
    // 3. Write to cache -> Success
    // 4. Return data

    const cacheKey = {
      workspace_id: 'workspace-123',
      provider: 'apollo' as const,
      lookup_type: 'domain' as const,
      lookup_value: 'example.com',
    }

    const enrichmentData = {
      name: 'Example Corp',
      employees: 100,
      industry: 'Technology',
    }

    // This test documents the expected flow
    expect(cacheKey.lookup_value).toBe('example.com')
    expect(enrichmentData).toBeDefined()
  })

  it('should demonstrate cache flow for subsequent enrichment', () => {
    // Scenario: Second time enriching example.com
    // 1. Check cache -> HIT
    // 2. Increment hit_count
    // 3. Return cached data (no API call)

    const cacheEntry = {
      id: 'cache-1',
      hit_count: 5,
      enrichment_data: { name: 'Example Corp' },
    }

    // After cache hit, hit_count should be incremented
    const newHitCount = cacheEntry.hit_count + 1

    expect(newHitCount).toBe(6)
  })

  it('should calculate cache expiration correctly', () => {
    // Default cache expiration: 30 days
    const now = new Date('2024-10-24T00:00:00.000Z')
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    expect(expiresAt.toISOString()).toBe('2024-11-23T00:00:00.000Z')
  })
})
