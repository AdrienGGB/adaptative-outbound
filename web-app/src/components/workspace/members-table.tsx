'use client'

import { useState } from 'react'
import { createClientRaw } from '@/lib/supabase/client-raw'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import type { MemberWithProfile, UserRole } from '@/types/auth'
import { toast } from 'sonner'

type MembersTableProps = {
  members: MemberWithProfile[]
  onUpdate: () => void
}

export function MembersTable({ members, onUpdate }: MembersTableProps) {
  const { role: currentUserRole, user } = useAuth()
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)
  const supabase = createClientRaw()

  const isAdmin = currentUserRole === 'admin'

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500'
      case 'sales_manager':
        return 'bg-blue-500'
      case 'sdr':
        return 'bg-green-500'
      case 'ae':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
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

  const handleUpdateRole = async (memberId: string, newRole: UserRole) => {
    setUpdatingMember(memberId)
    try {
      // Use type assertion to bypass strict Supabase type checking
      const result: any = await (supabase as any)
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (result.error) throw result.error

      toast.success('Member role updated successfully')
      onUpdate()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update member role')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === user?.id) {
      toast.error('You cannot remove yourself')
      return
    }

    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    setUpdatingMember(memberId)
    try {
      // Use type assertion to bypass strict Supabase type checking
      const result: any = await (supabase as any)
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (result.error) throw result.error

      toast.success('Member removed successfully')
      onUpdate()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    } finally {
      setUpdatingMember(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No members found</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">
              {member.profile.first_name && member.profile.last_name
                ? `${member.profile.first_name} ${member.profile.last_name}`
                : 'N/A'}
            </TableCell>
            <TableCell>{member.user_id}</TableCell>
            <TableCell>
              {isAdmin && member.user_id !== user?.id ? (
                <Select
                  value={member.role}
                  onValueChange={(value) =>
                    handleUpdateRole(member.id, value as UserRole)
                  }
                  disabled={updatingMember === member.id}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="sdr">SDR</SelectItem>
                    <SelectItem value="ae">AE</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`${getRoleBadgeColor(member.role)} text-white`}>
                  {getRoleLabel(member.role)}
                </Badge>
              )}
            </TableCell>
            <TableCell>{formatDate(member.joined_at)}</TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updatingMember === member.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.id, member.user_id)}
                      className="text-red-600"
                      disabled={member.user_id === user?.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
