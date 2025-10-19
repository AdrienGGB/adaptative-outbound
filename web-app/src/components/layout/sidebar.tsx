'use client'

import Link from 'next/link'
import Image from 'next/image'
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
      {/* Brand Logo & Workspace Header */}
      <div className={cn('flex flex-col border-b', collapsed ? 'h-16 items-center justify-center px-2' : 'h-auto py-3 px-3')}>
        {collapsed ? (
          <Link href="/" className="flex items-center justify-center">
            <div className="relative h-12 w-12">
              <Image
                src="/logo/Logo_Nobackground_logoOnly.png"
                alt="Adaptive Outbound"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        ) : (
          <>
            {/* Logo */}
            <Link href="/" className="flex items-center h-9 mb-3">
              <div className="relative h-9 w-48 overflow-hidden">
                <Image
                  src="/logo/Logo_Nobackground_horizontal.png"
                  alt="Adaptive Outbound"
                  fill
                  className="object-cover object-left scale-110"
                  style={{ objectPosition: 'left center' }}
                  priority
                />
              </div>
            </Link>

            {/* Workspace Info */}
            {workspace && (
              <div className="flex items-center gap-2 min-w-0 px-2 py-1.5 rounded-md bg-sidebar-accent/10">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                    {workspaceInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-sidebar-foreground/90">{workspace.name}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0 hover:bg-sidebar-accent/20">
                  <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation Sections */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-4">
          {navigationSections.map((section, index) => (
            <div key={section.name} className="space-y-0.5">
              {!collapsed && index > 0 && (
                <div className="px-3 py-2 mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
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
            'w-full h-9',
            collapsed ? 'justify-center px-0' : 'justify-start'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
