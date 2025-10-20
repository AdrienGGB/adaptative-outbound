# UI Layout Guidelines

## Overview
This document defines the standard layout patterns for all pages in the Adaptive Outbound application to ensure consistent spacing, responsive behavior, and professional appearance across the application.

## Critical: Container Pattern for AppShell Pages

### The Problem
Without proper container constraints, page content can span the entire viewport width on large screens (ultra-wide monitors, 4K displays), making content difficult to read and looking unprofessional.

**Example of incorrect layout:**
```typescript
// ❌ WRONG - Content will span full viewport width
return (
  <AppShell>
    <div className="space-y-6">
      {/* content here */}
    </div>
  </AppShell>
)
```

**Result on large screens:**
- Text spans 3000+ pixels wide
- Cards and forms look stretched
- Poor readability
- Unprofessional appearance

### The Solution: Container Wrapper

**All pages using AppShell MUST include this container wrapper:**

```typescript
// ✅ CORRECT - Content constrained with proper spacing
return (
  <AppShell>
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        {/* content here */}
      </div>
    </div>
  </AppShell>
)
```

**Breakdown of the pattern:**
- `container` - Tailwind CSS container class
- `mx-auto` - Centers the container horizontally
- `px-4` - Horizontal padding (16px) for mobile spacing
- `py-6` - Vertical padding (24px) for top/bottom spacing
- `max-w-7xl` - Maximum width constraint (1280px)

### Why These Values?

- **max-w-7xl (1280px)**: Industry standard for B2B SaaS applications
  - Readable on all screen sizes
  - Professional appearance
  - Matches design systems like Tailwind, shadcn/ui

- **px-4**: Ensures content doesn't touch screen edges on mobile

- **py-6**: Consistent vertical spacing from AppShell header/footer

### Pages Already Fixed

The following pages have been updated with the correct container pattern:

1. ✅ `/jobs/page.tsx` - Jobs listing page
2. ✅ `/jobs/[id]/page.tsx` - Job detail page
3. ✅ `/workspace/settings/api/page.tsx` - API settings page
4. ✅ `/accounts/page.tsx` - Accounts listing (has container)
5. ✅ `/accounts/[id]/page.tsx` - Account detail (has container)
6. ✅ `/contacts/page.tsx` - Contacts listing (has container)
7. ✅ `/contacts/[id]/page.tsx` - Contact detail (has container)
8. ✅ `/activities/page.tsx` - Activities page (has container)
9. ✅ `/tasks/page.tsx` - Tasks page (has container)
10. ✅ `/workspace/members/page.tsx` - Members page (has container)
11. ✅ `/workspace/settings/page.tsx` - Settings page (has container)

## New Page Checklist

When creating a new page, follow this checklist:

### 1. Basic Page Structure
```typescript
import { AppShell } from '@/components/layout/app-shell'

export default function YourPage() {
  return (
    <AppShell>
      {/* Always add container wrapper here */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Your page content */}
        </div>
      </div>
    </AppShell>
  )
}
```

### 2. Checklist Items

- [ ] Page uses `<AppShell>` component for navigation
- [ ] Container wrapper added: `<div className="container mx-auto px-4 py-6 max-w-7xl">`
- [ ] Content wrapper uses `space-y-6` for vertical spacing between sections
- [ ] Page tested on different screen sizes (mobile, tablet, desktop, ultra-wide)
- [ ] Content is readable and doesn't span too wide
- [ ] Horizontal padding visible on mobile devices
- [ ] Page follows breadcrumb pattern if applicable

### 3. Common Mistakes to Avoid

❌ **Mistake 1: Forgetting the container wrapper**
```typescript
// Wrong - will span full width
<AppShell>
  <div className="space-y-6">
    <h1>My Page</h1>
  </div>
</AppShell>
```

❌ **Mistake 2: Using inconsistent max-width values**
```typescript
// Wrong - using different max-width
<div className="container mx-auto px-4 py-6 max-w-5xl"> {/* should be max-w-7xl */}
```

❌ **Mistake 3: Nesting multiple containers**
```typescript
// Wrong - double container
<AppShell>
  <div className="container mx-auto px-4 py-6 max-w-7xl">
    <div className="container max-w-4xl"> {/* redundant */}
      <h1>My Page</h1>
    </div>
  </div>
</AppShell>
```

✅ **Correct approach:**
```typescript
<AppShell>
  <div className="container mx-auto px-4 py-6 max-w-7xl">
    {/* Content can have its own max-width if needed */}
    <div className="max-w-2xl mx-auto">
      <form>{/* Narrower form */}</form>
    </div>
  </div>
</AppShell>
```

## Responsive Behavior

The container pattern automatically adapts to different screen sizes:

### Mobile (< 640px)
- Container uses `px-4` (16px padding)
- Content spans full width minus padding
- No max-width constraint needed

### Tablet (640px - 1024px)
- Container centers with `mx-auto`
- Content uses available width
- Padding prevents edge-to-edge content

### Desktop (1024px - 1280px)
- Container centers and uses available width
- Approaching max-width constraint

### Large Desktop (> 1280px)
- Container hits `max-w-7xl` (1280px) limit
- Content centered with equal margins on both sides
- Professional, readable width maintained

## Component-Level Layout

### Cards and Sections

For cards and sections within the container, use consistent spacing:

```typescript
<div className="container mx-auto px-4 py-6 max-w-7xl">
  <div className="space-y-6">
    {/* Section 1 */}
    <Card>
      <CardHeader>
        <CardTitle>Section Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* content */}
      </CardContent>
    </Card>

    {/* Section 2 - automatically spaced with space-y-6 */}
    <Card>
      <CardHeader>
        <CardTitle>Another Section</CardTitle>
      </CardHeader>
      <CardContent>
        {/* content */}
      </CardContent>
    </Card>
  </div>
</div>
```

