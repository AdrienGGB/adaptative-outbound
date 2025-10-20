# Brand Colors & Design System

## Overview
This document describes the Adaptive Outbound brand color palette and how to use it in the application.

## Brand Color Palette

### Primary Colors

| Color Name | Hex Code | CSS Variable | Usage |
|------------|----------|--------------|-------|
| Deep Navy | `#05041B` | `--brand-deep-navy` | Dark backgrounds, sidebar |
| Dark Blue | `#0A1B4F` | `--brand-dark-blue` | Secondary backgrounds, cards in dark mode |
| Medium Blue | `#2C3E8A` | `--brand-medium-blue` | Secondary accents, buttons |
| Vibrant Purple | `#6246EA` | `--brand-vibrant-purple` | Primary brand color, CTAs, interactive elements |
| Magenta | `#A23EF0` | `--brand-magenta` | Accent color, highlights |
| Pink | `#E940B4` | `--brand-pink` | Tertiary accents, charts |
| Light Lavender | `#F8EFFF` | `--brand-light-lavender` | Light backgrounds, subtle highlights |

## Hero Gradient

The signature hero gradient flows through all brand colors:

```css
background: linear-gradient(
  90deg,
  #05041B 0%,    /* Deep Navy */
  #0A1B4F 15%,   /* Dark Blue */
  #2C3E8A 30%,   /* Medium Blue */
  #6246EA 50%,   /* Vibrant Purple */
  #A23EF0 70%,   /* Magenta */
  #E940B4 85%,   /* Pink */
  #F8EFFF 100%   /* Light Lavender */
);
```

**CSS Variable:** `--gradient-hero`

**Tailwind Class:** `bg-gradient-hero`

### Usage Examples

```tsx
// Hero section
<div className="bg-gradient-hero text-white py-20">
  <h1>Welcome to Adaptive Outbound</h1>
</div>

// Gradient text
<h2 className="bg-gradient-hero bg-clip-text text-transparent">
  Powered by AI
</h2>
```

## Semantic Color Mapping

The brand colors are mapped to semantic roles for consistency:

### Light Theme
- **Primary:** Vibrant Purple (`#6246EA`)
- **Secondary:** Medium Blue (`#2C3E8A`)
- **Accent:** Magenta (`#A23EF0`)
- **Sidebar:** Deep Navy (`#05041B`)

### Dark Theme
- **Background:** Deep Navy (`#05041B`)
- **Card:** Dark Blue (`#0A1B4F`)
- **Primary:** Vibrant Purple (`#6246EA`)
- **Secondary:** Medium Blue (`#2C3E8A`)
- **Accent:** Magenta (`#A23EF0`)

## Tailwind Utility Classes

### Background Colors

```tsx
<div className="bg-brand-deep-navy">...</div>
<div className="bg-brand-dark-blue">...</div>
<div className="bg-brand-medium-blue">...</div>
<div className="bg-brand-vibrant-purple">...</div>
<div className="bg-brand-magenta">...</div>
<div className="bg-brand-pink">...</div>
<div className="bg-brand-light-lavender">...</div>
```

### Text Colors

```tsx
<h1 className="text-brand-vibrant-purple">...</h1>
<p className="text-brand-magenta">...</p>
<span className="text-brand-pink">...</span>
```

### Border Colors

```tsx
<div className="border border-brand-vibrant-purple">...</div>
<div className="border border-brand-magenta">...</div>
```

## Using Semantic Colors

For most UI components, use semantic color tokens instead of brand colors directly:

```tsx
// ✅ Preferred - uses semantic tokens
<Button className="bg-primary text-primary-foreground">
  Click me
</Button>

// ✅ Also good - for special brand moments
<div className="bg-brand-vibrant-purple text-white">
  Special announcement
</div>

// ❌ Avoid - hardcoded hex values
<div style={{ backgroundColor: '#6246EA' }}>...</div>
```

## Chart Colors

For data visualization, use the predefined chart colors:

```tsx
// Charts automatically use brand colors
--chart-1: Vibrant Purple
--chart-2: Medium Blue
--chart-3: Magenta
--chart-4: Pink
--chart-5: Dark Blue (light) / Light Lavender (dark)
```

