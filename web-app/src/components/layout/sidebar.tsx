'use client'

import Link from 'next/link'
import { useSidebar } from '@/hooks/use-sidebar'
import { useBadgeCounts } from '@/hooks/use-badge-counts'
import { useAuth } from '@/lib/auth/auth-context'
import { navigationSections } from '@/lib/navigation'
import { SidebarNavItem } from './sidebar-nav-item'
import { UserMenu } from './user-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { collapsed, toggle } = useSidebar()
  const { counts } = useBadgeCounts()
  const { workspace } = useAuth()

  const workspaceInitials = workspace?.name
    ? workspace.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'WS'

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Workspace Header */}
      <div className={cn('flex h-14 items-center px-3 border-b', collapsed && 'justify-center px-2')}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {workspaceInitials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && workspace && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{workspace.name}</p>
              </div>
              <p className="text-xs text-muted-foreground capitalize">{workspace.plan}</p>
            </div>
          )}

          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-4">
          {navigationSections.map((section, index) => (
            <div key={section.name} className="space-y-0.5">
              {!collapsed && index > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground/60">
                    {section.name}
                  </p>
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const badgeCount = item.badge ? counts[item.badge.key] : undefined

                  return (
                    <SidebarNavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      badge={
                        item.badge && badgeCount !== undefined
                          ? {
                              count: badgeCount,
                              variant: item.badge.variant
                            }
                          : undefined
                      }
                      collapsed={collapsed}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t p-2">
        <UserMenu collapsed={collapsed} />

        {!collapsed && (
          <Separator className="my-2" />
        )}

        {/* Collapse/Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn(
            'w-full justify-start h-9',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse sidebar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
