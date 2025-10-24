/**
 * Enrichment Cache Stats API
 * GET /api/enrichment/cache/stats
 *
 * Returns cache statistics for the current workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCacheStats } from '@/services/enrichment-cache';
import type { EnrichmentProvider } from '@/types/enrichment-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user and workspace
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace from query params or use default
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const provider = searchParams.get('provider') as EnrichmentProvider | null;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get cache stats
    const stats = await getCacheStats(workspaceId, provider || undefined);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch cache stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats,
      workspace_id: workspaceId,
      provider: provider || 'all',
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
