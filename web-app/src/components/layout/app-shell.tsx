'use client'

import { useState } from 'react'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { Sidebar } from './sidebar'
import { TopHeader } from './top-header'
import { BottomNav } from './bottom-nav'
import { MobileDrawer } from './mobile-drawer'
import type { Breadcrumb } from '@/hooks/use-breadcrumbs'

interface AppShellProps {
  children: React.ReactNode
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
}

export function AppShell({ children, breadcrumbs, actions }: AppShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleMenuClick = () => {
    setMobileDrawerOpen(true)
  }

  const handleMoreClick = () => {
    setMobileDrawerOpen(true)
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header */}
          <TopHeader
            breadcrumbs={breadcrumbs}
            actions={actions}
            onMenuClick={handleMenuClick}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav onMoreClick={handleMoreClick} />

        {/* Mobile Drawer */}
        <MobileDrawer
          open={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
        />
      </div>
    </SidebarProvider>
  )
}
