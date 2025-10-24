/**
 * Duplicate Merge API
 * POST /api/duplicates/[id]/merge - Merge two duplicate entities
 *
 * Body:
 * - keep_id: UUID of entity to keep
 * - merge_id: UUID of entity to merge (will be deleted)
 * - merged_data: Final data after field selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const { keep_id, merge_id, merged_data } = body as {
      keep_id: string;
      merge_id: string;
      merged_data: Record<string, any>;
    };

    if (!keep_id || !merge_id || !merged_data) {
      return NextResponse.json(
        { error: 'keep_id, merge_id, and merged_data are required' },
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
      .select('workspace_id, role')
      .eq('workspace_id', duplicate.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify keep_id and merge_id match the duplicate candidate
    if (
      !(
        (keep_id === duplicate.entity_id_1 && merge_id === duplicate.entity_id_2) ||
        (keep_id === duplicate.entity_id_2 && merge_id === duplicate.entity_id_1)
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid keep_id or merge_id for this duplicate candidate' },
        { status: 400 }
      );
    }

    // Perform merge based on entity type
    if (duplicate.entity_type === 'account') {
      // Update the account to keep with merged data
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          ...merged_data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', keep_id);

      if (updateError) {
        throw new Error(`Failed to update account: ${updateError.message}`);
      }

      // Update related contacts to point to the kept account
      await supabase
        .from('contacts')
        .update({ account_id: keep_id })
        .eq('account_id', merge_id);

      // Update related activities
      await supabase
        .from('activities')
        .update({ account_id: keep_id })
        .eq('account_id', merge_id);

      // Delete the merged account
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', merge_id);

      if (deleteError) {
        throw new Error(`Failed to delete merged account: ${deleteError.message}`);
      }
    } else if (duplicate.entity_type === 'contact') {
      // Update the contact to keep with merged data
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          ...merged_data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', keep_id);

      if (updateError) {
        throw new Error(`Failed to update contact: ${updateError.message}`);
      }

      // Update related activities
      await supabase
        .from('activities')
        .update({ contact_id: keep_id })
        .eq('contact_id', merge_id);

      // Delete the merged contact
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', merge_id);

      if (deleteError) {
        throw new Error(`Failed to delete merged contact: ${deleteError.message}`);
      }
    }

    // Update duplicate candidate status
    const { error: statusError } = await supabase
      .from('duplicate_candidates')
      .update({
        status: 'merged',
        merged_into: keep_id,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', duplicateId);

    if (statusError) {
      console.error('Failed to update duplicate status:', statusError);
      // Don't throw - merge was successful even if status update failed
    }

    return NextResponse.json({
      success: true,
      message: 'Entities merged successfully',
      kept_id: keep_id,
      merged_id: merge_id,
      entity_type: duplicate.entity_type,
    });
  } catch (error) {
    console.error('Error merging duplicates:', error);
    return NextResponse.json(
      {
        error: 'Failed to merge duplicates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
