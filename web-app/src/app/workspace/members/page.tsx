'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import { MembersTable } from '@/components/workspace/members-table'
import { InviteMembers } from '@/components/workspace/invite-members'
import { ArrowLeft, LogOut } from 'lucide-react'
import type { MemberWithProfile } from '@/types/auth'

export default function MembersPage() {
  const { workspace, role, user, loading, signOut } = useAuth()
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchMembers = async () => {
    if (!workspace) return

    setLoadingMembers(true)
    console.log('🔍 Fetching members for workspace:', workspace.id)

    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profiles(id, first_name, last_name, email, avatar_url, status, created_at, updated_at)')
      .eq('workspace_id', workspace.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    console.log('📊 Raw Supabase response:', { data, error })

    if (error) {
      console.error('❌ Error fetching members:', error)
    }

    if (data) {
      console.log('✅ Members data received:', data)
      console.log('📧 First member raw data:', data[0])

      // Transform the data: Supabase returns 'profiles' (plural) but our type expects 'profile' (singular)
      const transformedMembers = data.map((member: any) => ({
        ...member,
        profile: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
      })) as MemberWithProfile[]

      console.log('🔄 Transformed members:', transformedMembers)
      console.log('📧 First transformed member profile:', transformedMembers[0]?.profile)
      console.log('📧 First transformed member email:', transformedMembers[0]?.profile?.email)

      setMembers(transformedMembers)
    }
    setLoadingMembers(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [workspace])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

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
    router.push('/workspace')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Adaptive Outbound</h1>
            <WorkspaceSwitcher />
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/workspace')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspace
            </Button>
            <h2 className="text-3xl font-bold">Team Members</h2>
            <p className="text-muted-foreground">
              Manage your workspace members and roles
            </p>
          </div>
          {role === 'admin' && <InviteMembers onInviteSent={fetchMembers} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'member' : 'members'} in {workspace.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
              </div>
            ) : (
              <MembersTable members={members} onUpdate={fetchMembers} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
