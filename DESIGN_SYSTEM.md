# HoraHub Design System v1.0

> **Status: Awaiting approval before implementation.**
> This document defines the permanent visual identity of HoraHub.
> No code is written until this document is approved.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing Scale](#4-spacing-scale)
5. [Elevation System](#5-elevation-system)
6. [Border Radius](#6-border-radius)
7. [Animation Principles](#7-animation-principles)
8. [Planet Visual Language](#8-planet-visual-language)
9. [Component Library](#9-component-library)
10. [CSS Architecture](#10-css-architecture)
11. [Naming Conventions](#11-naming-conventions)
12. [Responsive Rules](#12-responsive-rules)
13. [Accessibility](#13-accessibility)
14. [Print Mode](#14-print-mode)
15. [Implementation Roadmap](#15-implementation-roadmap)

---

## 1. Design Philosophy

### Three Words

**Calm. Trustworthy. Premium.**

HoraHub should feel like a personal letter from the world's most knowledgeable astrologer. Not software. Not a dashboard. Not a database dump. A careful, authoritative document that respects both the user's time and the depth of the subject.

### Inspirations (ranked by priority)

| Source | What we borrow |
|---|---|
| **Apple** | Whitespace, restraint, typography-first hierarchy, no unnecessary decoration |
| **Linear** | Dark mode excellence, crisp grid, purposeful density |
| **Stripe** | Editorial landing pages, bold headings, trust-building layout |
| **Arc Browser** | Personality, depth, subtle color identity |
| **Raycast** | Premium dark UI, deliberate interaction, no clutter |

### Design Language

**Soft Neumorphism + Bold Editorial Typography**

- Surfaces have subtle depth — they feel solid and real, not flat
- Typography carries the hierarchy — not color, not icons, not noise
- Every element earns its place — nothing decorative, everything purposeful
- Whitespace is generous — breathing room signals confidence

### Anti-Patterns (never do these)

- Dashboard template density
- Admin panel grey boxes
- Random gradient backgrounds
- Icon overuse or mixed icon libraries
- Bright blue or neon accent colors
- Heavy embossed neumorphism (the 2020 era)
- Decorative dividers and flourishes
- Animations that call attention to themselves

---

## 2. Color System

### 2.1 Current Tokens (existing — do not change)

These are the production tokens already in `tailwind.config.ts`. They are the foundation.

| Tailwind name | Hex | Role |
|---|---|---|
| `bg` | `#08080d` | Page background |
| `bg-soft` | `#0e0e17` | Slightly lighter background |
| `panel` | `#13131f` | Card / panel surface |
| `panel-soft` | `#191926` | Elevated surface |
| `line` | `#272736` | Borders, dividers |
| `ink` | `#ececf4` | Primary text (cream white) |
| `ink-muted` | `#9292ad` | Secondary text |
| `gold` | `#d8b46a` | Primary accent |
| `gold-soft` | `#f1d8a0` | Lighter gold, displayed values |
| `accent` | `#8b7cf0` | Links, active states, indicators |
| `good` | `#5fbf8f` | Positive / exalted |
| `warn` | `#d9a05f` | Warning / partial |
| `danger` | `#d96a6a` | Negative / debilitated |

### 2.2 Proposed Additions

Additions that extend the system without breaking existing usage.

**Ink subtle** — for placeholder text and captions
```
ink-subtle: #4e4c60
```

**Gold dim** — for very subtle gold backgrounds (non-intrusive)
```
gold-dim: #3a2e18
```

**Panel raised** — an intermediate level between panel and panel-soft
```
panel-raised: #1e1d2e
```

**Surface gradient** — body background gradient (already used inline, should be tokenized)
```
body-gradient: radial-gradient(900px 500px at 75% -8%, #1b1733 0%, #08080d 55%)
```

### 2.3 Planet Color Palette (new — 9 planets × 3 tokens each)

Each planet gets three tokens: `glow` (primary accent), `bg` (dark card tint), `text` (readable on dark).

| Planet | Glow | Card BG | Display Text | Personality |
|---|---|---|---|---|
| **Sun** | `#d4973b` | `#1c1508` | `#e8b96a` | Warm amber · authority · light |
| **Moon** | `#9ba8c8` | `#10121e` | `#c0cae0` | Silver-blue · calm · reflection |
| **Mars** | `#c94444` | `#1e0e0e` | `#e07070` | Crimson · energy · force |
| **Mercury** | `#4aad7a` | `#0c1a12` | `#6dcc96` | Emerald · intelligence · speed |
| **Jupiter** | `#c8a048` | `#1c1606` | `#e0bc72` | Amber-gold · wisdom · expansion |
| **Venus** | `#c45c84` | `#1e0e16` | `#dc82a8` | Rose-pink · beauty · luxury |
| **Saturn** | `#4c72b0` | `#0e1220` | `#7898cc` | Slate-blue · structure · patience |
| **Rahu** | `#7060d8` | `#100e20` | `#9880f0` | Indigo-violet · shadow · ambition |
| **Ketu** | `#8a7a9e` | `#120e18` | `#b0a0c4` | Mauve · detachment · spirit |

These tokens are added to `tailwind.config.ts` as a `planet` color group:
```ts
planet: {
  sun:     { glow: '#d4973b', bg: '#1c1508', text: '#e8b96a' },
  moon:    { glow: '#9ba8c8', bg: '#10121e', text: '#c0cae0' },
  mars:    { glow: '#c94444', bg: '#1e0e0e', text: '#e07070' },
  mercury: { glow: '#4aad7a', bg: '#0c1a12', text: '#6dcc96' },
  jupiter: { glow: '#c8a048', bg: '#1c1606', text: '#e0bc72' },
  venus:   { glow: '#c45c84', bg: '#1e0e16', text: '#dc82a8' },
  saturn:  { glow: '#4c72b0', bg: '#0e1220', text: '#7898cc' },
  rahu:    { glow: '#7060d8', bg: '#100e20', text: '#9880f0' },
  ketu:    { glow: '#8a7a9e', bg: '#120e18', text: '#b0a0c4' },
}
```

### 2.4 Usage Rules

1. **Text on dark panels**: always `ink` (primary) or `ink-muted` (secondary). Never raw white.
2. **Gold**: accent only — headings, labels, key values. Never large text blocks.
3. **Planet colors**: only on planet-specific components. Never bleed into general UI.
4. **Danger/Good/Warn**: only for semantic states (exalted/debilitated/partial). Never decorative.
5. **Accent**: only for interactive elements (links, focus rings, active states).
6. **Gradients**: body background only, and premium callout cards. Never on buttons.

---

## 3. Typography

### 3.1 Font Stack

**Proposed**: Add Geist Sans (Vercel's open-source typeface, ships with Next.js 15 via `next/font/local`).

Rationale: modern, geometric, Apple-esque — matches the design direction without external CDN dependency.

```ts
// src/app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
```

**Fallback** (if Geist not approved): system-ui stack with tighter tracking
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Tracking | Use |
|---|---|---|---|---|---|
| `display-xl` | 3rem / 48px | 800 | 1.05 | -0.03em | Hero headings (home page H1) |
| `display-lg` | 2.25rem / 36px | 700 | 1.1 | -0.025em | Page titles, section heroes |
| `display-md` | 1.625rem / 26px | 700 | 1.15 | -0.02em | Feature headings |
| `heading-xl` | 1.375rem / 22px | 700 | 1.2 | -0.015em | Section titles (SectionShell h2) |
| `heading-lg` | 1.125rem / 18px | 600 | 1.3 | -0.01em | Card headings |
| `heading-md` | 0.9375rem / 15px | 600 | 1.4 | -0.005em | Sub-headings |
| `body-lg` | 0.9375rem / 15px | 400 | 1.65 | 0 | Lead paragraphs |
| `body-md` | 0.8125rem / 13px | 400 | 1.6 | 0 | Body text |
| `body-sm` | 0.75rem / 12px | 400 | 1.5 | 0 | Secondary info, captions |
| `label-md` | 0.6875rem / 11px | 500 | 1.4 | 0 | Labels, hints |
| `eyebrow` | 0.625rem / 10px | 700 | 1.2 | 0.18em | Section labels (uppercase small caps) |
| `mono` | 0.8125rem / 13px | 400 | 1.5 | 0 | IDs, codes, numeric data |

### 3.3 Hierarchy Rules

1. **Home page**: H1 at `display-xl`. Subtitle at `body-lg` in `ink-muted`. One level of hierarchy.
2. **Report sections**: Section number + title at `heading-xl` in `gold`. Subtitle at `body-sm`.
3. **Cards**: Card label at `eyebrow` in `gold/70`. Primary value at `display-md` or `heading-xl`. Sub-info at `body-sm`.
4. **Never more than 3 type sizes in a single component.**
5. **Gold text**: headings, primary values, eyebrow labels only.
6. **Ink-muted**: descriptions, hints, metadata — anything that supports without competing.

---

## 4. Spacing Scale

Base unit: **4px**. All spacing tokens are multiples.

| Token | px | rem | Use |
|---|---|---|---|
| `space-0` | 0 | 0 | Reset |
| `space-px` | 1 | — | Hairline borders |
| `space-0.5` | 2 | 0.125rem | Micro gap |
| `space-1` | 4 | 0.25rem | Icon-to-label gap |
| `space-1.5` | 6 | 0.375rem | Badge padding |
| `space-2` | 8 | 0.5rem | Compact element padding |
| `space-2.5` | 10 | 0.625rem | Small button padding |
| `space-3` | 12 | 0.75rem | Card gap small |
| `space-4` | 16 | 1rem | Standard padding |
| `space-5` | 20 | 1.25rem | Card padding |
| `space-6` | 24 | 1.5rem | Section gap small |
| `space-8` | 32 | 2rem | Section gap |
| `space-10` | 40 | 2.5rem | Between sections |
| `space-12` | 48 | 3rem | Section top margin |
| `space-16` | 64 | 4rem | Page-level spacing |
| `space-20` | 80 | 5rem | Hero vertical padding |
| `space-24` | 96 | 6rem | Large section vertical |

### Spacing Principles

- Report content: max-width `800px`, horizontal padding `space-4` (mobile) → `space-8` (desktop)
- Card padding: `space-5` (20px) standard, `space-4` (16px) compact
- Section gaps: `space-10` (40px) — the `mt-10` already in SectionShell is correct
- Grid gaps: `space-4` (16px) — the `gap-4` used in AtAGlanceSection is correct

---

## 5. Elevation System

HoraHub uses **soft neumorphism** — elements have presence but never feel plastic.

### 5.1 Shadow Tokens

```css
/* Level 0 — flat (table cells, background elements) */
--shadow-none: none;

/* Level 1 — raised (default cards, panels) */
--shadow-sm:
  0 1px 3px rgba(0, 0, 0, 0.4),
  0 1px 2px rgba(0, 0, 0, 0.3);

/* Level 2 — elevated (hover state, active card) */
--shadow-md:
  0 4px 12px rgba(0, 0, 0, 0.5),
  0 2px 4px rgba(0, 0, 0, 0.3);

/* Level 3 — floating (modals, popovers, dropdowns) */
--shadow-lg:
  0 16px 40px rgba(0, 0, 0, 0.6),
  0 8px 16px rgba(0, 0, 0, 0.4);

/* Existing: --shadow-pop = Level 3 (already in config) */

/* Neumorphic raised (subtle depth on panel surface) */
--shadow-neu-sm:
  2px 2px 6px rgba(0, 0, 0, 0.5),
  -1px -1px 3px rgba(255, 255, 255, 0.025);

--shadow-neu-md:
  4px 4px 12px rgba(0, 0, 0, 0.6),
  -2px -2px 6px rgba(255, 255, 255, 0.03);

/* Neumorphic inset (pressed state) */
--shadow-neu-inset:
  inset 2px 2px 6px rgba(0, 0, 0, 0.6),
  inset -1px -1px 3px rgba(255, 255, 255, 0.02);

/* Gold glow (premium callout cards, cover elements) */
--shadow-gold-glow:
  0 0 24px rgba(216, 180, 106, 0.12),
  0 0 48px rgba(216, 180, 106, 0.04);
```

### 5.2 Elevation Levels

| Level | Shadow | Use |
|---|---|---|
| 0 — Flat | none | Page background elements, table rows |
| 1 — Raised | `neu-sm` | Default card state |
| 2 — Elevated | `neu-md` | Card hover, active planet card |
| 3 — Floating | `lg` + `pop` | Modals, popovers |
| Special — Glowing | `gold-glow` | Premium callout cards (current period, at-a-glance) |

### 5.3 Rules

- Cards sit at Level 1 by default, rise to Level 2 on hover
- Never use Level 3 on static elements — only interactive overlays
- The gold glow is used sparingly: callout cards and CoverSection header gradient only
- `border border-line` replaces shadow on elements that don't need depth (table rows, section dividers)

---

## 6. Border Radius

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `radius-sm` | 6px | `rounded-md` | Badges, inline code, small chips |
| `radius-md` | 10px | `rounded-lg` | Buttons, inputs, tags |
| `radius-lg` | 14px | `rounded-xl` | Standard cards, panels |
| `radius-xl` | 16px | `rounded-xl2` (existing) | Feature cards |
| `radius-2xl` | 20px | `rounded-2xl` | Premium callout cards |
| `radius-full` | 9999px | `rounded-full` | Pills, status dots |

### Radius Principles

- **Never mix radius sizes within one card family** — pick one size and use it consistently
- Default card: `radius-xl` (16px / `rounded-xl2`)
- Premium callout: `radius-2xl` (20px / `rounded-2xl`)
- Badges and pills: `radius-full` or `radius-sm`
- The report main container: no radius (it's a full-height layout container)

---

## 7. Animation Principles

Animations should feel like a calm breath. The user should notice the result, not the motion.

### 7.1 Tokens

```css
/* Duration */
--duration-instant:  100ms;   /* micro feedback (press, checkbox) */
--duration-fast:     150ms;   /* hover transitions */
--duration-base:     250ms;   /* most UI transitions */
--duration-slow:     350ms;   /* page reveals, accordion */
--duration-slower:   500ms;   /* hero reveals, chart load */

/* Easing */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);    /* standard — like iOS spring */
--ease-out:     cubic-bezier(0, 0, 0.2, 1);       /* enters from off-screen */
--ease-in:      cubic-bezier(0.4, 0, 1, 1);       /* exits to off-screen */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* very subtle bounce — use once */
```

### 7.2 Standard Animations

```css
/* Already in config — keep */
@keyframes fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}

/* Add: scale reveal */
@keyframes scale-up {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}

/* Add: slide from bottom */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Add: staggered list reveal */
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 7.3 Interaction States

| Element | Default → Hover | Duration |
|---|---|---|
| Card | Level 1 shadow → Level 2, translateY -2px | 150ms ease |
| Button | opacity 1 → 0.9, scale 1 → 0.99 on press | 100ms |
| Planet card | Border gold/30 → gold/60, shadow lift | 150ms |
| Nav link | opacity 0.7 → 1 | 150ms |
| Accordion | height 0 → auto, opacity 0 → 1 | 250ms ease-out |
| Section | fade + slide-up on mount | 350ms ease-out |

### 7.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Planet Visual Language

Each of the nine Grahas has a unique visual identity that must remain **consistent across every component** where that planet appears: planet cards, dasha timeline, at-a-glance cards, cover facts, strength table.

### 8.1 Identity Map

#### ☀ Sun
- **Glow**: `#d4973b` / **Soft**: `#e8b96a` / **Card BG**: `#1c1508`
- **Visual symbol**: Radial lines emanating from a central dot (no emoji) — an SVG sun mark
- **Texture**: Warm amber. Think morning light through honey glass.
- **Personality**: Authority. Confidence. The centre.
- **Typography treatment**: Name in amber-gold, bold. Role in muted.

#### ☽ Moon
- **Glow**: `#9ba8c8` / **Soft**: `#c0cae0` / **Card BG**: `#10121e`
- **Visual symbol**: Thin crescent — pure geometry, no filling
- **Texture**: Cool silver-blue gradient. Reflective, not bright.
- **Personality**: Calm. Fluid. Introspective.

#### ♂ Mars
- **Glow**: `#c94444` / **Soft**: `#e07070` / **Card BG**: `#1e0e0e`
- **Visual symbol**: Upward-pointing arrow (energy, direction)
- **Texture**: Deep crimson. Sharp, not orange.
- **Personality**: Direct. Powerful. Urgent.

#### ☿ Mercury
- **Glow**: `#4aad7a` / **Soft**: `#6dcc96` / **Card BG**: `#0c1a12`
- **Visual symbol**: Horizontal lines (communication waves / signal)
- **Texture**: Clear emerald-green. Intelligent, not neon.
- **Personality**: Quick. Analytical. Adaptive.

#### ♃ Jupiter
- **Glow**: `#c8a048` / **Soft**: `#e0bc72` / **Card BG**: `#1c1606`
- **Visual symbol**: Crescent atop a cross (traditional ♃ simplified)
- **Texture**: Warm amber-gold. Regal, not ostentatious.
- **Personality**: Generous. Wise. Expansive.

#### ♀ Venus
- **Glow**: `#c45c84` / **Soft**: `#dc82a8` / **Card BG**: `#1e0e16`
- **Visual symbol**: Circle above a small cross (classic ♀ minimal)
- **Texture**: Rose-pink. Elegant, not candy.
- **Personality**: Beautiful. Harmonious. Refined.

#### ♄ Saturn
- **Glow**: `#4c72b0` / **Soft**: `#7898cc` / **Card BG**: `#0e1220`
- **Visual symbol**: Cross above a crescent (traditional ♄)
- **Texture**: Cool slate-blue. Austere, not depressive.
- **Personality**: Structured. Patient. Enduring.

#### ☊ Rahu (North Node)
- **Glow**: `#7060d8` / **Soft**: `#9880f0` / **Card BG**: `#100e20`
- **Visual symbol**: Ascending arc / half circle open at bottom
- **Texture**: Deep indigo-violet. Mysterious, not garish.
- **Personality**: Obsessive. Innovative. Shadow side.

#### ☋ Ketu (South Node)
- **Glow**: `#8a7a9e` / **Soft**: `#b0a0c4` / **Card BG**: `#120e18`
- **Visual symbol**: Descending arc / comet tail — Rahu's inverse
- **Texture**: Soft mauve. Ethereal, minimal.
- **Personality**: Detached. Spiritual. Past.

### 8.2 SVG Symbol System

All symbols: 24×24 viewBox, stroke-width 1.5, no fill (outline only), `currentColor`.
No external icon libraries. All symbols are hand-crafted SVG primitives in `/src/components/ui/icons/planets/`.

### 8.3 Planet Card Anatomy

```
┌─────────────────────────────────────────────┐
│  [symbol]  PLANET NAME        [dignity badge]│
│            Role · keywords                   │
├─────────────────────────────────────────────┤
│  Sign · House                               │
│  Nakshatra · Pada                           │
├─────────────────────────────────────────────┤
│  ▸ Expand for source-backed reading         │
└─────────────────────────────────────────────┘
```

Card background: planet `bg` token with subtle radial gradient toward the `glow` token.
Card border: `border border-line` default, `border-[planet-glow]/40` on hover/expanded.

---

## 9. Component Library

All components must be in `/src/components/ui/`. No one-off styled divs in feature components.

### 9.1 Button

**Variants**: `primary` · `secondary` · `ghost` · `danger` · `outline`
**Sizes**: `sm` (h-7, px-3) · `md` (h-9, px-4) · `lg` (h-11, px-5)

```
primary:   bg-gold text-bg hover:bg-gold-soft — used for CTAs
secondary: bg-panel-soft border border-line text-ink — used for secondary actions
ghost:     transparent text-ink-muted hover:text-ink — used for tertiary actions
danger:    bg-danger/20 text-danger border border-danger/30 — used for destructive
outline:   transparent border border-gold/50 text-gold — used for premium CTAs
```

### 9.2 Card

**Variants**: `default` · `elevated` · `bordered` · `premium`

```
default:   bg-panel-soft border border-line rounded-xl2
elevated:  bg-panel-soft border border-line rounded-xl2 shadow-neu-sm
bordered:  bg-panel-soft border-2 border-line rounded-xl2
premium:   bg-gradient-to-br from-[#1a1730] to-panel border border-gold/30 rounded-2xl
           + 3px gold top accent strip
```

### 9.3 Planet Card

Extends `Card`. Adds:
- Planet-specific background tint (planet `bg` token)
- Planet symbol (SVG) in top-left
- Planet glow color for dignity badge border
- Expandable evidence section with smooth height animation

### 9.4 Badge / Status Badge

**Variants**: `positive` · `negative` · `warning` · `neutral` · `pending` · `active` · `current`

```
positive: bg-good/15 text-good border border-good/20
negative: bg-danger/15 text-danger border border-danger/20
warning:  bg-warn/15 text-warn border border-warn/20
neutral:  bg-ink-muted/10 text-ink-muted border border-line
pending:  bg-panel text-ink-muted/60 border border-line border-dashed
active:   bg-accent/15 text-accent border border-accent/25
current:  bg-gold/15 text-gold border border-gold/25
```

Size: `sm` — `text-[10px] px-1.5 py-px rounded-full`
Size: `md` — `text-[11px] px-2 py-0.5 rounded-md`

### 9.5 Confidence / Source Quality Badge

Three tiers with dot indicator:
```
High (≥0.8):   green dot, "Source quality: High"
Medium (≥0.5): amber dot, "Source quality: Medium"
Low (<0.5):    red dot,   "Source quality: Low"
```

### 9.6 Section Shell

Numbered report section with gold heading.

```
[number]  ────────────────────────────
Section Title
Optional subtitle
────────────────── (content below)
```

Scroll offset: `scroll-mt-24` (existing — keep).
Section number: `font-mono text-[10px] text-ink-muted`.
Title: `heading-xl` in `gold`.
Subtitle: `body-sm` in `ink-muted`.

### 9.7 Accordion

Premium collapsible. Used for life area findings.

```
[direction indicator dot] Title                  [chevron ↓]
  Subtitle / tags
───────────────────────
  Content (animated height: 0 → auto)
  Citations, evidence
```

- Direction dot: `good` (positive), `danger` (negative), `line` (neutral)
- Height animation: 250ms ease-out
- Chevron: rotates 0° → 180° on open (150ms)
- First 2 accordions default-open in life area sections

### 9.8 Evidence Card

Displays a verbatim KB rule.

```
[rule-id badge] Book · Ch.N v.N  [● Source quality: High]
────────────────────────────────────────────────────────
"Verbatim rule text from classical source..."
[tag] [tag] [tag]
```

### 9.9 Citation Card

Displays a primary source reference.

```
BOOK · Ch.N verse.N · Tradition
"Verbatim quoted text..."
```

### 9.10 Glossary Card

Compact term definition.

```
Term
Definition in plain English. → See also: [related term]
```

### 9.11 Summary / At-a-Glance Card

Extends `Card (premium)`. Already implemented in AtAGlanceSection.

```
EYEBROW LABEL
───────────────────────────────
Large Primary Value

Sub-information
Date range / secondary detail

Short description
───────────────────────────────
Provenance note             Learn more →
```

### 9.12 Tooltip

Appears on hover/focus. Premium dark style.

```
[small arrow]
◉ Short tooltip text
```

Styles: `bg-panel-raised border border-line rounded-md shadow-lg text-body-sm`
Animation: fade-in 150ms

### 9.13 Divider

```
Decorative: <div className="h-px bg-line" />
With label:  ─── LABEL ────────────────────
```

### 9.14 Tabs

Navigation tabs (for report sections in mobile/compact view).

```
[Tab 1]  [Tab 2 active]  [Tab 3]
─────────────────────────────────
Content area
```

Active tab: `border-b-2 border-gold text-gold`
Inactive: `text-ink-muted hover:text-ink`

### 9.15 SectionAccordion Sub-heading

Currently renders with gold treatment, looking like main heading. Fix: use `heading-md` in `ink-muted`, not in `gold`. Main section headings are the only gold headings.

---

## 10. CSS Architecture

### 10.1 Folder Structure

```
styles/
├── tokens/
│   ├── colors.css          # --color-* custom properties
│   ├── typography.css      # --font-*, --text-*, --leading-*, --tracking-*
│   ├── spacing.css         # --space-* scale
│   ├── radius.css          # --radius-* tokens
│   ├── shadows.css         # --shadow-neu-*, --shadow-gold-glow
│   ├── animations.css      # @keyframes + --duration-*, --ease-*
│   └── themes.css          # Dark/light theme overrides, print overrides
├── components/
│   ├── button.css          # .hh-btn variants
│   ├── card.css            # .hh-card variants
│   ├── badge.css           # .hh-badge variants
│   ├── accordion.css       # .hh-accordion + height animation
│   ├── planet-card.css     # .hh-planet-card + per-planet modifiers
│   ├── timeline.css        # .hh-timeline (dasha bar)
│   ├── evidence-card.css   # .hh-evidence-card
│   ├── section.css         # .hh-section (SectionShell)
│   ├── tooltip.css         # .hh-tooltip
│   └── summary-card.css    # .hh-summary-card (AtAGlance cards)
└── utilities/
    ├── layout.css          # Max-width containers, report grid
    ├── grid.css            # Responsive grid helpers
    └── helpers.css         # Reduced motion, print helpers, a11y
```

### 10.2 Integration with Tailwind

Strategy: **Tailwind for layout/spacing utilities, CSS custom properties for all visual tokens.**

- No hardcoded hex values in JSX (e.g., `text-[#cfd0dd]` → token)
- Token `#cfd0dd` (current secondary text) is not in the config — it should be added as `ink-secondary` or handled by `text-[#cfd0dd]` should be migrated to `text-ink`
- All new planet classes added to Tailwind config via `theme.extend`
- Component-specific classes use the `hh-` prefix to avoid Tailwind conflicts

### 10.3 No Magic Numbers Rule

Current violations to fix (gradually):
- `text-[#cfd0dd]` — should be `text-ink` (near-identical)
- `text-[10px]`, `text-[11px]`, etc. — should use `eyebrow`, `label-md` utilities
- `px-[3px]`, `py-[2px]` — sub-pixel values should use `px-px` or `p-0.5`
- `from-[#1a1730]` — should become `from-panel-deep` or a named token

---

## 11. Naming Conventions

### CSS Custom Properties
`--{category}-{variant}[-{sub}]`

Examples: `--color-gold`, `--shadow-neu-sm`, `--duration-fast`, `--ease-default`

### Tailwind Extensions
Match the CSS property name:
`gold` → `text-gold`, `bg-gold`, `border-gold`
`neu-sm` → `shadow-neu-sm`
`planet-sun-glow` → `text-planet-sun-glow`, `bg-planet-sun-bg`

### Component Classes (hh- prefix)
`hh-{component}[-{variant}][-{size}]`

Examples: `hh-card`, `hh-card-premium`, `hh-btn-primary-md`, `hh-planet-card-sun`

### File Names
- React components: `PascalCase.tsx` — `PlanetCard.tsx`, `EvidenceCard.tsx`
- CSS files: `kebab-case.css` — `planet-card.css`, `evidence-card.css`
- Hooks: `camelCase.ts` — `usePlanetColor.ts`
- Constants: `SCREAMING_SNAKE_CASE` — `PLANET_ROLE`, `DIGNITY_CONFIG`
- Types: `PascalCase` — `PlanetName`, `DignityConfig`

---

## 12. Responsive Rules

### Breakpoints (keep existing Tailwind defaults)

| Name | Min-width | Primary target |
|---|---|---|
| `sm` | 640px | Large phone (landscape) / tablet portrait |
| `md` | 768px | Tablet landscape |
| `lg` | 1024px | Small desktop |
| `xl` | 1280px | Standard desktop |
| `2xl` | 1536px | Ultra-wide |

### Layout Rules

**Report page** (existing max-width 800px — keep):
- Mobile: single column, `px-4`
- Desktop: centered 800px, `px-4`

**Home page** (new):
- Mobile: single column, `px-4`, large touch targets
- Tablet: 2-col features grid
- Desktop: 3-col features grid, large hero

**Planet cards**:
- Mobile: 2 columns (existing `grid-cols-2`)
- Desktop: 3 columns (existing `sm:grid-cols-3`)

**At-a-Glance cards**:
- Mobile: 1 column (existing `grid-cols-1`)
- Desktop: 2 columns (existing `sm:grid-cols-2`)

**Dasha timeline bar**: horizontal scroll on mobile — add `overflow-x-auto` wrapper

**Tables**: all wide tables need horizontal scroll container on mobile, never shrink text below `body-sm`

### Mobile Rules

- Minimum tap target: 44×44px (buttons, nav items, accordion triggers)
- No horizontal scrolling at viewport level
- Navigation: horizontal scroll chips (already implemented with `no-scrollbar`)
- All cards: full-width on mobile

---

## 13. Accessibility

### Contrast Requirements

| Text type | Min ratio | Current status |
|---|---|---|
| Primary text (`ink` on `bg`) | 7:1 | ✓ Pass (~14:1) |
| Secondary text (`ink-muted` on `bg`) | 4.5:1 | ✓ Pass (~6:1) |
| Gold text on dark panel | 4.5:1 | ✓ Pass |
| Planet text on planet-bg | 4.5:1 | Must verify for each |
| Small text (< 14px) | 4.5:1 | Must audit |

### Keyboard Navigation

- All interactive elements reachable by Tab
- Accordion: Space/Enter to toggle, arrow keys to navigate between
- Cards with expand: keyboard toggle via button element (not div)
- Navigation: tab through nav items
- Focus ring: `focus-visible:ring-2 ring-gold/60` (not hidden)

### Semantic HTML

- One `<h1>` per page
- SectionShell uses `<h2>` (correct — keep)
- Card headings: `<h3>` or `<p>` depending on context
- Lists: `<ul>`/`<li>` for evidence lists, citation lists
- `<table>` for tabular data (existing — keep)
- `aria-expanded` on accordion triggers
- `aria-label` on icon-only buttons

---

## 14. Print Mode

Existing print styles in `globals.css` — keep and extend.

### Print Hierarchy

1. Remove decorative background (gradient, panel backgrounds) ✓ existing
2. All text → near-black (`#1a1a2e`) ✓ existing
3. Borders → gray (`#d1d5db`) ✓ existing
4. Print margin: 18mm × 16mm ✓ existing
5. Section breaks: `break-inside: avoid` ✓ existing

### Print Enhancements Needed

- Accordions: expand all on print (`details[open]` or CSS `:not([hidden])`)
- Dasha bar: convert gradient colors to grayscale patterns or hide
- Planet card backgrounds: white, planet color as left border accent only
- AtAGlance cards: white background, gold accent → amber text only
- Remove all `hover:`, `transition-`, animation classes
- Evidence cards: preserve verbatim text, clean border
- "Learn more" links: hide on print (content is already visible on page)

---

## 15. Implementation Roadmap

Work one task at a time. Typecheck + lint + tests after each.

### Phase 1 — Token Foundation (before any visual changes)

1. Add planet color palette to `tailwind.config.ts`
2. Add new shadow tokens to Tailwind config + globals.css
3. Add `ink-subtle`, `gold-dim`, `panel-raised` color tokens
4. Add new animation keyframes (`scale-up`, `slide-up`)
5. Add Geist font (if approved)
6. Create `/styles/` folder structure with token files

### Phase 2 — Home Page Redesign

1. Hero section — editorial H1, subtitle, CTA button
2. Feature cards section — 3 features with icons
3. Form section — birth input form with premium styling
4. Footer

### Phase 3 — Component Upgrades (report page)

1. Planet cards — per-planet color + symbol + hover animation
2. Badges — standardize all status/confidence badges
3. Accordion — smooth height animation + direction indicator dot
4. Evidence cards — clean layout
5. Section Shell — subtle animation on scroll-into-view

### Phase 4 — Report Page Polish

(Continue existing audit improvements #4–#20)

### Phase 5 — CSS Architecture Migration

- Move inline color values to tokens
- Create `hh-` component classes where beneficial
- Audit and eliminate magic numbers

---

## Approval Checklist

Before implementation begins, confirm:

- [ ] Color palette approved (especially planet colors)
- [ ] Typography scale approved (Geist font or system font?)
- [ ] Elevation/shadow system approved
- [ ] Planet symbol approach approved (custom SVG vs text symbols)
- [ ] CSS architecture approach approved (new `/styles/` folder)
- [ ] Implementation roadmap sequence approved

---

*HoraHub Design System v1.0 — prepared 2026-07-01*
*Backend is frozen. This document governs all frontend changes going forward.*
