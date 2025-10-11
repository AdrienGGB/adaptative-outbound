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
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onInviteSent?: () => void
}

export function InviteMembers({ open: controlledOpen, onOpenChange, onInviteSent }: InviteMembersProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Determine if component is in controlled mode
  const isControlled = onOpenChange !== undefined

  // Use controlled state if provided, otherwise use internal state
  const open = isControlled ? (controlledOpen ?? false) : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen
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
      // Check if email is already invited (pending status only)
      const { data: existingInvite } = await supabase
        .from('workspace_invitations')
        .select('id, status')
        .eq('workspace_id', workspace.id)
        .eq('email', data.email)
        .eq('status', 'pending')
        .maybeSingle()

      if (existingInvite) {
        setError('This email has already been invited and is pending acceptance.')
        setLoading(false)
        return
      }

      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id, profiles!inner(email)')
        .eq('workspace_id', workspace.id)
        .eq('profiles.email', data.email)
        .maybeSingle()

      if (existingMember) {
        setError('This email is already a member of this workspace.')
        setLoading(false)
        return
      }

      // Generate invitation token
      const token = nanoid(32)

      // Create invitation with expiration (7 days)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      // DETAILED LOGGING: Log what we're about to insert
      console.log('=== INSERTION DEBUG INFO ===')
      console.log('User ID:', user.id)
      console.log('Workspace ID:', workspace.id)
      console.log('User role in workspace:', workspace.role)
      console.log('Attempting to insert:', {
        workspace_id: workspace.id,
        email: data.email,
        role: data.role,
        token: token.substring(0, 8) + '...',
        invited_by: user.id,
        expires_at: expiresAt,
      })

      // Test the RLS function first
      console.log('\n=== TESTING RLS FUNCTION ===')
      const { data: membershipData, error: membershipError } = await supabase
        .rpc('get_user_workspace_memberships', { p_user_id: user.id })

      if (membershipError) {
        console.error('RLS function error:', {
          code: membershipError.code,
          message: membershipError.message,
          details: membershipError.details,
          hint: membershipError.hint,
        })
      } else {
        console.log('RLS function result:', membershipData)
        const isAdmin = membershipData?.some(
          (m: any) => m.workspace_id === workspace.id && m.role === 'admin'
        )
        console.log('Is user admin?', isAdmin)
      }

      // Insert invitation
      console.log('\n=== ATTEMPTING INSERT ===')
      const { data: insertedInvitation, error: insertError } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspace.id,
          email: data.email,
          role: data.role,
          token,
          invited_by: user.id,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (insertError) {
        console.error('=== SUPABASE INSERT ERROR (DETAILED) ===')
        console.error('Error object type:', Object.prototype.toString.call(insertError))
        console.error('Error constructor:', insertError.constructor?.name)
        console.error('\nDirect properties:')
        console.error('  - code:', insertError.code)
        console.error('  - message:', insertError.message)
        console.error('  - details:', insertError.details)
        console.error('  - hint:', insertError.hint)
        console.error('\nAll enumerable keys:', Object.keys(insertError))
        console.error('\nAll own properties:', Object.getOwnPropertyNames(insertError))
        console.error('\nJSON.stringify:', JSON.stringify(insertError, null, 2))
        console.error('\nError toString():', insertError.toString())
        console.error('\nRaw error object:', insertError)
        console.error('\nError stack:', insertError.stack)

        // Try to extract any nested error info
        if (typeof insertError === 'object' && insertError !== null) {
          for (const [key, value] of Object.entries(insertError)) {
            console.error(`  Property "${key}":`, typeof value, value)
          }
        }

        throw new Error(insertError.message || 'Failed to create invitation')
      }

      console.log('=== INSERT SUCCESS ===')
      console.log('Inserted invitation:', insertedInvitation)

      // Generate invitation link
      const link = `${window.location.origin}/invitations/${token}`
      setInvitationLink(link)

      toast.success(`Invitation created for ${data.email}`)
      onInviteSent?.()
    } catch (err) {
      console.error('=== CATCH BLOCK ERROR ===')
      console.error('Error type:', Object.prototype.toString.call(err))
      console.error('Error constructor:', err instanceof Error ? err.constructor.name : 'Not an Error')
      console.error('Error message:', err instanceof Error ? err.message : String(err))
      console.error('Error name:', err instanceof Error ? err.name : 'N/A')
      console.error('Error stack:', err instanceof Error ? err.stack : 'N/A')
      console.error('Raw error:', err)

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

  const handleDialogOpenChange = (newOpen: boolean) => {
    console.log('Dialog open change:', newOpen, 'isControlled:', isControlled)
    if (newOpen) {
      setOpen(true)
    } else {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </DialogTrigger>
      )}
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