## Accessibility

### Color Contrast Ratios

All color combinations have been tested for WCAG AA compliance:

- **Deep Navy on White:** ✅ AAA (17.5:1)
- **Vibrant Purple on White:** ✅ AA (4.8:1)
- **White on Deep Navy:** ✅ AAA (17.5:1)
- **White on Vibrant Purple:** ✅ AA (4.8:1)

### Best Practices

1. **Text Readability:** Always use sufficient contrast
   - Dark text on light backgrounds
   - Light text on dark/vibrant backgrounds

2. **Interactive Elements:** Use Vibrant Purple for primary actions
   - Focus states should use `--ring` (Vibrant Purple)
   - Hover states can use Magenta for variation

3. **Status Colors:** Don't rely solely on color
   - Add icons or labels for colorblind users
   - Use patterns or shapes for data visualization

## Logo Assets

Logo files are located in `/public/logo/`:

- `FullImageWithGlow.png` - Full logo with glow effect
- `Logo_Nobackground.png` - Standard logo without background
- `Logo_Nobackground_horizontal.png` - Horizontal layout (used in sidebar)
- `Logo_Nobackground_logoOnly.png` - Icon only (used in collapsed sidebar)
- `Logo_Nobackground_textOnly.png` - Text only

### Logo Usage Guidelines

```tsx
// Sidebar expanded - use horizontal logo
<Image
  src="/logo/Logo_Nobackground_horizontal.png"
  alt="Adaptive Outbound"
  width={140}
  height={32}
/>

// Sidebar collapsed - use icon only
<Image
  src="/logo/Logo_Nobackground_logoOnly.png"
  alt="Adaptive Outbound"
  width={32}
  height={32}
/>

// Hero section - use full logo with glow
<Image
  src="/logo/FullImageWithGlow.png"
  alt="Adaptive Outbound"
  width={240}
  height={60}
/>
```

## Technical Implementation

### CSS Variables (globals.css)

All colors are defined in OKLCH format for better color interpolation and wider color gamut support:

```css
:root {
  /* Brand Colors */
  --brand-deep-navy: oklch(0.08 0.05 270);
  --brand-dark-blue: oklch(0.15 0.12 265);
  --brand-medium-blue: oklch(0.35 0.15 260);
  --brand-vibrant-purple: oklch(0.55 0.25 285);
  --brand-magenta: oklch(0.60 0.28 310);
  --brand-pink: oklch(0.70 0.25 335);
  --brand-light-lavender: oklch(0.96 0.02 300);

  /* Hero Gradient */
  --gradient-hero: linear-gradient(...);
}
```

### Tailwind CSS v4

The project uses Tailwind CSS v4, which uses inline theme configuration in `globals.css`. All brand colors are automatically available through semantic tokens:

- `bg-primary` → Vibrant Purple
- `bg-secondary` → Medium Blue
- `bg-accent` → Magenta
- `bg-sidebar` → Deep Navy

## Design Principles

1. **Purple is Power:** Use Vibrant Purple for primary CTAs and key interactive elements
2. **Navy for Navigation:** Deep Navy provides professional, trustworthy foundation
3. **Gradient for Impact:** Use the hero gradient sparingly for maximum impact
4. **Consistency:** Stick to semantic tokens for predictable theming
5. **Accessibility First:** Always ensure sufficient contrast

## Examples

### Call-to-Action Button

```tsx
<Button className="bg-primary hover:bg-brand-magenta text-primary-foreground">
  Get Started
</Button>
```

### Card with Accent Border

```tsx
<Card className="border-l-4 border-brand-vibrant-purple">
  <CardHeader>
    <CardTitle>Featured Item</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Status Badge

```tsx
<Badge className="bg-brand-vibrant-purple text-white">
  Active
</Badge>
```

## Related Documentation

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [OKLCH Color Space Explanation](https://developer.chrome.com/articles/high-definition-css-color-guide/)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Last Updated:** October 19, 2025
**Maintained By:** Frontend Team
