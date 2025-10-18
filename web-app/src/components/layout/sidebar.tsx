'use client'

import Link from 'next/link'
import { useSidebar } from '@/hooks/use-sidebar'
import { useBadgeCounts } from '@/hooks/use-badge-counts'
import { navigationSections } from '@/lib/navigation'
import { SidebarNavItem } from './sidebar-nav-item'
import { WorkspaceMenu } from './workspace-menu'
import { UserMenu } from './user-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { collapsed, toggle } = useSidebar()
  const { counts } = useBadgeCounts()

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Logo/Brand */}
      <div className={cn('flex h-14 items-center border-b px-3', collapsed && 'justify-center')}>
        <Link href="/workspace" className="flex items-center gap-2">
          {!collapsed && (
            <h1 className="text-lg font-bold">Adaptive Outbound</h1>
          )}
          {collapsed && (
            <span className="text-lg font-bold">AO</span>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.name} className="space-y-1">
              {!collapsed && (
                <h2 className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground">
                  {section.name}
                </h2>
              )}

              {collapsed && section.name !== 'MAIN' && (
                <Separator className="my-2" />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  // Get badge count if this item has a badge
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
      <div className="border-t">
        <div className="p-3 space-y-1">
          <WorkspaceMenu collapsed={collapsed} />
          <UserMenu collapsed={collapsed} />

          <Separator className="my-2" />

          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              'w-full justify-start gap-2',
              collapsed && 'justify-center px-2'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
