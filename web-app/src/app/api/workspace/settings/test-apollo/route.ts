import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to decrypt API key (matches encryption in apollo-key route)
function decryptApiKey(encryptedKey: string): string {
  // In production, use proper decryption
  // For now, we're just base64 decoding
  return Buffer.from(encryptedKey, 'base64').toString('utf-8')
}

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

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('workspace_settings')
      .select('apollo_api_key_encrypted')
      .eq('workspace_id', workspaceId)
      .single()

    if (settingsError || !settings?.apollo_api_key_encrypted) {
      return NextResponse.json({
        success: false,
        error_message: 'No Apollo API key configured',
      })
    }

    // Decrypt API key
    const apiKey = decryptApiKey(settings.apollo_api_key_encrypted)

    // Test connection to Apollo.io API
    // Using their credits endpoint to verify the key and get remaining credits
    const apolloResponse = await fetch('https://api.apollo.io/v1/auth/health', {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text()
      console.error('Apollo API error:', errorText)
      return NextResponse.json({
        success: false,
        error_message: `Apollo API error: ${apolloResponse.status} ${apolloResponse.statusText}`,
      })
    }

    const apolloData = await apolloResponse.json()

    // Try to get credit information
    let creditsRemaining: number | undefined

    try {
      const creditsResponse = await fetch('https://api.apollo.io/v1/credits', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        creditsRemaining = creditsData.credits_remaining || creditsData.remaining_credits
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err)
      // Don't fail the test if we can't get credits
    }

    return NextResponse.json({
      success: true,
      credits_remaining: creditsRemaining,
    })
  } catch (error) {
    console.error('Error in GET /api/workspace/settings/test-apollo:', error)
    return NextResponse.json({
      success: false,
      error_message: 'Failed to test connection',
    })
  }
}
