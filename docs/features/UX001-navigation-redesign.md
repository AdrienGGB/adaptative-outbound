# UX001: Navigation System Redesign

## 📋 Feature Overview

**Feature ID:** UX001
**Priority:** P0 - Critical Foundation
**Timeline:** 1-2 days
**Status:** Planning → Implementation
**Dependencies:** None
**Impacts:** All authenticated pages, F044 (Data Pipeline), all future features

---

## 🎯 Goals

### Primary Goals
1. **Professional B2B SaaS Experience** - Look and feel like Linear, Notion, or HubSpot
2. **Persistent Navigation** - Users never lose sight of where they are or where they can go
3. **Mobile-First Responsive** - Seamless experience from mobile to desktop
4. **Scalable Foundation** - Easy to add new pages as features grow
5. **Zero Navigation Friction** - No more "← Back" button clicking

### User Experience Goals
- Users can access any section in 1 click (currently requires 2-3 clicks + back buttons)
- Clear visual indication of current location
- Quick workspace switching
- Professional appearance for demos and early customers

### Technical Goals
- Eliminate duplicate header code across 9+ pages
- Single source of truth for navigation structure
- Reusable components
- TypeScript strict mode compliance
- Accessibility (WCAG 2.1 AA)

---

## 📊 Current State Analysis

### Current Problems

**Navigation Issues:**
- ❌ No persistent navigation - each page has isolated header
- ❌ "← Back" buttons as primary navigation (poor UX)
- ❌ Users must return to `/workspace` page to switch sections
- ❌ No breadcrumbs - users lose context of where they are
- ❌ No quick access to all sections

**Code Issues:**
- ❌ Duplicate header code in 9+ pages
- ❌ Inconsistent spacing and layout
- ❌ Each page recreates workspace switcher
- ❌ No shared layout structure

**Mobile Issues:**
- ❌ Header-based navigation doesn't work well on small screens
- ❌ No thumb-friendly navigation
- ❌ Back buttons hard to reach on large phones

### Current Page Inventory

**Authenticated Pages (need layout):**
1. `/workspace` - Workspace dashboard
2. `/accounts` - Accounts list
3. `/accounts/[id]` - Account detail
4. `/contacts` - Contacts list
5. `/contacts/[id]` - Contact detail
6. `/activities` - Activities timeline
7. `/tasks` - Tasks management
8. `/workspace/members` - Team members
9. `/workspace/settings` - Workspace settings

**Future Pages (F044 and beyond):**
- `/workspace/jobs` - Job queue dashboard
- `/workspace/settings/api` - API integrations (BYOK)
- `/sequences` - Email sequences
- `/dashboard` - Analytics dashboard

**Public Pages (no layout needed):**
- `/` - Landing/redirect
- `/login` - Login page
- `/signup` - Signup page
- `/auth/error` - Auth error
- `/invitations/[token]` - Accept invitation

---

## 🎨 Design Specifications

### Visual Design

#### Desktop Layout (> 1024px)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────┐  ┌─────────────────────────────────────────┐  │
│  │          │  │ Top Header                               │  │
│  │          │  │ [☰] Home > Accounts > Enterprise         │  │
│  │  Sidebar │  │                    [🔍 Search] [🔔] [AG] │  │
│  │          │  └─────────────────────────────────────────┘  │
│  │  240px   │                                                │
│  │          │  ┌─────────────────────────────────────────┐  │
│  │          │  │                                          │  │
│  │  [Logo]  │  │                                          │  │
│  │          │  │                                          │  │
│  │  🏠 Home │  │                                          │  │
│  │          │  │                                          │  │
│  │  CRM     │  │         Page Content Area                │  │
│  │  📊 Acc  │  │                                          │  │
│  │  👥 Con  │  │                                          │  │
│  │  📅 Act  │  │                                          │  │
│  │  ✓ Tasks │  │                                          │  │
│  │          │  │                                          │  │
│  │  OUTREACH│  │                                          │  │
│  │  📧 Seq  │  │                                          │  │
│  │          │  │                                          │  │
│  │  ──────  │  │                                          │  │
│  │          │  │                                          │  │
│  │  SETTINGS│  │                                          │  │
│  │  ⚙️  Set │  │                                          │  │
│  │  👤 Team │  │                                          │  │
│  │  🔌 APIs │  │                                          │  │
│  │  📊 Jobs │  │                                          │  │
│  │          │  │                                          │  │
│  │  ──────  │  │                                          │  │
│  │  [WS ▼]  │  │                                          │  │
│  │  [User]  │  └─────────────────────────────────────────┘  │
│  └──────────┘                                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (< 768px)

```
┌─────────────────────────┐
│ Top Header              │
│ [☰] Accounts            │
│              [🔔] [AG]  │
└─────────────────────────┘

┌─────────────────────────┐
│                         │
│                         │
│                         │
│    Page Content Area    │
│                         │
│                         │
│                         │
└─────────────────────────┘

┌─────────────────────────┐
│  🏠     📊     👥   ✓  ☰│
│ Home  Accounts Cont Tasks More│
└─────────────────────────┘
     Bottom Navigation
```

