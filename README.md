# Abundios Cleaning — Brand & UI Design System

Reference for colors, typography, logos and iconography used across the Abundios
Cleaning web properties (marketing landing, login, client portal, staff dashboard).
The **landing page is the source of truth** — any new surface should pull from
this palette and these tokens, not invent its own.

---

## 1. Color Palette

### 1.1 Primary

| Token | HEX | RGB | Pantone (approx.) | Usage |
|---|---|---|---|---|
| `--red` | `#E90A46` | `233, 10, 70` | **PMS 1925 C** | Primary CTA, accents, brand color. The single hero color. |
| `--red-dk` | `#C20839` | `194, 8, 57` | **PMS 199 C** | Hover state for primary buttons, deep brand accent. |
| `--red-lt` | `#FDE8EE` | `253, 232, 238` | **PMS 705 C** (tint) | Chip / badge backgrounds, soft accents, icon containers. |

### 1.2 Neutrals

| Token | HEX | RGB | Pantone (approx.) | Usage |
|---|---|---|---|---|
| `--text` | `#111827` | `17, 24, 39` | **PMS Black 6 C** | Body and heading text. Default ink. |
| `--gray` | `#6D7378` | `109, 115, 120` | **PMS Cool Gray 9 C** | Secondary text, secondary icon strokes. |
| `--muted` | `#6B7280` | `107, 114, 128` | **PMS Cool Gray 9 C** | Captions, helper text, subtle labels. |
| `--border` | `#E5E7EB` | `229, 231, 235` | **PMS Cool Gray 1 C** | Borders, dividers, card outlines. |
| `--bg-alt` | `#F9FAFB` | `249, 250, 251` | **Pantone White** (tint) | Alternating section background, soft surface. |
| `--white` | `#FFFFFF` | `255, 255, 255` | **Pantone White** | Page background, card surface. |

### 1.3 Accents

| Token | HEX | RGB | Pantone (approx.) | Usage |
|---|---|---|---|---|
| `Gold` | `#FFD700` | `255, 215, 0` | **PMS 116 C** | Filled stars (5.0 rating), "Deep Cleaning" sparkles, hero float "Satisfaction Guaranteed" sparkles. Reserved for premium/quality cues. |

### 1.4 Deprecated (do not use)

The `--pink-*` tokens in `style.css` (`--pink-dark`, `--pink-light`, `--pink`) are
legacy. They predate the unified red palette and should not be used in new
surfaces. The login page background should be `var(--bg-alt)` (off-white),
not the pale pink.

### 1.5 Pantone caveat

Pantone is a spot-color system (printed inks); HEX is screen-rendered RGB.
Direct conversion is always approximate. Use the Pantone codes above when
producing print collateral (business cards, vehicle wraps, flyers) and treat
them as the closest match, not an exact equal.

---

## 2. Typography

Two-font system, loaded from Google Fonts.

| Family | Role | Weights loaded | Notes |
|---|---|---|---|
| **Playfair Display** | Headings (`h1`, `h2`, `h3`), large display numerals | 600, 700, 600 italic | Elegant serif, used for editorial feel. Italic only for emphasized words ("Abundant Life"). |
| **Inter** | Body text, buttons, labels, all UI | 400, 500, 600, 700 | Modern sans-serif, set as `body` default. |

### Sample hierarchy

| Element | Family | Size | Weight | Color |
|---|---|---|---|---|
| Hero `h1` | Playfair Display | 3.7rem | 700 | `--text` |
| Section `h2` | Playfair Display | 2.4rem | 700 | `--text` |
| Card `h3` | Playfair Display | 1.25rem | 700 | `--text` |
| Body / paragraph | Inter | 1rem | 400 | `--text` (line-height 1.6) |
| Chip / badge | Inter | 0.78rem | 500 | `--muted` or `--red` |
| Button | Inter | 1rem | 600 | white on `--red` |

System fallback stacks: `'Playfair Display', Georgia, serif` and
`'Inter', system-ui, sans-serif`.

---

## 3. Logos

