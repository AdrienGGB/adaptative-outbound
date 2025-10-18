'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SidebarNavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: {
    count: number
    variant?: 'default' | 'secondary' | 'destructive'
  }
  collapsed?: boolean
  disabled?: boolean
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  badge,
  collapsed = false,
  disabled = false
}: SidebarNavItemProps) {
  const pathname = usePathname()

  // Check if current route matches this nav item
  const isActive =
    pathname === href ||
    (href !== '/workspace' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary',
        disabled && 'pointer-events-none opacity-50',
        collapsed && 'justify-center px-2'
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'h-6 w-6')} />

      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>

          {badge && badge.count > 0 && (
            <Badge
              variant={badge.variant || 'default'}
              className="ml-auto h-5 min-w-[20px] justify-center px-1 text-xs"
            >
              {badge.count > 99 ? '99+' : badge.count}
            </Badge>
          )}
        </>
      )}
    </Link>
  )
}