### Color Specifications

**Already Defined in `globals.css`:**
```css
/* Light Mode */
--sidebar: oklch(0.985 0 0);              /* Light gray background */
--sidebar-foreground: oklch(0.145 0 0);    /* Dark text */
--sidebar-primary: oklch(0.205 0 0);       /* Active item */
--sidebar-primary-foreground: oklch(0.985 0 0); /* Active text */
--sidebar-accent: oklch(0.97 0 0);         /* Hover background */
--sidebar-accent-foreground: oklch(0.205 0 0); /* Hover text */
--sidebar-border: oklch(0.922 0 0);        /* Border color */
--sidebar-ring: oklch(0.708 0 0);          /* Focus ring */

/* Dark Mode */
--sidebar: oklch(0.205 0 0);               /* Dark background */
--sidebar-foreground: oklch(0.985 0 0);    /* Light text */
--sidebar-primary: oklch(0.488 0.243 264.376); /* Active (purple) */
--sidebar-accent: oklch(0.269 0 0);        /* Hover background */
```

### Measurements & Spacing

**Sidebar (Desktop):**
- Width expanded: `240px`
- Width collapsed: `64px`
- Padding: `16px`
- Logo height: `48px`
- Nav item height: `40px`
- Nav item padding: `8px 12px`
- Icon size: `20px`
- Section separator: `16px` vertical margin

**Bottom Navigation (Mobile):**
- Height: `64px`
- Tab width: `20%` (5 equal tabs)
- Icon size: `24px`
- Label font size: `12px`
- Padding: `8px 0`

**Top Header:**
- Height: `56px`
- Padding: `0 24px`
- Border bottom: `1px solid var(--border)`
- Breadcrumb separator: `/` with `8px` margins

**Breakpoints:**
```typescript
// Tailwind breakpoints
mobile: '< 768px'      // Bottom nav
tablet: '768px - 1024px' // Icon-only sidebar
desktop: '> 1024px'    // Full sidebar
```

### Typography

**Using Existing Fonts:**
- **Sans**: `var(--font-geist-sans)` (Geist Sans)
- **Mono**: `var(--font-geist-mono)` (Geist Mono)

**Sidebar Navigation:**
- Section headers: `12px, uppercase, font-semibold, tracking-wide, opacity-60`
- Nav items: `14px, font-medium`
- Badge counts: `12px, font-medium`

**Bottom Navigation:**
- Labels: `12px, font-medium`

**Breadcrumbs:**
- Text: `14px, font-medium`
- Separator: `14px, opacity-50`

---

## 🏗️ Component Architecture

### 1. App Shell (`components/layout/app-shell.tsx`)

**Purpose:** Main layout wrapper for all authenticated pages

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode
  breadcrumbs?: Breadcrumb[]
  pageTitle?: string
}

interface Breadcrumb {
  label: string
  href?: string
}
```

**Structure:**
```tsx
<div className="flex h-screen">
  {/* Desktop Sidebar */}
  <Sidebar className="hidden md:flex" />

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col">
    <TopHeader breadcrumbs={breadcrumbs} />

    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>

  {/* Mobile Bottom Nav */}
  <BottomNav className="md:hidden" />

  {/* Mobile Drawer */}
  <MobileDrawer />
</div>
```

**Responsibilities:**
- Manage sidebar collapsed/expanded state
- Provide sidebar context to children
- Handle mobile drawer state
- Coordinate responsive behavior

---

### 2. Sidebar (`components/layout/sidebar.tsx`)

**Purpose:** Persistent navigation for desktop/tablet

**Props:**
```typescript
interface SidebarProps {
  className?: string
}
```

**Structure:**
```tsx
<aside className="sidebar">
  <ScrollArea>
    {/* Logo/Brand */}
    <div className="logo-section">
      <Link href="/workspace">
        {!collapsed && <h1>Adaptive Outbound</h1>}
        {collapsed && <span>AO</span>}
      </Link>
    </div>

    {/* Navigation Sections */}
    {navigationSections.map(section => (
      <div key={section.name}>
        {!collapsed && <SectionHeader>{section.name}</SectionHeader>}
        <Separator />

        {section.items.map(item => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            collapsed={collapsed}
          />
        ))}
      </div>
    ))}

    {/* Spacer */}
    <div className="flex-1" />

    {/* Bottom Section */}
    <div className="bottom-section">
      <Separator />
      <WorkspaceMenu collapsed={collapsed} />
      <UserMenu collapsed={collapsed} />
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCollapse}
      >
        {collapsed ? '→' : '←'}
      </Button>
    </div>
  </ScrollArea>
