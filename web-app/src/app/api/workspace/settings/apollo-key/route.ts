import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to encrypt API key (basic implementation - should use proper encryption in production)
function encryptApiKey(apiKey: string): string {
  // In production, use proper encryption like AWS KMS, Vault, or at minimum crypto.cipher
  // For now, we'll just base64 encode (NOT SECURE FOR PRODUCTION)
  return Buffer.from(apiKey).toString('base64')
}

export async function POST(request: NextRequest) {
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
    const { api_key } = body

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json(
        { error: 'api_key is required' },
        { status: 400 }
      )
    }

    // Get workspace_id from query params or body
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id') || body.workspace_id

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(api_key)

    // Update settings
    const { data, error } = await supabase
      .from('workspace_settings')
      .update({
        apollo_api_key_encrypted: encryptedKey,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      console.error('Error saving API key:', error)
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apollo_api_key_configured: true,
    })
  } catch (error) {
    console.error('Error in POST /api/workspace/settings/apollo-key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Remove API key
    const { error } = await supabase
      .from('workspace_settings')
      .update({
        apollo_api_key_encrypted: null,
        apollo_auto_enrich: false, // Also disable auto-enrich
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error removing API key:', error)
      return NextResponse.json(
        { error: 'Failed to remove API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      apollo_api_key_configured: false,
    })
  } catch (error) {
    console.error('Error in DELETE /api/workspace/settings/apollo-key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
