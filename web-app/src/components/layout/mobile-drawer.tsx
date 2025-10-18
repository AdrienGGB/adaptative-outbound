'use client'

import { useRouter } from 'next/navigation'
import { navigationSections } from '@/lib/navigation'
import { useBadgeCounts } from '@/hooks/use-badge-counts'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SidebarNavItem } from './sidebar-nav-item'
import { WorkspaceMenu } from './workspace-menu'
import { UserMenu } from './user-menu'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const router = useRouter()
  const { counts } = useBadgeCounts()

  const handleNavClick = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Adaptive Outbound</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.name} className="space-y-1">
                <h2 className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground">
                  {section.name}
                </h2>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    // Get badge count if this item has a badge
                    const badgeCount = item.badge ? counts[item.badge.key] : undefined

                    return (
                      <div
                        key={item.href}
                        onClick={() => handleNavClick(item.href)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleNavClick(item.href)
                          }
                        }}
                      >
                        <SidebarNavItem
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
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3 space-y-1">
          <Separator className="my-2" />
          <WorkspaceMenu />
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  )
}