</aside>
```

**Features:**
- Collapse/expand button
- Scroll with shadow indicators
- Active route highlighting
- Badge counts display
- Workspace switcher at bottom
- User menu at bottom

**Responsive Behavior:**
- Desktop (> 1024px): Full width (240px), collapsible
- Tablet (768px - 1024px): Auto-collapsed to 64px (icon-only)
- Mobile (< 768px): Hidden (use bottom nav instead)

---

### 3. Sidebar Nav Item (`components/layout/sidebar-nav-item.tsx`)

**Purpose:** Individual navigation link in sidebar

**Props:**
```typescript
interface SidebarNavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: {
    count: number
    variant?: 'default' | 'warning' | 'danger'
  }
  collapsed?: boolean
  disabled?: boolean
}
```

**States:**
- **Default**: Gray background, normal text
- **Hover**: Accent background, accent text
- **Active**: Primary background, primary text, left border accent
- **Collapsed**: Icon-only, tooltip on hover

**Structure:**
```tsx
<Link href={href}>
  <div className={cn(
    "nav-item",
    isActive && "active",
    disabled && "disabled"
  )}>
    <Icon className="icon" />

    {!collapsed && (
      <>
        <span className="label">{label}</span>

        {badge && (
          <Badge variant={badge.variant}>
            {badge.count}
          </Badge>
        )}
      </>
    )}
  </div>

  {collapsed && (
    <Tooltip>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )}
</Link>
```

---

### 4. Bottom Navigation (`components/layout/bottom-nav.tsx`)

**Purpose:** Mobile navigation (< 768px only)

**Props:**
```typescript
interface BottomNavProps {
  className?: string
}
```

**Tabs:**
1. **Home** (`🏠`) - `/workspace`
2. **Accounts** (`📊`) - `/accounts`
3. **Contacts** (`👥`) - `/contacts`
4. **Tasks** (`✓`) - `/tasks`
5. **More** (`☰`) - Opens mobile drawer

**Structure:**
```tsx
<nav className="bottom-nav">
  <BottomNavTab
    icon={Home}
    label="Home"
    href="/workspace"
    active={pathname === '/workspace'}
  />

  <BottomNavTab
    icon={Building2}
    label="Accounts"
    href="/accounts"
    active={pathname.startsWith('/accounts')}
  />

  <BottomNavTab
    icon={Users}
    label="Contacts"
    href="/contacts"
    active={pathname.startsWith('/contacts')}
  />

  <BottomNavTab
    icon={CheckSquare}
    label="Tasks"
    href="/tasks"
    active={pathname === '/tasks'}
  />

  <button
    onClick={openDrawer}
    className={cn(
      "bottom-nav-tab",
      drawerOpen && "active"
    )}
  >
    <Menu className="icon" />
    <span className="label">More</span>
  </button>
</nav>
```

**Features:**
- Fixed to bottom of screen
- Active tab highlighted
- Smooth active indicator animation
- Touch-optimized (min height 44px per iOS guidelines)

---

### 5. Top Header (`components/layout/top-header.tsx`)

**Purpose:** Page title, breadcrumbs, actions

**Props:**
```typescript
interface TopHeaderProps {
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
}
```

**Structure:**
```tsx
<header className="top-header">
  <div className="left-section">
    {/* Mobile: Hamburger Menu */}
    <Button
      variant="ghost"
      size="icon"
      onClick={openDrawer}
      className="md:hidden"
    >
      <Menu />
    </Button>

    {/* Breadcrumbs */}
    <Breadcrumbs items={breadcrumbs} />
  </div>

  <div className="right-section">
    {/* Page-specific actions */}
    {actions}

    {/* Global Search (future) */}
    <Button variant="ghost" size="icon">
      <Search />
    </Button>

    {/* Notifications (future) */}
    <Button variant="ghost" size="icon">
      <Bell />
      <Badge variant="destructive">3</Badge>
    </Button>

    {/* User Menu (mobile only) */}
    <UserMenu className="md:hidden" />
  </div>
</header>
```

---

### 6. Mobile Drawer (`components/layout/mobile-drawer.tsx`)

**Purpose:** Full navigation menu for mobile

**Uses:** shadcn/ui `Sheet` component

**Structure:**
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="left">
    <div className="drawer-header">
      <h2>Adaptive Outbound</h2>
      <SheetClose />
    </div>

    <ScrollArea>
      {/* Full Navigation Menu */}
      {navigationSections.map(section => (
        <div key={section.name}>
          <h3>{section.name}</h3>
          {section.items.map(item => (
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ))}

      {/* Workspace Switcher */}
      <Separator />
      <WorkspaceMenu />

      {/* User Menu */}
      <UserMenu />
    </ScrollArea>
  </SheetContent>
</Sheet>
```

**Features:**
- Slides in from left
- Full navigation access
- Close on route change
- Backdrop overlay
- Swipe to close (gesture)

---

### 7. User Menu (`components/layout/user-menu.tsx`)

**Purpose:** User account dropdown

**Props:**
```typescript
interface UserMenuProps {
  collapsed?: boolean
  className?: string
}
```