### Forms

Forms can optionally use narrower max-widths for better UX:

```typescript
<div className="container mx-auto px-4 py-6 max-w-7xl">
  {/* Form gets narrower constraint for better readability */}
  <div className="max-w-2xl mx-auto">
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          {/* form fields */}
        </form>
      </CardContent>
    </Card>
  </div>
</div>
```

### Tables and Data Grids

Tables benefit from the full `max-w-7xl` width:

```typescript
<div className="container mx-auto px-4 py-6 max-w-7xl">
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1>Accounts</h1>
      <Button>Create Account</Button>
    </div>

    {/* Table uses full container width */}
    <Card>
      <CardContent className="p-0">
        <AccountsTable accounts={accounts} />
      </CardContent>
    </Card>
  </div>
</div>
```

## Spacing Standards

### Vertical Spacing

- **Between major sections**: `space-y-6` (24px)
- **Between form fields**: `space-y-4` (16px)
- **Between related items**: `space-y-2` (8px)
- **Card internal padding**: `p-6` (24px) for CardContent

### Horizontal Spacing

- **Page container**: `px-4` (16px on mobile, responsive)
- **Button groups**: `gap-2` (8px) or `gap-4` (16px)
- **Icon + text**: `gap-2` (8px)

## Testing Your Layout

### Manual Testing

1. **Chrome DevTools Responsive Mode**
   - Open DevTools (Cmd+Opt+I)
   - Toggle device toolbar (Cmd+Shift+M)
   - Test these breakpoints:
     - Mobile: 375px (iPhone SE)
     - Mobile: 390px (iPhone 12 Pro)
     - Tablet: 768px (iPad)
     - Desktop: 1280px
     - Large: 1920px
     - Ultra-wide: 2560px

2. **Visual Checks**
   - ✅ Content doesn't touch screen edges on mobile
   - ✅ Content doesn't span too wide on large screens
   - ✅ Vertical spacing is consistent
   - ✅ Cards and sections are aligned properly
   - ✅ Text is readable (not too wide)

### Automated Checks

Add a comment at the top of your page file:
```typescript
/**
 * Layout: AppShell with container (max-w-7xl)
 * Tested: Mobile (375px), Tablet (768px), Desktop (1280px), Large (1920px)
 */
```

## AppShell Integration

The AppShell component provides:
- Persistent sidebar navigation (desktop)
- Bottom navigation (mobile)
- Breadcrumbs
- Page actions
- User menu
- Workspace switcher

**Your page content should ONLY worry about:**
- Adding the container wrapper
- Structuring your content
- Implementing page-specific features

**AppShell handles:**
- Navigation
- Mobile responsiveness
- Header/footer
- Layout structure

## Example: Complete Page Template

```typescript
'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

/**
 * Example Page
 * Layout: AppShell with container (max-w-7xl)
 * Tested: Mobile (375px), Tablet (768px), Desktop (1280px), Large (1920px)
 */
export default function ExamplePage() {
  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Examples', href: '/examples' },
        { label: 'Example Page' },
      ]}
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      }
    >
      {/* Container wrapper - REQUIRED for all AppShell pages */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-bold">Page Title</h1>
            <p className="text-muted-foreground mt-2">
              Page description or subtitle
            </p>
          </div>

          {/* Main content */}
          <Card>
            <CardHeader>
              <CardTitle>Section Title</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Your content here */}
            </CardContent>
          </Card>

          {/* Additional sections */}
          <Card>
            <CardHeader>
              <CardTitle>Another Section</CardTitle>
            </CardHeader>
            <CardContent>
              {/* More content */}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
```

## Quick Reference

### Copy-Paste Container Wrapper
```typescript
<div className="container mx-auto px-4 py-6 max-w-7xl">
  <div className="space-y-6">
    {/* Your page content here */}
  </div>
</div>
```

### Common Class Combinations
- **Page container**: `container mx-auto px-4 py-6 max-w-7xl`
- **Section spacing**: `space-y-6`
- **Form spacing**: `space-y-4`
- **Form container**: `max-w-2xl mx-auto`
- **Button group**: `flex items-center gap-2`
- **Header section**: `flex items-center justify-between`

## Review Process

Before submitting a PR with a new page:

1. ✅ Container wrapper is present
2. ✅ Max-width is `max-w-7xl`
3. ✅ Page tested on mobile (375px)
4. ✅ Page tested on tablet (768px)
5. ✅ Page tested on desktop (1280px)
6. ✅ Page tested on large screen (1920px+)
7. ✅ Content is readable and well-spaced
8. ✅ No console errors or warnings
9. ✅ Follows component patterns from this guide

## Related Documentation

- [AppShell Component Documentation](./APPSHELL_COMPONENT.md)
- [Design System Guidelines](./DESIGN_SYSTEM.md)
- [Component Library](../../web-app/src/components/ui/)
- [Tailwind Configuration](../../web-app/tailwind.config.ts)

## History

- **2025-10-20**: Initial creation after fixing full-width layout issues on multiple pages
- Issue identified: Pages using AppShell without container wrapper span full viewport width on large screens
- Solution: Standardize container pattern across all pages
- Affected pages: Jobs listing, job detail, API settings, and others

## Questions or Issues?

If you encounter layout issues or have questions about implementing this pattern:

1. Check this document first
2. Review existing pages for reference (e.g., `/accounts/page.tsx`)
3. Test on multiple screen sizes
4. Consult with the team if unsure

**Remember: Consistency is key. Every page using AppShell should follow this pattern.**
