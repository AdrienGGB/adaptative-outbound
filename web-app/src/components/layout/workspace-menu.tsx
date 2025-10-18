'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceMenuProps {
  collapsed?: boolean
}

export function WorkspaceMenu({ collapsed = false }: WorkspaceMenuProps) {
  const { workspace } = useAuth()

  if (!workspace) return null

  const initials = workspace.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 px-3 py-2',
            collapsed && 'justify-center px-2'
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <p className="text-sm font-medium truncate w-full">
                  {workspace.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {workspace.plan}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56" align="start">
        <div className="space-y-1">
          <div className="px-2 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Current Workspace
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{workspace.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {workspace.plan} plan
                </p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