**Structure:**
```tsx
<Popover>
  <PopoverTrigger>
    <Button variant="ghost">
      <Avatar>
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>

      {!collapsed && (
        <>
          <div>
            <p className="name">{user.full_name}</p>
            <p className="email">{user.email}</p>
          </div>
          <ChevronDown />
        </>
      )}
    </Button>
  </PopoverTrigger>

  <PopoverContent>
    <div className="user-info">
      <Avatar size="lg" />
      <div>
        <p className="name">{user.full_name}</p>
        <p className="email">{user.email}</p>
      </div>
    </div>

    <Separator />

    <div className="menu-items">
      <MenuItem href="/workspace/settings">
        <Settings />
        <span>Settings</span>
      </MenuItem>

      <MenuItem onClick={toggleTheme}>
        <Moon />
        <span>Dark Mode</span>
        <Switch checked={isDark} />
      </MenuItem>

      <Separator />

      <MenuItem onClick={signOut} variant="destructive">
        <LogOut />
        <span>Sign Out</span>
      </MenuItem>
    </div>
  </PopoverContent>
</Popover>
```

---

### 8. Workspace Menu (`components/layout/workspace-menu.tsx`)

**Purpose:** Switch between workspaces

**Props:**
```typescript
interface WorkspaceMenuProps {
  collapsed?: boolean
}
```

**Structure:**
```tsx
<Popover>
  <PopoverTrigger>
    <Button variant="ghost">
      <Avatar>
        <AvatarFallback>{workspace.initials}</AvatarFallback>
      </Avatar>

      {!collapsed && (
        <>
          <div>
            <p className="name">{workspace.name}</p>
            <p className="plan">{workspace.plan}</p>
          </div>
          <ChevronsUpDown />
        </>
      )}
    </Button>
  </PopoverTrigger>

  <PopoverContent>
    <div className="workspaces-list">
      {workspaces.map(ws => (
        <WorkspaceItem
          key={ws.id}
          workspace={ws}
          active={ws.id === currentWorkspace.id}
          onClick={() => switchWorkspace(ws.id)}
        />
      ))}
    </div>

    <Separator />

    <Button
      variant="outline"
      onClick={() => router.push('/workspace/create')}
    >
      <Plus />
      <span>Create Workspace</span>
    </Button>
  </PopoverContent>
</Popover>
```

---

## 📋 Navigation Configuration

### lib/navigation.ts

**Single source of truth for all navigation:**

```typescript
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
    variant?: 'default' | 'warning' | 'danger'
  }
  matchPattern?: RegExp // For active state matching
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
        badge: { key: 'tasks', variant: 'warning' }, // Warning for overdue
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
        label: 'Settings',
        href: '/workspace/settings',
        icon: Settings,
        matchPattern: /^\/workspace\/settings/
      },
      {
        label: 'Team Members',
        href: '/workspace/members',
        icon: TeamIcon,
        matchPattern: /^\/workspace\/members/
      },
      {
        label: 'Integrations',
        href: '/workspace/settings/api',
        icon: Plug,
        matchPattern: /^\/workspace\/settings\/api/
      },
      {
        label: 'Jobs',
        href: '/workspace/jobs',
        icon: ListChecks,
        matchPattern: /^\/workspace\/jobs/
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
```

---

## 🔧 Hooks & Utilities

### 1. use-sidebar.tsx

**Purpose:** Manage sidebar collapsed state

```typescript
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed })
    }),
    {
      name: 'sidebar-storage'
    }
  )
)
```

**Alternative (simpler, no persistence):**

```typescript
'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  collapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle: () => setCollapsed(prev => !prev)
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}
```

---

### 2. use-breadcrumbs.tsx

**Purpose:** Generate breadcrumbs from route or manual override

```typescript
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
  '/workspace/settings': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Settings' }
  ],
  '/workspace/members': [
    { label: 'Dashboard', href: '/workspace' },
    { label: 'Team Members' }
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

    // Default: just show current page
    return [{ label: 'Dashboard', href: '/workspace' }]
  }, [pathname, override])
}
```

---

### 3. use-badge-counts.tsx

**Purpose:** Fetch and cache badge counts

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'

interface BadgeCounts {
  accounts: number
  contacts: number
  activities: number
  tasks: number
}

