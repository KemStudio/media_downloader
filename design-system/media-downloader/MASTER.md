# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/media-downloader/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Media Downloader
**Generated:** 2026-11-12
**Category:** Admin tool / media utility
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 8/10 (Dense / Dashboard)

---

## Locked product decisions

- Visual: Light minimal professional (no dark mode toggle)
- Language: English only (`lang="en"`)
- Stack: EJS + Tailwind CSS 4 + DaisyUI 5 theme `mdlight`
- Icons: Outline SVG via `partials/icon.ejs` and `public/js/icons.js` (Phosphor-style stroke)
- Scope: Visual/UX only — no API/auth logic changes

## Global Rules

### Color Palette

| Role | Hex | Token / DaisyUI |
|------|-----|-----------------|
| Primary (slate/navy) | `#1E3A5F` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-primary-content` |
| Accent (emerald) | `#059669` | `--color-accent` / success |
| Background | `#F8FAFC` | `--color-base-200` |
| Card / surface | `#FFFFFF` | `--color-base-100` |
| Border | `#E2E8F0` | `--color-base-300` |
| Foreground | `#0F172A` | `--color-base-content` |
| Destructive | `#DC2626` | `--color-error` |

**Anti-patterns:** DaisyUI default purple, dark-first chrome, emoji-as-icons.

### Typography

- **UI font:** Plus Jakarta Sans (400–700)
- **Hierarchy:** `md-page-title` (xl/semibold) + `md-page-desc` (sm/muted)
- **Google Fonts:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`

### Spacing (dense admin)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-sm` | `4px` | Icon gaps |
| `--space-md` | `8px` | Inline control gaps |
| `--space-lg` | `12–16px` | Section padding |
| `--space-xl` | `20–24px` | Page block gaps |

### Icons

- Decorative beside text: `aria-hidden="true"`
- Icon-only controls: `aria-label` on the control
- Sizes: `sm` 16 / `md` 20 / `lg` 24
- Stroke: 1.75

| Action / nav | Icon name |
|--------------|-----------|
| Home | `house` |
| Accounts | `users` |
| Sessions | `devices` |
| Change password | `key` |
| Sign out | `sign-out` |
| Sign in | `sign-in` |
| Create account | `user-plus` |
| Pagination | `caret-left` / `caret-right` |
| Active / Deactive / Hide | `check-circle` / `pause-circle` / `eye-slash` |
| Delete | `trash` |

### Shell UX

- Top navbar: brand mark + product name; user menu with Key / Devices / Sign out
- Sidebar: Home, Accounts (admin), Sessions
- Content: page header + dense surfaces (`md-surface`)

### Motion

- Subtle only (150–250ms hover/focus)
- Respect `prefers-reduced-motion`

### Pre-Delivery Checklist

- [x] No emojis as icons
- [x] Consistent outline SVG family
- [x] English-only UI copy
- [x] Visible `:focus-visible`
- [x] Light contrast primary text on white/slate surfaces
- [ ] Visual check at 375 / 768 / 1024
