import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id and days from query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    const daysBack = parseInt(searchParams.get('days') || '30', 10)

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Query jobs for enrichment operations
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('job_type, created_at, payload')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .in('job_type', ['enrich_account', 'enrich_contact', 'bulk_enrich'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (jobsError) {
      console.error('Error fetching enrichment jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      )
    }

    // Aggregate usage by day
    const dailyUsage: Record<
      string,
      { credits: number; accounts: number; contacts: number }
    > = {}

    // Initialize all days with 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      dailyUsage[dateStr] = { credits: 0, accounts: 0, contacts: 0 }
    }

    // Count from jobs
    let totalCredits = 0
    let accountsEnriched = 0
    let contactsEnriched = 0

    jobs?.forEach((job) => {
      const dateStr = job.created_at.split('T')[0]
      if (!dailyUsage[dateStr]) {
        dailyUsage[dateStr] = { credits: 0, accounts: 0, contacts: 0 }
      }

      // Estimate credits (1 credit per enrichment)
      const credits = 1
      dailyUsage[dateStr].credits += credits
      totalCredits += credits

      if (job.job_type === 'enrich_account') {
        dailyUsage[dateStr].accounts += 1
        accountsEnriched += 1
      } else if (job.job_type === 'enrich_contact') {
        dailyUsage[dateStr].contacts += 1
        contactsEnriched += 1
      } else if (job.job_type === 'bulk_enrich') {
        // Count from payload
        const count = job.payload?.count || 1
        const type = job.payload?.type || 'account'
        dailyUsage[dateStr][type === 'account' ? 'accounts' : 'contacts'] += count
        if (type === 'account') accountsEnriched += count
        else contactsEnriched += count
        dailyUsage[dateStr].credits += count - 1 // Already added 1 above
        totalCredits += count - 1
      }
    })

    // Convert to array
    const last30Days = Object.entries(dailyUsage)
      .map(([date, data]) => ({
        date,
        credits: data.credits,
        accounts: data.accounts,
        contacts: data.contacts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const dailyAverage = Math.round(totalCredits / daysBack)

    return NextResponse.json({
      credits_used: totalCredits,
      accounts_enriched: accountsEnriched,
      contacts_enriched: contactsEnriched,
      daily_average: dailyAverage,
      last_30_days: last30Days,
    })
  } catch (error) {
    console.error('Error in GET /api/workspace/enrichment-usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