All logo assets live in `frontend/`. Use the existing files — do not redraw.

| File | When to use |
|---|---|
| `frontend/wordmark.svg` | Full "Abundios Cleaning" wordmark. Default on light backgrounds (nav, footer). Aspect 4:1 — size by height (typical: 26 – 44 px). |
| `frontend/logo.svg` | Stand-alone icon mark (no text). Use when space is tight or wordmark would be illegible. |
| `frontend/favicon.svg` | Browser tab favicon. White "A" on red rounded square. Do not use elsewhere. |

### Color treatment

- **Default**: brand red (`#E90A46`) — leave the SVG as-is. Use this whenever the wordmark is itself an action (clickable link back to the site) or a brand statement.
- **On dark background**: invert to white via CSS `filter: brightness(0) invert(1);` (with optional `opacity: 0.7` for hierarchy). See footer in `index.html`.
- **Subtle / muted gray**: `filter: brightness(0) opacity(0.5);` — only for purely decorative, non-interactive contexts where the wordmark should recede (e.g. a watermark). Do not use for clickable navigation — that should stay in brand red so the affordance reads as an action.

### Cross-domain usage

The login page is served from `app.abundioscleaning.com` but logo assets live in
the marketing site root. From subdomains, always reference logos by absolute URL
(`https://abundioscleaning.com/wordmark.svg`) to avoid broken images.

---

## 4. Iconography

**Library**: [Lucide](https://lucide.dev) — included via CDN
(`<script src="https://unpkg.com/lucide@latest" defer></script>`).

Use lucide for **all** new icons. Do not mix emoji or inline custom SVGs into
new UI. The Instagram footer icon and login chevron were migrated to Lucide
for consistency.

### Usage pattern

```html
<i data-lucide="icon-name"></i>
```

Then call `lucide.createIcons()` once after `DOMContentLoaded`. Lucide replaces
each `<i>` with an inline `<svg class="lucide lucide-{name}">` that inherits
`color` via `stroke="currentColor"` — color icons by setting the CSS `color`
on the parent.

### Current icon mapping (landing page)

| Context | Lucide name | Color |
|---|---|---|
| Hero badge "Charlottesville, VA" | `map-pin` | inherits `--red` (badge color) |
| Chip "5.0 Rating" | `star` | Gold `#FFD700`, filled |
| Chip "100+ Clients" | `home` | inherits `--muted` |
| Chip "Eco-Friendly" | `leaf` | inherits `--muted` |
| Hero float "Satisfaction Guaranteed" | `sparkles` | Gold `#FFD700`, filled |
| Service card "General Cleaning" | `home` | `--red` |
| Service card "Deep Cleaning" | `sparkles` | Gold `#FFD700`, filled |
| Service card "2-Hour Cleaning" | `clock` | `--red` |
| About checklist | `check` | `--red`, stroke-width 3 |
| Footer phone | `phone` | white (on dark footer) |
| Footer email | `mail` | white |
| Footer Instagram | `instagram` | white |
| Login navbar back arrow | `chevron-left` | `--red` (paired with red wordmark — it's a clickable action) |

### Sizing convention

| Context | Size | Stroke width |
|---|---|---|
| Inline with body text (chip, badge) | 14 px | 2.25 |
| Filled circle accent (`.chk`) | 13 px | 3 |
| Footer contact row | 16 px | 2 |
| Standalone icon container (card, float) | 28 px | 2 |
| Navbar back arrow (login) | 26 px | 2.5 |

---

## 5. Quick design checklist for new surfaces

- [ ] Background is `--white` or `--bg-alt` — **never** the legacy pink.
- [ ] Primary action is a solid `--red` button, white text, fully rounded.
- [ ] Headings use Playfair Display; everything else uses Inter.
- [ ] Wordmark is loaded from `https://abundioscleaning.com/wordmark.svg`.
- [ ] All icons are Lucide, rendered via `data-lucide="..."`.
- [ ] Stars and "premium" sparkles are `#FFD700` filled — nothing else gets gold.
