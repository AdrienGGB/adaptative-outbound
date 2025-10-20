'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/layout/app-shell'
import { MembersTable } from '@/components/workspace/members-table'
import { InviteMembers } from '@/components/workspace/invite-members'
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
    const { data } = await supabase
      .from('workspace_members')
      .select('*, profiles(id, first_name, last_name, email, avatar_url, status, created_at, updated_at)')
      .eq('workspace_id', workspace.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (data) {
      // Transform the data: Supabase returns 'profiles' (plural) but our type expects 'profile' (singular)
      const transformedMembers = data.map((member: any) => ({
        ...member,
        profile: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
      })) as MemberWithProfile[]

      setMembers(transformedMembers)
    }
    setLoadingMembers(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [workspace])

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!workspace || !user) {
    router.push('/workspace')
    return null
  }

  return (
    <AppShell
      actions={role === 'admin' ? <InviteMembers onInviteSent={fetchMembers} /> : undefined}
    >
      <div className="container mx-auto px-4 py-8">

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
      </div>
    </AppShell>
  )
}
