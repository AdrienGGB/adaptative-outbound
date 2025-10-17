'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Mail, Building2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type InvitationData = {
  id: string
  workspace_id: string
  email: string
  role: 'admin' | 'sales_manager' | 'sdr' | 'ae'
  token: string
  expires_at: string | null
  workspace: {
    id: string
    name: string
  }
  inviter: {
    full_name: string
    email: string
  }
}

type InvitationState =
  | { type: 'loading' }
  | { type: 'not-logged-in'; invitation: InvitationData }
  | { type: 'invalid'; message: string }
  | { type: 'already-member'; workspace: { id: string; name: string } }
  | { type: 'ready'; invitation: InvitationData }
  | { type: 'accepting' }

export default function InvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { user, refreshWorkspace } = useAuth()
  const [state, setState] = useState<InvitationState>({ type: 'loading' })
  const supabase = createClientRaw()

  const loadInvitation = useCallback(async () => {
    try {
      setState({ type: 'loading' })

      // 1. Fetch invitation by token
      const { data: invitation, error: inviteError } = await supabase
        .from('workspace_invitations')
        .select(`
          id,
          workspace_id,
          email,
          role,
          token,
          expires_at,
          workspace:workspaces!workspace_invitations_workspace_id_fkey(id, name),
          inviter:profiles!workspace_invitations_invited_by_fkey(full_name, email)
        `)
        .eq('token', params.token)
        .single() as { data: InvitationData | null; error: any }

      if (inviteError || !invitation) {
        setState({
          type: 'invalid',
          message: 'This invitation link is invalid or has been revoked.'
        })
        return
      }

      // 2. Check if invitation has expired
      if (invitation.expires_at) {
        const expiresAt = new Date(invitation.expires_at)
        if (expiresAt < new Date()) {
          setState({
            type: 'invalid',
            message: 'This invitation has expired.'
          })
          return
        }
      }

      // 3. If user not logged in, show login prompt
      if (!user) {
        setState({
          type: 'not-logged-in',
          invitation: invitation as unknown as InvitationData
        })
        return
      }

      // 4. Check if user is already a member of this workspace
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(id, name)')
        .eq('workspace_id', invitation.workspace_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single() as { data: { workspace_id: string; workspaces: { id: string; name: string } } | null; error: any }

      if (existingMember) {
        setState({
          type: 'already-member',
          workspace: existingMember.workspaces
        })
        return
      }

      // 5. Ready to accept
      setState({
        type: 'ready',
        invitation: invitation as unknown as InvitationData
      })

    } catch (error) {
      console.error('Error loading invitation:', error)
      setState({
        type: 'invalid',
        message: 'An error occurred while loading the invitation.'
      })
    }
  }, [params.token, user, supabase])

  useEffect(() => {
    loadInvitation()
  }, [loadInvitation])

  const acceptInvitation = async () => {
    if (state.type !== 'ready' || !user) return

    setState({ type: 'accepting' })

    try {
      const invitation = state.invitation

      // 1. Add user to workspace_members
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: invitation.role,
          status: 'active'
        } as any)

      if (memberError) throw memberError

      // 2. Delete the invitation
      const { error: deleteError } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitation.id) as any

      if (deleteError) throw deleteError

      // 3. Refresh workspace context
      await refreshWorkspace()

      toast.success(`You've joined ${invitation.workspace.name}!`)

      // 4. Redirect to the workspace
      router.push('/workspace')

    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('Failed to accept invitation. Please try again.')
      setState({ type: 'ready', invitation: state.invitation })
    }
  }

  const declineInvitation = async () => {
    if (state.type !== 'ready') return

    try {
      const invitation = state.invitation

      // Delete the invitation
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitation.id)

      if (error) throw error

      toast.success('Invitation declined')
      router.push('/workspace')

    } catch (error) {
      console.error('Error declining invitation:', error)
      toast.error('Failed to decline invitation')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 text-white'
      case 'sales_manager':
        return 'bg-blue-500 text-white'
      case 'sdr':
        return 'bg-green-500 text-white'
      case 'ae':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getRoleLabel = (role: string) => {
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
        return role
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {state.type === 'loading' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Loading Invitation...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </CardContent>
          </Card>
        )}

        {/* Invalid State */}
        {state.type === 'invalid' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-center">Invalid Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/workspace">Go to Workspace</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Not Logged In State */}
        {state.type === 'not-logged-in' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-center">You&apos;ve Been Invited!</CardTitle>
              <CardDescription className="text-center">
                Sign in or create an account to accept this invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Workspace</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {state.invitation.workspace.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserCircle className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Invited by</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {state.invitation.inviter.full_name || state.invitation.inviter.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(state.invitation.role)}>
                    {getRoleLabel(state.invitation.role)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/login?redirectTo=/invitations/${params.token}`}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/signup?redirectTo=/invitations/${params.token}`}>
                    Create Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already Member State */}
        {state.type === 'already-member' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-center">Already a Member</CardTitle>
              <CardDescription className="text-center">
                You&apos;re already part of this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/workspace">Go to Workspace</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ready to Accept State */}
        {state.type === 'ready' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-center">You&apos;ve Been Invited!</CardTitle>
              <CardDescription className="text-center">
                Accept this invitation to join the workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Workspace</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {state.invitation.workspace.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserCircle className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Invited by</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {state.invitation.inviter.full_name || state.invitation.inviter.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(state.invitation.role)}>
                    {getRoleLabel(state.invitation.role)}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You&apos;ll join as {getRoleLabel(state.invitation.role)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={acceptInvitation} className="w-full">
                  Accept Invitation
                </Button>
                <Button
                  onClick={declineInvitation}
                  variant="outline"
                  className="w-full"
                >
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accepting State */}
        {state.type === 'accepting' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Accepting Invitation...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
