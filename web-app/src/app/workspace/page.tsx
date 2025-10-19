'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/layout/app-shell'
import { Users, Settings } from 'lucide-react'

export default function WorkspacePage() {
  const { workspace, role, user, loading } = useAuth()
  const [memberCount, setMemberCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!workspace) return

    const fetchMemberCount = async () => {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id)
        .eq('status', 'active')

      setMemberCount(count || 0)
    }

    fetchMemberCount()
  }, [workspace, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!workspace || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Workspace Found</CardTitle>
            <CardDescription>
              You don&apos;t have access to any workspaces yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/workspace/create')} className="w-full">
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'sales_manager':
        return 'Sales Manager'
      case 'sdr':
        return 'SDR'
      case 'ae':
        return 'AE'
      default:
        return 'Member'
    }
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">{workspace.name}</h2>
          <p className="text-muted-foreground">Your role: {getRoleLabel(role)}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{memberCount}</div>
              <p className="text-sm text-muted-foreground">Active members</p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => router.push('/workspace/members')}
              >
                Manage Members
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workspace Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Plan: <span className="font-semibold capitalize">{workspace.plan}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Seats: {memberCount} / {workspace.seats_limit}
              </p>
              {role === 'admin' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/workspace/settings')}
                >
                  Manage Settings
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => router.push('/accounts')}>
                View Accounts
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/contacts')}>
                View Contacts
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/activities')}>
                View Activities
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/tasks')}>
                View Tasks
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/sequences')}>
                View Sequences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