export function useBadgeCounts() {
  const { workspace } = useAuth()
  const [counts, setCounts] = useState<BadgeCounts>({
    accounts: 0,
    contacts: 0,
    activities: 0,
    tasks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspace) return

    const fetchCounts = async () => {
      const supabase = createClient()

      try {
        const [accountsRes, contactsRes, activitiesRes, tasksRes] = await Promise.all([
          supabase
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id),
          supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id),
          supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Last 24h
          supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .in('status', ['pending', 'in_progress'])
        ])

        setCounts({
          accounts: accountsRes.count || 0,
          contacts: contactsRes.count || 0,
          activities: activitiesRes.count || 0,
          tasks: tasksRes.count || 0
        })
      } catch (error) {
        console.error('Failed to fetch badge counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()

    // Refresh every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [workspace])

  return { counts, loading }
}
```

---

## 📱 Responsive Behavior

### Breakpoint Strategy

| Screen Size | Layout | Sidebar | Bottom Nav | Notes |
|-------------|--------|---------|------------|-------|
| **Mobile** (< 768px) | Single column | Hidden | Visible | Bottom nav + drawer for full menu |
| **Tablet** (768px - 1024px) | Sidebar + content | Icon-only (64px) | Hidden | Auto-collapsed sidebar to save space |
| **Desktop** (> 1024px) | Sidebar + content | Full (240px) | Hidden | User can collapse sidebar manually |

### Responsive Components

**Sidebar:**
```tsx
<aside className={cn(
  "sidebar",
  "hidden md:flex", // Hidden on mobile
  "md:w-16", // Icon-only on tablet
  "lg:w-60", // Full on desktop
  collapsed && "md:w-16" // User-collapsed state
)}>
```

**Bottom Nav:**
```tsx
<nav className={cn(
  "bottom-nav",
  "md:hidden", // Only visible on mobile
  "fixed bottom-0 left-0 right-0"
)}>
```

**Top Header:**
```tsx
<header className="top-header">
  {/* Hamburger: mobile only */}
  <Button className="md:hidden" onClick={openDrawer}>
    <Menu />
  </Button>

  {/* Breadcrumbs: always visible */}
  <Breadcrumbs />

  {/* User menu: mobile only (sidebar has it on desktop) */}
  <UserMenu className="md:hidden" />
</header>
```

---

## 🔄 User Flows

### Flow 1: Navigate from Accounts to Tasks (Desktop)

**Current (Bad UX):**
1. User on Accounts page
2. Click "← Back" to go to Workspace
3. Click "View Tasks" card
4. Arrives at Tasks page
**Total:** 2 clicks, lose context

**New (Good UX):**
1. User on Accounts page
2. Click "Tasks" in sidebar
3. Arrives at Tasks page
**Total:** 1 click, maintain context

---

### Flow 2: Navigate from Account Detail to Contacts (Desktop)

**Current (Bad UX):**
1. User on Account Detail page (`/accounts/123`)
2. Click "← Back" to Accounts list
3. Click "← Back" to Workspace
4. Click "View Contacts" card
5. Arrives at Contacts page
**Total:** 3 clicks

**New (Good UX):**
1. User on Account Detail page
2. Click "Contacts" in sidebar
3. Arrives at Contacts page
**Total:** 1 click

---

### Flow 3: Switch Workspace (Desktop)

**Current (OK):**
1. User on any page
2. Click workspace switcher in header (varies by page)
3. Select new workspace
4. Page reloads with new workspace
**Total:** 2 clicks, inconsistent location

**New (Good UX):**
1. User on any page
2. Click workspace menu at bottom of sidebar (consistent location)
3. Select new workspace
4. Page reloads with new workspace
**Total:** 2 clicks, consistent location

---

### Flow 4: Navigate on Mobile

**Current (Bad UX):**
1. User on Accounts page (mobile)
2. Click "← Back" to Workspace
3. Scroll to find "Tasks" card
4. Click "View Tasks"
5. Arrives at Tasks page
**Total:** 2 clicks + scrolling

**New (Good UX):**
1. User on Accounts page (mobile)
2. Tap "Tasks" in bottom nav
3. Arrives at Tasks page
**Total:** 1 tap, thumb-friendly

---

### Flow 5: Access Settings (Mobile)

**Current (Bad UX):**
1. User on any page
2. Click "← Back" until reaching Workspace
3. Scroll to find Settings card
4. Click "Manage Settings"
5. Arrives at Settings page
**Total:** Multiple clicks + scrolling

**New (Good UX):**
1. User on any page
2. Tap "More" in bottom nav
3. Drawer opens with full menu
4. Tap "Settings"
5. Arrives at Settings page
**Total:** 2 taps, easy access

---

## 🚀 Implementation Plan

### Phase 1: Dependencies & Setup (15 minutes)

**Install shadcn components:**
```bash
cd web-app
npx shadcn@latest add avatar
npx shadcn@latest add popover
npx shadcn@latest add sheet
npx shadcn@latest add scroll-area
```

**Create directory structure:**
```bash
mkdir -p src/components/layout
mkdir -p src/hooks
```

**Success Criteria:**
- [ ] All shadcn components installed
- [ ] Directory structure created
- [ ] Build succeeds (`npm run build`)

---

### Phase 2: Navigation Config & Hooks (1 hour)

**Files to create:**
1. `src/lib/navigation.ts` - Navigation structure
2. `src/hooks/use-sidebar.tsx` - Sidebar state
3. `src/hooks/use-breadcrumbs.tsx` - Breadcrumbs logic
4. `src/hooks/use-badge-counts.tsx` - Badge counts

**Tasks:**
- Define all navigation sections
- Create sidebar context/hook
- Implement breadcrumb generation
- Implement badge count fetching

**Success Criteria:**
- [ ] Navigation config exports correctly
- [ ] useSidebar hook works (test with console.log)
- [ ] useBreadcrumbs generates correct breadcrumbs
- [ ] useBadgeCounts fetches real data

---

### Phase 3: Core Layout Components (3-4 hours)

**Order of implementation:**

**3.1 Sidebar Nav Item (30 min)**
- `src/components/layout/sidebar-nav-item.tsx`
- Build isolated, test with Storybook or temp page
- Verify hover, active, collapsed states

**3.2 Sidebar (1 hour)**
- `src/components/layout/sidebar.tsx`
- Use navigation config
- Integrate SidebarNavItem
- Add collapse button
- Test scrolling

**3.3 User Menu (30 min)**
- `src/components/layout/user-menu.tsx`
- Use Popover from shadcn
- Sign out functionality
- Theme toggle (future)

**3.4 Workspace Menu (30 min)**
- `src/components/layout/workspace-menu.tsx`
- Workspace switching logic
- Create workspace option

**3.5 Top Header (30 min)**
- `src/components/layout/top-header.tsx`
- Breadcrumbs component
- Hamburger for mobile
- Actions slot

**3.6 Bottom Nav (30 min)**
- `src/components/layout/bottom-nav.tsx`
- 5 fixed tabs
- Active state
- More button (opens drawer)

**3.7 Mobile Drawer (30 min)**
- `src/components/layout/mobile-drawer.tsx`
- Use Sheet from shadcn
- Full navigation menu
- Close on route change

**3.8 App Shell (1 hour)**
- `src/components/layout/app-shell.tsx`
- Integrate all layout components
- Responsive grid
- Context providers

**Success Criteria:**
- [ ] Each component renders without errors
- [ ] Responsive behavior works
- [ ] Navigation works
- [ ] Active states highlight correctly

---

### Phase 4: Test with One Page (1 hour)

**Choose test page:** `/workspace/page.tsx`

**Tasks:**
1. Wrap page content in `<AppShell>`
2. Remove duplicate header code
3. Test navigation
4. Test responsive behavior
5. Fix any issues

**Before:**
```tsx
export default function WorkspacePage() {
  return (
    <div className="min-h-screen">
      <header>
        {/* Header code */}
      </header>
      <main>
        {/* Page content */}
      </main>
    </div>
  )
}
```

**After:**
```tsx
import { AppShell } from '@/components/layout/app-shell'

export default function WorkspacePage() {
  return (
    <AppShell>
      {/* Just page content, no header */}
      <div className="container mx-auto px-4 py-8">
        {/* Page content */}
      </div>
    </AppShell>
  )
}
```

**Success Criteria:**
- [ ] Workspace page renders correctly
- [ ] Sidebar navigation works
- [ ] Mobile bottom nav works
- [ ] No layout issues
- [ ] No console errors

---

### Phase 5: Refactor All Pages (2-3 hours)

**Pages to refactor (9 pages):**

**List pages:**
1. `/accounts/page.tsx`
2. `/contacts/page.tsx`
3. `/activities/page.tsx`
4. `/tasks/page.tsx`

**Detail pages:**
5. `/accounts/[id]/page.tsx`
6. `/contacts/[id]/page.tsx`

**Settings pages:**
7. `/workspace/members/page.tsx`
8. `/workspace/settings/page.tsx`

**Already done:**
9. `/workspace/page.tsx` (from Phase 4)

**For each page:**
1. Remove header section
2. Wrap in `<AppShell>`
3. Remove "← Back" button
4. Add breadcrumbs override if needed
5. Adjust padding/spacing
6. Test navigation

**Success Criteria:**
- [ ] All pages render correctly
- [ ] No duplicate headers
- [ ] Navigation works from all pages
- [ ] Breadcrumbs show correct path
- [ ] Responsive on all pages

---

### Phase 6: Polish & Refinement (1-2 hours)

**6.1 Animations (30 min)**
- Sidebar collapse/expand transition
- Drawer slide-in animation
- Bottom nav active indicator slide
- Smooth scroll in sidebar

**6.2 Accessibility (30 min)**
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for all nav items
- Focus management (drawer open/close)
- Screen reader testing

**6.3 Dark Mode (15 min)**
- Test all components in dark mode
- Adjust colors if needed
- Verify contrast ratios

**6.4 Edge Cases (15 min)**
- Long workspace names (truncate)
- Many navigation items (scrolling)
- No badge counts (show 0 or hide)
- Loading states

**Success Criteria:**
- [ ] Animations smooth (60fps)
- [ ] Keyboard navigation works
- [ ] Dark mode looks good
- [ ] Edge cases handled gracefully

---

## ✅ Testing Checklist

### Functionality Testing

**Sidebar (Desktop):**
- [ ] All navigation links work
- [ ] Active route highlighted correctly
- [ ] Collapse/expand button works
- [ ] Collapsed state shows icons only
- [ ] Collapsed state shows tooltips on hover
- [ ] Badge counts display correctly
- [ ] Workspace switcher works
- [ ] User menu dropdown works
- [ ] Sign out works

**Bottom Nav (Mobile):**
- [ ] All tabs work
- [ ] Active tab highlighted
- [ ] "More" button opens drawer
- [ ] Touch targets ≥ 44px (iOS guideline)

**Mobile Drawer:**
- [ ] Opens from hamburger menu
- [ ] Opens from "More" tab
- [ ] Closes on route change
- [ ] Closes on backdrop click
- [ ] Closes on Escape key
- [ ] All navigation links work

**Top Header:**
- [ ] Breadcrumbs generate correctly
- [ ] Breadcrumb links work
- [ ] Hamburger menu opens drawer (mobile)

**Responsive:**
- [ ] Mobile (< 768px): Bottom nav visible, sidebar hidden
- [ ] Tablet (768px - 1024px): Icon-only sidebar, bottom nav hidden
- [ ] Desktop (> 1024px): Full sidebar, bottom nav hidden
- [ ] Transitions smooth between breakpoints

---

### Visual Testing

**Desktop (1920px):**
- [ ] Sidebar width correct (240px / 64px)
- [ ] Content area uses remaining space
- [ ] No horizontal scroll
- [ ] Spacing consistent

**Tablet (1024px):**
- [ ] Sidebar auto-collapsed to icons
- [ ] Content area readable
- [ ] Touch targets adequate

**Mobile (375px):**
- [ ] Bottom nav visible
- [ ] Content not obscured by bottom nav
- [ ] Drawer full-width
- [ ] No horizontal scroll

**Dark Mode:**
- [ ] All components render correctly
- [ ] Proper contrast ratios (≥ 4.5:1 for text)
- [ ] Hover states visible
- [ ] Active states visible

---

### Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab through all nav items
- [ ] Enter activates links
- [ ] Escape closes drawer/popover
- [ ] Focus visible on all elements
- [ ] Focus trapped in drawer when open

**Screen Reader:**
- [ ] Navigation structure announced
- [ ] Active route announced
- [ ] Drawer state announced (open/closed)
- [ ] Badge counts read correctly

**ARIA:**
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-current="page"` on active route
- [ ] `aria-expanded` on collapsible elements
- [ ] `role="navigation"` on nav elements

---

### Performance Testing

**Metrics:**
- [ ] Initial render < 100ms
- [ ] Navigation click < 16ms (60fps)
- [ ] Sidebar collapse < 300ms (smooth)
- [ ] Drawer open < 300ms (smooth)
- [ ] Badge counts fetch < 1s

**Lighthouse:**
- [ ] Accessibility score ≥ 95
- [ ] Performance score ≥ 90
- [ ] Best Practices score ≥ 95

---

## 📂 File Structure

### New Files to Create (13 files)

```
web-app/src/
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx              ✨ NEW (Main layout wrapper)
│   │   ├── sidebar.tsx                ✨ NEW (Desktop sidebar)
│   │   ├── sidebar-nav-item.tsx       ✨ NEW (Nav link component)
│   │   ├── bottom-nav.tsx             ✨ NEW (Mobile bottom nav)
│   │   ├── top-header.tsx             ✨ NEW (Page header)
│   │   ├── mobile-drawer.tsx          ✨ NEW (Mobile menu drawer)
│   │   ├── user-menu.tsx              ✨ NEW (User dropdown)
│   │   └── workspace-menu.tsx         ✨ NEW (Workspace switcher)
│   └── ui/
│       ├── avatar.tsx                 ✨ NEW (shadcn)
│       ├── popover.tsx                ✨ NEW (shadcn)
│       ├── sheet.tsx                  ✨ NEW (shadcn)
│       └── scroll-area.tsx            ✨ NEW (shadcn)
├── hooks/
│   ├── use-sidebar.tsx                ✨ NEW (Sidebar state hook)
│   ├── use-breadcrumbs.tsx            ✨ NEW (Breadcrumbs hook)
│   └── use-badge-counts.tsx           ✨ NEW (Badge counts hook)
└── lib/
    └── navigation.ts                  ✨ NEW (Navigation config)
```

### Files to Modify (9 pages)

```
web-app/src/app/
├── workspace/
│   ├── page.tsx                       🔧 MODIFY (Remove header, wrap in AppShell)
│   ├── members/page.tsx               🔧 MODIFY
│   └── settings/page.tsx              🔧 MODIFY
├── accounts/
│   ├── page.tsx                       🔧 MODIFY
│   └── [id]/page.tsx                  🔧 MODIFY
├── contacts/
│   ├── page.tsx                       🔧 MODIFY
│   └── [id]/page.tsx                  🔧 MODIFY
├── activities/page.tsx                🔧 MODIFY
└── tasks/page.tsx                     🔧 MODIFY
```

---

## ⏱️ Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1** | Install dependencies, setup | 15 min |
| **Phase 2** | Navigation config, hooks | 1 hour |
| **Phase 3** | Core layout components | 3-4 hours |
| **Phase 4** | Test with one page | 1 hour |
| **Phase 5** | Refactor all pages | 2-3 hours |
| **Phase 6** | Polish & refinement | 1-2 hours |
| **Total** | End-to-end implementation | **8-11 hours** |

**Realistic Timeline:**
- **Day 1** (4-5 hours): Phase 1-4 (core components + test)
- **Day 2** (4-5 hours): Phase 5-6 (refactor pages + polish)

---

## 🎯 Success Metrics

### User Experience Metrics

**Navigation Efficiency:**
- ✅ **Before:** Average 2-3 clicks to switch sections
- 🎯 **After:** 1 click to any section from anywhere

**User Perception:**
- ✅ **Before:** "Feels like a prototype"
- 🎯 **After:** "Looks like a professional B2B SaaS product"

**Mobile Usability:**
- ✅ **Before:** Back buttons hard to reach, lots of clicks
- 🎯 **After:** Thumb-friendly bottom nav, 1-tap access

### Technical Metrics

**Code Quality:**
- ✅ **Before:** 9 pages with duplicate header code (~50 lines each = 450 lines)
- 🎯 **After:** 1 AppShell component (~200 lines) = 55% code reduction

**Maintenance:**
- ✅ **Before:** Adding new page requires copying header code
- 🎯 **After:** Wrap in `<AppShell>`, done

**Accessibility:**
- ✅ **Before:** No keyboard navigation, inconsistent ARIA
- 🎯 **After:** Full keyboard nav, WCAG 2.1 AA compliant

### Business Metrics

**Demo Quality:**
- ✅ **Before:** Need to explain "this is just a prototype"
- 🎯 **After:** Looks production-ready from first glance

**Feature Velocity:**
- ✅ **Before:** Each new page needs header, nav, responsive logic
- 🎯 **After:** New pages drop into AppShell instantly

**F044 Readiness:**
- ✅ **Before:** Would add 3-4 more pages with duplicate headers
- 🎯 **After:** F044 pages use AppShell, 2 hours saved

---

## 🚧 Known Limitations & Future Enhancements

### Current Limitations

1. **Global Search** - Not implemented yet
   - Future: Cmd+K global search dialog
   - Search accounts, contacts, tasks

2. **Notifications** - Not implemented yet
   - Future: Bell icon with notification dropdown
   - Real-time updates via Supabase Realtime

3. **Keyboard Shortcuts** - Basic only
   - Future: Cmd+B (toggle sidebar), Cmd+K (search), G+A (go to accounts)

4. **Collapsible Sections** - Sidebar sections not collapsible
   - Future: Collapse/expand CRM, OUTREACH sections

5. **Saved Views** - No saved filter/search state
   - Future: Save frequently used filters

### Future Enhancements (Post-F044)

**Phase 2 (after F044):**
- Global search (Cmd+K)
- Notifications center
- Keyboard shortcuts
- Recent pages history
- Favorites/pinned items

**Phase 3 (future):**
- Customizable sidebar order
- Collapsed sidebar sections
- Quick actions menu
- Context-aware actions
- Workspace-level theming

---

## 📚 References & Inspiration

### Design Inspiration

**Linear (linear.app):**
- Excellent sidebar with sections
- Clean active states
- Smooth collapse/expand

**Notion (notion.so):**
- Sidebar navigation
- Workspace switcher at bottom
- Good responsive behavior

**Airtable (airtable.com):**
- Bottom section for workspace/user
- Clear visual hierarchy
- Badge counts

**HubSpot (hubspot.com):**
- B2B SaaS standard layout
- Persistent navigation
- Professional appearance

### Technical References

**shadcn/ui Documentation:**
- https://ui.shadcn.com/docs/components/sheet (Mobile Drawer)
- https://ui.shadcn.com/docs/components/popover (Dropdowns)
- https://ui.shadcn.com/docs/components/avatar (User/Workspace)

**Tailwind CSS Responsive:**
- https://tailwindcss.com/docs/responsive-design

**Next.js App Router:**
- https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates

**Accessibility (WCAG 2.1):**
- https://www.w3.org/WAI/WCAG21/quickref/
- Focus management: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets

---

## 🤝 Review & Approval

### Review Checklist

**Design Review:**
- [ ] Sidebar layout approved
- [ ] Mobile bottom nav approved
- [ ] Color scheme approved
- [ ] Spacing/typography approved

**Technical Review:**
- [ ] Component architecture approved
- [ ] File structure approved
- [ ] Hook design approved
- [ ] Responsive strategy approved

**Implementation Plan:**
- [ ] Phase breakdown approved
- [ ] Time estimates realistic
- [ ] Success criteria clear

### Sign-Off

- [ ] **Product Owner:** Adrien ___________
- [ ] **Developer:** Claude Code ___________
- [ ] **Ready to Implement:** ⬜ Yes ⬜ No ⬜ Needs Changes

---

**Document Version:** 1.0
**Created:** January 18, 2025
**Last Updated:** January 18, 2025
**Status:** ⏳ Pending Review → Ready for Implementation
