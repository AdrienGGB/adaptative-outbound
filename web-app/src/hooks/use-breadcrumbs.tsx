'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface Breadcrumb {
  label: string
  href?: string
}

const routeBreadcrumbs: Record<string, Breadcrumb[]> = {
  '/workspace': [{ label: 'Dashboard' }],
  '/accounts': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Accounts' }
  ],
  '/contacts': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Contacts' }
  ],
  '/activities': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Activities' }
  ],
  '/tasks': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Tasks' }
  ],
  '/sequences': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Sequences' }
  ],
  '/workspace/settings': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Settings' }
  ],
  '/workspace/members': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Team Members' }
  ],
  '/workspace/settings/api': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Settings', href: '/workspace/settings' },
    { label: 'Integrations' }
  ],
  '/workspace/jobs': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Jobs' }
  ]
}

export function useBreadcrumbs(override?: Breadcrumb[]): Breadcrumb[] {
  const pathname = usePathname()

  return useMemo(() => {
    if (override) return override

    // Try exact match first
    if (routeBreadcrumbs[pathname]) {
      return routeBreadcrumbs[pathname]
    }

    // Try pattern matching for dynamic routes
    // e.g., /accounts/123 -> Accounts > Account Details
    if (pathname.startsWith('/accounts/')) {
      return [
        { label: 'Dashboard', href: '/workspace' },
        { label: 'Accounts', href: '/accounts' },
        { label: 'Account Details' }
      ]
    }

    if (pathname.startsWith('/contacts/')) {
      return [
        { label: 'Dashboard', href: '/workspace' },
        { label: 'Contacts', href: '/contacts' },
        { label: 'Contact Details' }
      ]
    }

    if (pathname.startsWith('/workspace/jobs/')) {
      return [
        { label: 'Dashboard', href: '/workspace' },
        { label: 'Jobs', href: '/workspace/jobs' },
        { label: 'Job Details' }
      ]
    }

    // Default: just show current page
    return [{ label: 'Dashboard', href: '/workspace' }]
  }, [pathname, override])
}
