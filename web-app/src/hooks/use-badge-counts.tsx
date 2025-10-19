'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'

interface BadgeCounts {
  accounts: number
  contacts: number
  activities: number
  tasks: number
}

// Simple badge counts hook - will fetch counts from services later
export function useBadgeCounts() {
  const { workspace } = useAuth()
  const [counts, setCounts] = useState<BadgeCounts>({
    accounts: 0,
    contacts: 0,
    activities: 0,
    tasks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspace) return

    // TODO: Implement actual counts fetching using services
    // For now, return zeros to not block UI development
    const fetchCounts = async () => {
      try {
        // Placeholder - will implement with actual service calls
        setCounts({
          accounts: 0,
          contacts: 0,
          activities: 0,
          tasks: 0
        })
      } catch (error) {
        console.error('Failed to fetch badge counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [workspace])

  return { counts, loading }
}
