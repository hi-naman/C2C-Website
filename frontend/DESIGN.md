# C2C Platform Redesign: Visual Design System

This document outlines the visual guidelines and design guidelines implemented during the C2C platform redesign (inspired by Vercel, Linear, shadcn/ui, and Apple's Human Interface Guidelines). All new feature developments and page designs must conform to these principles.

---

## Typography & Base Setup
- **Font**: Geist Sans (via `--font-geist-sans`).
- **Heading**: Large, bold, tight tracking. Avoid text color gradients.
- **Grids**: Responsive layout grids adapting across mobile, tablet, and desktop views.
- **Vertical Spacing**: Maintain generous margins (80px to 120px between sections on main pages).

## Color System (Monochrome Grayscale)
The design uses OKLCH gray scales with a single accent color used sparingly.

### Light Mode
- **Background**: `#ffffff` (`var(--background)`)
- **Foreground Text**: `#09090b` (`var(--foreground)`)
- **Card Surfaces**: `#fafafa` (`var(--card)`)
- **Borders & Inputs**: `#e4e4e7` (`var(--border)`)
- **Primary Buttons**: `#09090b` background with `#ffffff` text

### Dark Mode
- **Background**: `#0c0c0e` (`var(--background)`)
- **Foreground Text**: `#fafafa` (`var(--foreground)`)
- **Card Surfaces**: `#151518` (`var(--card)`)
- **Borders & Inputs**: `#222226` (`var(--border)`)
- **Primary Buttons**: `#fafafa` background with `#0c0c0e` text

### Brand Accent (Sparingly Used)
- **Cobalt Blue**: `var(--brand-accent)` (`oklch(0.55 0.20 250)` light mode / `oklch(0.60 0.18 250)` dark mode). Used for highlighting icons of active tabs, online status badges, or small indicator elements.

---

## Elements & Interaction

### Buttons
- **Primary**: Solid high-contrast block (White on black in light mode, black on white in dark mode).
- **Secondary (Outline)**: Card background with a thin border.
- **Ghost**: Completely transparent.
- **Animations**: Subtle hover scaling (`hover:scale-[1.02]`) and soft transitions. Avoid flashy translate or color animations.

### Card Panels
- Must use solid grayscale backgrounds (`bg-card`). Do NOT use semi-transparent glassmorphism (`backdrop-blur-xl bg-card/45`).
- Must use thin borders (`border-border`), rounded corners (`rounded-xl` / 12px), and very soft shadows.

### Animations
- Use `.animate-fade-in` (defined in `globals.css`) for subtle slide-up and fade transitions on page mounts.
- Use `.dot-grid` background overlay utility for minimalist developer background layout grids.
