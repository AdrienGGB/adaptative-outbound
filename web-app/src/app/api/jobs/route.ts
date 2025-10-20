// F044: Jobs API - List and Create Jobs
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user and workspace
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Parse filters from query params
    const status = request.nextUrl.searchParams.get('status');
    const jobType = request.nextUrl.searchParams.get('job_type');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (status) query = query.eq('status', status);
    if (jobType) query = query.eq('job_type', jobType);

    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      jobs: data ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, job_type, payload, priority, scheduled_for, job_queue } = body;

    if (!workspace_id || !job_type || !payload) {
      return NextResponse.json(
        { error: 'workspace_id, job_type, and payload are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        workspace_id,
        job_type,
        payload,
        priority: priority ?? 0,
        scheduled_for,
        job_queue: job_queue ?? 'default',
        status: 'pending',
        attempts: 0,
        max_attempts: 5,
        progress: {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
