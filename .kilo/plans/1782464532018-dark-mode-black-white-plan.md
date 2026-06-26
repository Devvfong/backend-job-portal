# Dark Mode Black/White Theme Plan

## Goal
Replace dark green theme with pure black/white aesthetic in `job-portal-ui/app/globals.css`.

## Current State
Dark mode uses dark green palette (lines 42-75):
- Background: `#0d1a12` / `#0b190f`
- Primary: `#4eb168` (green)
- Surfaces: various dark greens

## Target Colors

### Core variables
| Variable | Light | Dark |
|----------|-------|------|
| `--bg` | `#EAE4D8` | `#000000` |
| `--surface` | `#F0EBE2` | `#111111` |
| `--border` | `#D9D2C4` | `#333333` |
| `--text` | `#2C3A30` | `#ffffff` |
| `--text-muted` | `#5A8A6A` | `#b0b0b0` |
| `--text-subtle` | `#6F7D72` | `#888888` |
| `--primary` | `#4A9460` | `#ffffff` |
| `--primary-hover` | `#3D7A4F` | `#e0e0e0` |
| `--accent` | `#5BAF72` | `#ffffff` |

### shadcn compat variables
| Variable | Dark Value |
|----------|------------|
| `--background` | `#000000` |
| `--foreground` | `#ffffff` |
| `--card` | `#111111` |
| `--card-foreground` | `#ffffff` |
| `--secondary` | `#1a1a1a` |
| `--input` | `#1a1a1a` |

### Effects
| Variable | Dark Value |
|----------|------------|
| `--glow` | `rgba(255,255,255,0.04)` |
| `--grid-line` | `rgba(255,255,255,0.12)` |
| `--ring` | `#ffffff` |

## Files to Modify
- `app/globals.css` lines 42-75 (`.dark` block)

## Validation
- `npm run lint` on frontend
- `npm run build` to verify no CSS errors