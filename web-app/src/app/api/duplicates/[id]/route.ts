/**
 * Single Duplicate Candidate API
 * GET /api/duplicates/[id] - Get a single duplicate candidate with full entity data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
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

    if (!duplicateId) {
      return NextResponse.json(
        { error: 'Duplicate ID is required' },
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

    // Fetch the actual entities based on entity_type
    let entity1 = null;
    let entity2 = null;

    if (duplicate.entity_type === 'account') {
      // Fetch accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .in('id', [duplicate.entity_id_1, duplicate.entity_id_2]);

      if (accounts) {
        entity1 = accounts.find((a) => a.id === duplicate.entity_id_1);
        entity2 = accounts.find((a) => a.id === duplicate.entity_id_2);
      }
    } else if (duplicate.entity_type === 'contact') {
      // Fetch contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*, accounts(id, name, domain)')
        .in('id', [duplicate.entity_id_1, duplicate.entity_id_2]);

      if (contacts) {
        entity1 = contacts.find((c) => c.id === duplicate.entity_id_1);
        entity2 = contacts.find((c) => c.id === duplicate.entity_id_2);
      }
    }

    return NextResponse.json({
      duplicate,
      entity1,
      entity2,
    });
  } catch (error) {
    console.error('Error fetching duplicate candidate:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch duplicate candidate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
