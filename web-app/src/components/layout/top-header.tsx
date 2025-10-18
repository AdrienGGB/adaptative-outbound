'use client'

import Link from 'next/link'
import { useBreadcrumbs, type Breadcrumb } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Menu, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopHeaderProps {
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  onMenuClick?: () => void
  className?: string
}

export function TopHeader({
  breadcrumbs: overrideBreadcrumbs,
  actions,
  onMenuClick,
  className
}: TopHeaderProps) {
  const autoBreadcrumbs = useBreadcrumbs(overrideBreadcrumbs)
  const breadcrumbs = overrideBreadcrumbs || autoBreadcrumbs

  return (
    <header
      className={cn(
        'flex h-14 items-center gap-4 border-b bg-background px-4',
        className
      )}
    >
      {/* Mobile: Hamburger Menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-1 min-w-0">
        <ol className="flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}

              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Page-specific actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
