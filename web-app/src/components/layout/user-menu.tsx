'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogOut, Settings, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  collapsed?: boolean
  className?: string
}

export function UserMenu({ collapsed = false, className }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  if (!user) return null

  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 px-3 py-2',
            collapsed && 'justify-center px-2',
            className
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <p className="text-sm font-medium truncate w-full">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56" align="end">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => router.push('/workspace/settings')}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>

          <Separator className="my-2" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
