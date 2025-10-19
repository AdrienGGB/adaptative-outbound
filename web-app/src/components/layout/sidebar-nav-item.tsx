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
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
        'hover:bg-sidebar-accent/30 hover:text-sidebar-foreground',
        'relative',
        isActive && [
          'bg-sidebar-accent/20 text-sidebar-primary',
          'before:absolute before:left-0 before:top-1 before:bottom-1',
          'before:w-0.5 before:bg-sidebar-primary before:rounded-full'
        ],
        disabled && 'pointer-events-none opacity-50',
        collapsed && 'justify-center px-2'
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled}
    >
      <Icon className={cn(
        'h-4 w-4 flex-shrink-0 transition-colors duration-200',
        collapsed && 'h-5 w-5',
        isActive && 'text-sidebar-primary'
      )} />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>

          {badge && badge.count > 0 && (
            <Badge
              variant={badge.variant || 'secondary'}
              className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-xs font-medium"
            >
              {badge.count > 99 ? '99+' : badge.count}
            </Badge>
          )}
        </>
      )}
    </Link>
  )
}
