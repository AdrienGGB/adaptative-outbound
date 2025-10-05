'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { inviteMemberSchema, type InviteMemberFormData } from '@/lib/validations/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, AlertCircle, Copy, CheckCircle2, Mail } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'

type InviteMembersProps = {
  onInviteSent?: () => void
}

export function InviteMembers({ onInviteSent }: InviteMembersProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { workspace, user } = useAuth()
  const supabase = createClientRaw()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: 'sdr',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: InviteMemberFormData) => {
    if (!workspace || !user) return

    setLoading(true)
    setError(null)

    try {
      // Check if email is already invited or is a member
      const { data: existingInvite } = await supabase
        .from('workspace_invitations')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', data.email)
        .single()

      if (existingInvite) {
        setError('This email has already been invited.')
        setLoading(false)
        return
      }

      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id, profiles!inner(email)')
        .eq('workspace_id', workspace.id)
        .eq('profiles.email', data.email)
        .single()

      if (existingMember) {
        setError('This email is already a member of this workspace.')
        setLoading(false)
        return
      }

      // Generate invitation token
      const token = nanoid(32)

      // Create invitation with expiration (7 days)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { error: inviteError } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspace.id,
          email: data.email,
          role: data.role,
          token,
          invited_by: user.id,
          expires_at: expiresAt,
        })

      if (inviteError) throw inviteError

      // Generate invitation link
      const link = `${window.location.origin}/invitations/${token}`
      setInvitationLink(link)

      toast.success(`Invitation created for ${data.email}`)
      onInviteSent?.()
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!invitationLink) return

    try {
      await navigator.clipboard.writeText(invitationLink)
      setCopied(true)
      toast.success('Invitation link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleClose = () => {
    setOpen(false)
    setInvitationLink(null)
    setError(null)
    setCopied(false)
    reset()
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to workspace settings and members'
      case 'sales_manager':
        return 'Manage sales team and sequences'
      case 'sdr':
        return 'Execute sequences and manage accounts'
      case 'ae':
        return 'Manage accounts and close deals'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your workspace
          </DialogDescription>
        </DialogHeader>

        {!invitationLink ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setValue('role', value as 'admin' | 'sales_manager' | 'sdr' | 'ae')
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="sdr">SDR</SelectItem>
                  <SelectItem value="ae">AE</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(selectedRole)}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invitation'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Invitation created successfully! Share this link with the team member.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This link will expire in 7 days
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Next Steps</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Copy the link and send it to the team member</li>
                    <li>• They can sign up or sign in to accept the invitation</li>
                    <li>• They&apos;ll automatically join your workspace</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
