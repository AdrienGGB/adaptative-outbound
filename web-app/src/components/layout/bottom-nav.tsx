'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { bottomNavItems } from '@/lib/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  onMoreClick?: () => void
  className?: string
}

export function BottomNav({ onMoreClick, className }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden',
        className
      )}
    >
      {bottomNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/workspace' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        )
      })}

      {/* More Button */}
      <button
        onClick={onMoreClick}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
        <span>More</span>
      </button>
    </nav>
  )
}
