'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Chrome } from 'lucide-react'

export function OAuthButtons() {
  const [loading, setLoading] = useState<'google' | 'microsoft' | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading('google')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setLoading(null)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setLoading('microsoft')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Microsoft:', error)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full"
        disabled={loading !== null}
      >
        <Chrome className="mr-2 h-4 w-4" />
        {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
      </Button>
      <Button
        onClick={handleMicrosoftSignIn}
        variant="outline"
        className="w-full"
        disabled={loading !== null}
      >
        <svg
          className="mr-2 h-4 w-4"
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        {loading === 'microsoft' ? 'Connecting...' : 'Continue with Microsoft'}
      </Button>
    </div>
  )
}
