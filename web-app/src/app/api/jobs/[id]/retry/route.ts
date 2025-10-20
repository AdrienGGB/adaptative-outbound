import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current job to verify it can be retried
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Only allow retry for failed jobs
    if (job.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      )
    }

    // Reset job to pending state
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status: 'pending',
        attempts: 0,
        error_message: null,
        error_stack: null,
        next_retry_at: null,
        failed_at: null,
        started_at: null,
        completed_at: null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error retrying job:', error)
      return NextResponse.json(
        { error: 'Failed to retry job' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/retry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
