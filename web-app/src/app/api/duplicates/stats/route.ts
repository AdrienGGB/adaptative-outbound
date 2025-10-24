/**
 * Duplicate Statistics API
 * GET /api/duplicates/stats - Get duplicate detection statistics
 *
 * Query params:
 * - workspace_id (required)
 * - entity_type (optional): 'account' | 'contact'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDuplicateStats } from '@/services/duplicate-detection';
import type { DuplicateEntityType } from '@/types/duplicates';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    const entityType = searchParams.get('entity_type') as DuplicateEntityType | null;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get duplicate stats
    const stats = await getDuplicateStats(workspaceId, entityType || undefined);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to get duplicate stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats,
      workspace_id: workspaceId,
      entity_type: entityType || 'all',
    });
  } catch (error) {
    console.error('Error fetching duplicate stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch duplicate stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
