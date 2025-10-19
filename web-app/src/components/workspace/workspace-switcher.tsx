'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/auth-context'
import type { WorkspaceWithRole } from '@/types/auth'

export function WorkspaceSwitcher() {
  const { workspace, role, switchWorkspace, user } = useAuth()
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientRaw()

  useEffect(() => {
    if (!user) return

    const fetchWorkspaces = async () => {
      // Use RPC function to bypass RLS circular dependency
      const { data, error } = await supabase
        .rpc('get_user_workspace_memberships', { p_user_id: user.id } as any) as any

      if (error) {
        console.error('Error fetching workspaces:', error)
      }

      if (data) {
        const workspacesWithRole: WorkspaceWithRole[] = data.map((item: any) => ({
          id: item.workspace_id,
          name: item.workspace_name,
          slug: item.workspace_slug,
          plan: item.workspace_plan,
          seats_limit: item.workspace_seats_limit,
          role: item.role,
        }))
        setWorkspaces(workspacesWithRole)
      }
      setLoading(false)
    }

    fetchWorkspaces()
  }, [user])

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await switchWorkspace(workspaceId)
    router.refresh()
  }

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

  if (loading || !workspace) {
    return <div className="h-10 w-48 rounded-md bg-muted/30" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-2 hover:bg-sidebar-accent/20 text-left font-normal"
        >
          <span className="truncate text-xs font-medium text-sidebar-foreground/90">{workspace.name}</span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => handleSwitchWorkspace(ws.id)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              {ws.id === workspace.id && <Check className="h-4 w-4" />}
              <span className="truncate">{ws.name}</span>
            </span>
            <Badge className={`${getRoleBadgeColor(ws.role)} text-white text-xs`}>
              {getRoleLabel(ws.role)}
            </Badge>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/workspace/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
