/**
 * Duplicate Candidates API
 * GET /api/duplicates - List duplicate candidates with filtering
 *
 * Query params:
 * - workspace_id (required)
 * - entity_type (optional): 'account' | 'contact'
 * - status (optional): 'pending' | 'merged' | 'not_duplicate' | 'ignored'
 * - min_score (optional): minimum similarity score
 * - limit (optional): page size
 * - offset (optional): pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDuplicateCandidates } from '@/services/duplicate-detection';
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
    const status = searchParams.get('status');
    const minScore = searchParams.get('min_score');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

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

    // Get duplicate candidates
    const result = await getDuplicateCandidates(workspaceId, {
      entityType: entityType || undefined,
      status: status || undefined,
      minScore: minScore ? parseFloat(minScore) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    return NextResponse.json({
      duplicates: result.candidates,
      total: result.total,
      workspace_id: workspaceId,
      filters: {
        entity_type: entityType,
        status,
        min_score: minScore ? parseFloat(minScore) : null,
      },
      pagination: {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching duplicates:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch duplicates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
