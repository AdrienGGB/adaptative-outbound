/**
 * Duplicate Detection Trigger API
 * POST /api/duplicates/detect - Trigger duplicate detection job
 *
 * Body:
 * - workspace_id (required)
 * - entity_type (optional): 'account' | 'contact' - if omitted, scans both
 * - threshold (optional): similarity threshold (default 80)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DuplicateEntityType } from '@/types/duplicates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { workspace_id, entity_type, threshold } = body as {
      workspace_id: string;
      entity_type?: DuplicateEntityType;
      threshold?: number;
    };

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Determine job type based on entity_type
    let jobType = 'detect_duplicates'; // Default: scan both accounts and contacts
    if (entity_type === 'account') {
      jobType = 'detect_account_duplicates';
    } else if (entity_type === 'contact') {
      jobType = 'detect_contact_duplicates';
    }

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        workspace_id,
        job_type: jobType,
        status: 'pending',
        payload: {
          threshold: threshold || 80,
          triggered_by: user.id,
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating duplicate detection job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create duplicate detection job' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        job_id: job.id,
        job_type: jobType,
        workspace_id,
        entity_type: entity_type || 'all',
        threshold: threshold || 80,
        message: 'Duplicate detection job created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error triggering duplicate detection:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger duplicate detection',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
