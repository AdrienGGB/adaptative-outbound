/**
 * Enrichment Cache Management API
 * DELETE /api/enrichment/cache/[id]
 *
 * Clear a specific cache entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearCacheEntry } from '@/services/enrichment-cache';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheId = params.id;

    if (!cacheId) {
      return NextResponse.json(
        { error: 'Cache ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this cache entry (through workspace membership)
    const { data: cacheEntry } = await supabase
      .from('enrichment_cache')
      .select('workspace_id')
      .eq('id', cacheId)
      .single();

    if (!cacheEntry) {
      return NextResponse.json({ error: 'Cache entry not found' }, { status: 404 });
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', cacheEntry.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Clear cache entry
    const success = await clearCacheEntry(cacheId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to clear cache entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cache entry cleared successfully',
      cache_id: cacheId,
    });
  } catch (error) {
    console.error('Error clearing cache entry:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
