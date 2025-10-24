/**
 * Duplicate Resolution API
 * PATCH /api/duplicates/[id]/resolve - Resolve duplicate candidate status
 *
 * Body:
 * - status: 'not_duplicate' | 'ignored'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
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

    const duplicateId = params.id;

    // Parse request body
    const body = await request.json();
    const { status } = body as { status: string };

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    if (!['not_duplicate', 'ignored'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "not_duplicate" or "ignored"' },
        { status: 400 }
      );
    }

    // Get duplicate candidate
    const { data: duplicate, error: duplicateError } = await supabase
      .from('duplicate_candidates')
      .select('*')
      .eq('id', duplicateId)
      .single();

    if (duplicateError || !duplicate) {
      return NextResponse.json(
        { error: 'Duplicate candidate not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', duplicate.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update duplicate candidate status
    const { error: updateError } = await supabase
      .from('duplicate_candidates')
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', duplicateId);

    if (updateError) {
      throw new Error(`Failed to update duplicate status: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Duplicate marked as ${status}`,
      duplicate_id: duplicateId,
      status,
    });
  } catch (error) {
    console.error('Error resolving duplicate:', error);
    return NextResponse.json(
      {
        error: 'Failed to resolve duplicate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
