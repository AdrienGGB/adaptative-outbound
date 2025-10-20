import {
  Home,
  Building2,
  Users,
  Calendar,
  CheckSquare,
  Mail,
  Settings,
  Users as TeamIcon,
  Plug,
  ListChecks,
  type LucideIcon
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: {
    key: 'accounts' | 'contacts' | 'activities' | 'tasks'
    variant?: 'default' | 'secondary' | 'destructive'
  }
  matchPattern?: RegExp // For active state matching
  children?: NavItem[] // For nested items
}

export interface NavSection {
  name: string
  items: NavItem[]
}

export const navigationSections: NavSection[] = [
  {
    name: 'MAIN',
    items: [
      {
        label: 'Dashboard',
        href: '/workspace',
        icon: Home,
        matchPattern: /^\/workspace$/
      }
    ]
  },
  {
    name: 'CRM',
    items: [
      {
        label: 'Accounts',
        href: '/accounts',
        icon: Building2,
        badge: { key: 'accounts' },
        matchPattern: /^\/accounts/
      },
      {
        label: 'Contacts',
        href: '/contacts',
        icon: Users,
        badge: { key: 'contacts' },
        matchPattern: /^\/contacts/
      },
      {
        label: 'Activities',
        href: '/activities',
        icon: Calendar,
        badge: { key: 'activities' },
        matchPattern: /^\/activities/
      },
      {
        label: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
        badge: { key: 'tasks', variant: 'secondary' }, // Secondary for tasks count
        matchPattern: /^\/tasks/
      }
    ]
  },
  {
    name: 'OUTREACH',
    items: [
      {
        label: 'Sequences',
        href: '/sequences',
        icon: Mail,
        matchPattern: /^\/sequences/
      }
    ]
  },
  {
    name: 'WORKSPACE',
    items: [
      {
        label: 'Jobs',
        href: '/jobs',
        icon: ListChecks,
        matchPattern: /^\/jobs/
      },
      {
        label: 'Team Members',
        href: '/workspace/members',
        icon: TeamIcon,
        matchPattern: /^\/workspace\/members/
      },
      {
        label: 'Settings',
        href: '/workspace/settings',
        icon: Settings,
        matchPattern: /^\/workspace\/settings/,
        children: [
          {
            label: 'General',
            href: '/workspace/settings',
            icon: Settings,
            matchPattern: /^\/workspace\/settings$/
          },
          {
            label: 'Integrations',
            href: '/workspace/settings/api',
            icon: Plug,
            matchPattern: /^\/workspace\/settings\/api/
          }
        ]
      }
    ]
  }
]

// Bottom nav items (mobile)
export const bottomNavItems: NavItem[] = [
  {
    label: 'Home',
    href: '/workspace',
    icon: Home,
    matchPattern: /^\/workspace$/
  },
  {
    label: 'Accounts',
    href: '/accounts',
    icon: Building2,
    matchPattern: /^\/accounts/
  },
  {
    label: 'Contacts',
    href: '/contacts',
    icon: Users,
    matchPattern: /^\/contacts/
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    matchPattern: /^\/tasks/
  }
]
