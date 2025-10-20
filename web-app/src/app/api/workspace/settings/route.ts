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

    // Get workspace_id from query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Get settings (RLS will enforce workspace access)
    let { data, error } = await supabase
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single()

    // If settings don't exist, create them
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('workspace_settings')
        .insert({
          workspace_id: workspaceId,
          apollo_auto_enrich: false,
          enrichment_credits_used: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating workspace settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        )
      }

      data = newSettings
    } else if (error) {
      console.error('Error fetching workspace settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Transform for frontend (don't send actual API key)
    const response = {
      ...data,
      apollo_api_key_configured: !!data.apollo_api_key_encrypted,
      apollo_api_key_encrypted: undefined, // Remove encrypted key from response
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/workspace/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { workspace_id, apollo_auto_enrich } = body

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Update settings
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (apollo_auto_enrich !== undefined) {
      updates.apollo_auto_enrich = apollo_auto_enrich
    }

    const { data, error } = await supabase
      .from('workspace_settings')
      .update(updates)
      .eq('workspace_id', workspace_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating workspace settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Transform for frontend
    const response = {
      ...data,
      apollo_api_key_configured: !!data.apollo_api_key_encrypted,
      apollo_api_key_encrypted: undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PATCH /api/workspace/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
