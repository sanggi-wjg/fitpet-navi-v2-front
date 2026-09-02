---
version: alpha
name: Claude-design-analysis
description: A warm-canvas editorial interface for Anthropic's Claude product. The system anchors on a tinted cream canvas with serif display headlines, warm coral CTAs, and dark navy product surfaces (code editor mockups, model showcase cards). Brand voltage comes from the cream/coral pairing — deliberately warm and humanist where most AI brands use cool blue + slate. Type voice runs a slab-serif display ("Copernicus" / Tiempos Headline) for h1/h2 and a humanist sans for body. The signature Anthropic black-radial-spike mark anchors the wordmark.

colors:
  primary: '#cc785c'
  primary-active: '#a9583e'
  primary-disabled: '#e6dfd8'
  ink: '#141413'
  body: '#3d3d3a'
  body-strong: '#252523'
  muted: '#6c6a64'
  muted-soft: '#8e8b82'
  hairline: '#e6dfd8'
  hairline-soft: '#ebe6df'
  canvas: '#faf9f5'
  surface-soft: '#f5f0e8'
  surface-card: '#efe9de'
  surface-cream-strong: '#e8e0d2'
  surface-dark: '#181715'
  surface-dark-elevated: '#252320'
  surface-dark-soft: '#1f1e1b'
  on-primary: '#ffffff'
  on-dark: '#faf9f5'
  on-dark-soft: '#a09d96'
  accent-teal: '#5db8a6'
  accent-amber: '#e8a55a'
  success: '#5db872'
  warning: '#d4a017'
  error: '#c64545'

typography:
  display-xl:
    fontFamily: 'Copernicus, Tiempos Headline, serif'
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -1.5px
  display-lg:
    fontFamily: 'Copernicus, Tiempos Headline, serif'
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1px
  display-md:
    fontFamily: 'Copernicus, Tiempos Headline, serif'
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.5px
  display-sm:
    fontFamily: 'Copernicus, Tiempos Headline, serif'
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.3px
  title-lg:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 1.5px
  code:
    fontFamily: 'JetBrains Mono, ui-monospace, monospace'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: 'StyreneB, Inter, sans-serif'
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.button}'
    rounded: '{rounded.md}'
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: '{colors.primary-active}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
  button-primary-disabled:
    backgroundColor: '{colors.primary-disabled}'
    textColor: '{colors.muted}'
    rounded: '{rounded.md}'
  button-secondary:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.button}'
    rounded: '{rounded.md}'
    padding: 12px 20px
    height: 40px
  button-secondary-on-dark:
    backgroundColor: '{colors.surface-dark-elevated}'
    textColor: '{colors.on-dark}'
    typography: '{typography.button}'
    rounded: '{rounded.md}'
    padding: 12px 20px
  button-text-link:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    typography: '{typography.button}'
  button-icon-circular:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    rounded: '{rounded.full}'
    size: 36px
  text-link:
    backgroundColor: transparent
    textColor: '{colors.primary}'
    typography: '{typography.body-md}'
  top-nav:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.nav-link}'
    height: 64px
  hero-band:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.display-xl}'
    padding: 96px
  hero-illustration-card:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    rounded: '{rounded.xl}'
  feature-card:
    backgroundColor: '{colors.surface-card}'
    textColor: '{colors.ink}'
    typography: '{typography.title-md}'
    rounded: '{rounded.lg}'
    padding: 32px
  product-mockup-card-dark:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.on-dark}'
    typography: '{typography.title-md}'
    rounded: '{rounded.lg}'
    padding: 32px
  code-window-card:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.on-dark}'
    typography: '{typography.code}'
    rounded: '{rounded.lg}'
    padding: 24px
  model-comparison-card:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.title-md}'
    rounded: '{rounded.lg}'
    padding: 32px
  pricing-tier-card:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.title-lg}'
    rounded: '{rounded.lg}'
    padding: 32px
  pricing-tier-card-featured:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.on-dark}'
    typography: '{typography.title-lg}'
    rounded: '{rounded.lg}'
    padding: 32px
  callout-card-coral:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.title-md}'
    rounded: '{rounded.lg}'
    padding: 32px
  connector-tile:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.title-sm}'
    rounded: '{rounded.lg}'
    padding: 20px
  text-input:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    typography: '{typography.body-md}'
    rounded: '{rounded.md}'
    padding: 10px 14px
    height: 40px
  text-input-focused:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
  cookie-consent-card:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.on-dark}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.lg}'
    padding: 24px
  category-tab:
    backgroundColor: transparent
    textColor: '{colors.muted}'
    typography: '{typography.nav-link}'
    padding: 8px 14px
    rounded: '{rounded.md}'
  category-tab-active:
    backgroundColor: '{colors.surface-card}'
    textColor: '{colors.ink}'
    typography: '{typography.nav-link}'
    rounded: '{rounded.md}'
  badge-pill:
    backgroundColor: '{colors.surface-card}'
    textColor: '{colors.ink}'
    typography: '{typography.caption}'
    rounded: '{rounded.pill}'
    padding: 4px 12px
  badge-coral:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.caption-uppercase}'
    rounded: '{rounded.pill}'
    padding: 4px 12px
  cta-band-coral:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.display-sm}'
    rounded: '{rounded.lg}'
    padding: 64px
  cta-band-dark:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.on-dark}'
    typography: '{typography.display-sm}'
    rounded: '{rounded.lg}'
    padding: 64px
  footer:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.on-dark-soft}'
    typography: '{typography.body-sm}'
    padding: 64px
---

> **Navi v2 디자인 시스템 — 출처 및 상태**
>
> - 원문: [getdesign.md/claude](https://getdesign.md/claude/design-md) (`npx getdesign@latest add claude`, 2026-09-01 수신). 아래 front matter 와 `## Overview` ~ `## Known Gaps` 는 **원문 그대로**이며 수정하지 않는다.
> - 프로젝트 적용 규칙은 문서 끝의 **`## Navi v2 적용 가이드`** 에 있다. 원문과 충돌하면 적용 가이드가 우선한다 (앱 UI 이므로 마케팅 규칙 일부를 재해석함).
> - v1(`fitpet-navi-front`)의 디자인 토큰·유틸·패턴은 **승계하지 않는다**. 이 문서만 참조한다.
> - 토큰은 `{colors.canvas}` 처럼 front matter 키로 참조한다. 코드에서는 §E 의 Tailwind v4 `@theme` 변수명을 쓴다.
> - **화면 목업(Claude Design 캔버스)**: https://claude.ai/code/artifact/7cc77e35-2c68-47c5-b758-227efe4d5c75 — 아트보드 소스는 `docs/design/*.dc.html` + `canvas.json`. 디자인을 바꿀 때는 이 소스를 수정한 뒤 캔버스를 다시 저장한다.

## Overview

Claude.com is the warmest, most editorial interface in the AI-product category. The base atmosphere is a **tinted cream canvas** (`{colors.canvas}` — #faf9f5) — distinctly warm, deliberately not the cool gray-white that every other AI brand uses. Headlines run a **slab-serif display** ("Copernicus" / Tiempos Headline) at weight 400 with negative letter-spacing, paired with **StyreneB / Inter** body sans. The combination feels like a literary publication, not a SaaS marketing page.

Brand voltage comes from the **cream + coral pairing** — coral (`{colors.primary}` — #cc785c) is the signature Anthropic accent, used on every primary CTA, on the brand wordmark, and on full-bleed callout cards. The coral is warm, slightly muted, never cyan/blue — a deliberate counter-positioning against OpenAI's cool slate, Google's saturated blue, and Microsoft's corporate cyan.

The system has three surface modes that alternate page-by-page:

1. **Cream canvas** (`{colors.canvas}`) — default body floor
2. **Light cream cards** (`{colors.surface-card}`) — feature card backgrounds
3. **Dark navy product surfaces** (`{colors.surface-dark}`) — code editor mockups, model showcase cards, pre-footer CTAs, footer itself

The dark surfaces are where Claude shows its product chrome — code blocks, terminal output, model comparison tables, agentic-flow diagrams. The cream-to-dark contrast is the page's pacing rhythm.

**Key Characteristics:**

- Warm cream canvas (`{colors.canvas}` — #faf9f5) with dark warm-ink text (`{colors.ink}` — #141413). The brand's defining color choice.
- Coral primary CTA (`{colors.primary}` — #cc785c). Used scarcely on individual buttons, generously on full-bleed coral callout cards.
- Slab-serif display headlines via Copernicus / Tiempos Headline at weight 400 with negative letter-spacing. Pairs with humanist sans body for a literary editorial voice.
- Dark navy product mockup cards (`{colors.surface-dark}` — #181715) carrying code blocks, terminal panels, model comparison data — the brand shows the product chrome at scale rather than abstract marketing illustrations.
- Light cream feature cards (`{colors.surface-card}` — #efe9de) — slightly darker than canvas, used for content-driven feature explanations.
- Anthropic radial-spike mark — a small black asterisk-like glyph (4-spoke radial) — appears as the brand wordmark prefix and as a content marker.
- Border radius is hierarchical: `{rounded.md}` (8px) for buttons + inputs, `{rounded.lg}` (12px) for content + product cards, `{rounded.xl}` (16px) for the hero illustration container, `{rounded.pill}` for badges.
- Section rhythm `{spacing.section}` (96px) — modern-SaaS standard. Internal card padding stays generous at `{spacing.xl}` (32px).

## Colors

### Brand & Accent

- **Coral / Primary** (`{colors.primary}` — #cc785c): The signature Anthropic warm coral. Used on every primary CTA background, on full-bleed coral callout cards, on the brand wordmark accent. The most-recognized Anthropic color outside of the spike-mark logo.
- **Coral Active** (`{colors.primary-active}` — #a9583e): The press / hover-darker variant.
- **Coral Disabled** (`{colors.primary-disabled}` — #e6dfd8): A desaturated cream-tinted disabled state.
- **Accent Teal** (`{colors.accent-teal}` — #5db8a6): Used sparingly on secondary product surfaces (terminal status indicators, "active connection" dots in connectors page).
- **Accent Amber** (`{colors.accent-amber}` — #e8a55a): A small companion warm-tone used on category badges and inline highlights.

### Surface

- **Canvas** (`{colors.canvas}` — #faf9f5): The default page floor. Tinted cream — warm, deliberately not pure white.
- **Surface Soft** (`{colors.surface-soft}` — #f5f0e8): Section dividers, very-soft band backgrounds.
- **Surface Card** (`{colors.surface-card}` — #efe9de): Feature cards, content cards. One step darker than canvas.
- **Surface Cream Strong** (`{colors.surface-cream-strong}` — #e8e0d2): A strongest-cream variant used on selected category tabs and emphasized section bands.
- **Surface Dark** (`{colors.surface-dark}` — #181715): Code editor mockups, model showcase cards, footer. The dominant dark surface.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #252320): Elevated cards inside dark bands (settings panels in mockups).
- **Surface Dark Soft** (`{colors.surface-dark-soft}` — #1f1e1b): Slightly lighter dark, used for code block backgrounds inside larger dark cards.
- **Hairline** (`{colors.hairline}` — #e6dfd8): The 1px border tone on cream surfaces. Same hex as `{colors.primary-disabled}` — borders feel like one elevation step rather than ink lines.
- **Hairline Soft** (`{colors.hairline-soft}` — #ebe6df): Barely-visible divider used inside the same band.

### Text

- **Ink** (`{colors.ink}` — #141413): All headlines and primary text. Warm dark, slightly off-pure-black.
- **Body Strong** (`{colors.body-strong}` — #252523): Emphasized paragraphs, lead text.
- **Body** (`{colors.body}` — #3d3d3a): Default running-text color.
- **Muted** (`{colors.muted}` — #6c6a64): Sub-headings, breadcrumbs, footer-adjacent secondary text.
- **Muted Soft** (`{colors.muted-soft}` — #8e8b82): Captions, fine-print, copyright lines.
- **On Primary** (`{colors.on-primary}` — #ffffff): Text on coral buttons.
- **On Dark** (`{colors.on-dark}` — #faf9f5): Cream-tinted white used on dark surfaces (echoes the canvas tone).
- **On Dark Soft** (`{colors.on-dark-soft}` — #a09d96): Footer body text, secondary labels in dark mockups.

### Semantic

- **Success** (`{colors.success}` — #5db872): Green status dots, "available" indicators.
- **Warning** (`{colors.warning}` — #d4a017): Warning callouts (rare on marketing surfaces).
- **Error** (`{colors.error}` — #c64545): Validation errors.

## Typography

### Font Family

The system runs **Copernicus** (or **Tiempos Headline** as substitute) as the slab-serif display face for headlines, and **StyreneB** (or **Inter** as substitute) as the humanist sans for body, navigation, and UI labels. **JetBrains Mono** handles code blocks. The fallback stack walks `Tiempos Headline, Garamond, "Times New Roman", serif` for display and `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` for body.

The display/body split is editorial:

- Copernicus serif (weight 400, negative tracking) → h1, h2, h3, hero display
- StyreneB sans (weight 400-500) → body, navigation, buttons, captions, labels
- JetBrains Mono → all code blocks and terminal text

### Hierarchy

| Token                            | Size | Weight | Line Height | Letter Spacing | Use                                                           |
| -------------------------------- | ---- | ------ | ----------- | -------------- | ------------------------------------------------------------- |
| `{typography.display-xl}`        | 64px | 400    | 1.05        | -1.5px         | Homepage h1 ("Meet your thinking partner") — Copernicus serif |
| `{typography.display-lg}`        | 48px | 400    | 1.1         | -1px           | Section heads — Copernicus                                    |
| `{typography.display-md}`        | 36px | 400    | 1.15        | -0.5px         | Sub-section heads, model names — Copernicus                   |
| `{typography.display-sm}`        | 28px | 400    | 1.2         | -0.3px         | Pricing tier names, callout headlines — Copernicus            |
| `{typography.title-lg}`          | 22px | 500    | 1.3         | 0              | Pricing plan size labels — StyreneB                           |
| `{typography.title-md}`          | 18px | 500    | 1.4         | 0              | Feature card titles, intro paragraphs                         |
| `{typography.title-sm}`          | 16px | 500    | 1.4         | 0              | Connector tile titles, list labels                            |
| `{typography.body-md}`           | 16px | 400    | 1.55        | 0              | Default running-text — StyreneB                               |
| `{typography.body-sm}`           | 14px | 400    | 1.55        | 0              | Footer body, fine-print                                       |
| `{typography.caption}`           | 13px | 500    | 1.4         | 0              | Badge labels, captions                                        |
| `{typography.caption-uppercase}` | 12px | 500    | 1.4         | 1.5px          | Category tags, "NEW" badges                                   |
| `{typography.code}`              | 14px | 400    | 1.6         | 0              | Code blocks — JetBrains Mono                                  |
| `{typography.button}`            | 14px | 500    | 1.0         | 0              | Standard button labels                                        |
| `{typography.nav-link}`          | 14px | 500    | 1.4         | 0              | Top-nav menu items                                            |

### Principles

Display sizes use weight 400 (regular), never bold. Negative letter-spacing (-0.3 to -1.5px) is essential — Copernicus without it reads as off-brand. The serif character is what gives Anthropic its literary, considered voice; switching to a sans-serif display would make Claude feel like every other AI tool.

Body type stays at weight 400 for paragraphs, weight 500 for labels and emphasized phrases. The sans body is humanist (StyreneB) — never geometric. Inter is an acceptable substitute because of its similar humanist proportions; Helvetica or Arial would be too neutral and break the warm-editorial feel.

### Note on Font Substitutes

If Copernicus / Tiempos Headline is unavailable, **Cormorant Garamond** at weight 500 with -0.02em letter-spacing is the closest open-source approximation. **EB Garamond** is a fallback. For StyreneB, **Inter** is the closest match — both are humanist sans designed for screen reading. **Söhne** is another close alternative if licensed.

## Layout

### Spacing System

- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) — modern-SaaS rhythm.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards, pricing tier cards, model comparison cards; `{spacing.lg}` (24px) for code-window cards and connector tiles.
- **Callout / CTA bands:** `{spacing.xxl}` (48px) inside coral callout cards; 64px inside the larger dark CTA band.

### Grid & Container

- **Max content width:** ~1200px centered.
- **Editorial body:** Single 12-column grid; hero often uses 6/6 split (h1 left, illustration right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Connector tile grids:** 4-up or 6-up at desktop, 2-up at tablet, 1-up at mobile.
- **Pricing grid:** 3-up at desktop (Free / Pro / Team / Enterprise often), 1-up at mobile.

### Whitespace Philosophy

The cream canvas + serif display + generous internal padding create an editorial pacing — Claude reads like a long-form magazine column rather than a marketing template. Whitespace between bands stays uniform at 96px; whitespace inside cards is generous (32px), letting type breathe.

## Elevation & Depth

| Level              | Treatment                                      | Use                                                                            |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Flat               | No shadow, no border                           | Body sections, top nav, hero bands                                             |
| Soft hairline      | 1px `{colors.hairline}` border                 | Inputs, sub-nav, occasionally on cards                                         |
| Cream card         | `{colors.surface-card}` background — no shadow | Feature cards, content cards                                                   |
| Dark surface card  | `{colors.surface-dark}` background — no shadow | Code editor mockups, model showcase cards                                      |
| Subtle drop shadow | Faint shadow at low alpha                      | Hover-elevated states (the system uses `0 1px 3px rgba(20,20,19,0.08)` rarely) |

The elevation philosophy is **color-block first, shadow rare**. Most depth comes from the cream-vs-dark surface contrast. Shadows are minimal. The dark surface mockups have their own internal product chrome (code editor scrollbars, line numbers, syntax highlighting) which adds detail without needing external shadows.

### Decorative Depth

- The Anthropic spike-mark glyph (4-spoke radial asterisk) appears as a small black mark in the brand wordmark and inline as a content marker.
- Code editor mockups carry their own internal depth: syntax-highlighted text in muted blues / oranges / grays, line numbers in `{colors.muted-soft}`, status bars at the bottom in `{colors.surface-dark-elevated}`.
- Some hero illustrations use simple line-art with coral and dark-navy strokes on cream — minimal, hand-drawn-feeling, never photorealistic.

## Shapes

### Border Radius Scale

| Token            | Value        | Use                                                             |
| ---------------- | ------------ | --------------------------------------------------------------- |
| `{rounded.xs}`   | 4px          | Reserved for badge accents and tiny dropdowns                   |
| `{rounded.sm}`   | 6px          | Small inline buttons, dropdown items                            |
| `{rounded.md}`   | 8px          | Standard CTA buttons, text inputs, category tabs                |
| `{rounded.lg}`   | 12px         | Content cards (feature, pricing, code-window, model-comparison) |
| `{rounded.xl}`   | 16px         | Hero illustration container, the larger marquee components      |
| `{rounded.pill}` | 9999px       | Badge pills, "NEW" tags                                         |
| `{rounded.full}` | 9999px / 50% | Avatar substitutes, icon buttons                                |

### Photography & Illustrations

Claude's hero rarely uses photography. Instead it uses:

- Simple line-art illustrations with coral + dark-navy strokes on the cream canvas
- Code editor mockups (the dominant "hero" treatment on developer-focused pages)
- Terminal output mockups with monospace text on dark
- Model comparison cards (Opus / Sonnet / Haiku) with abstract geometric thumbnails

When photography is used (rare — mostly testimonials), avatars crop to perfect circles at 40px diameter.

## Components

### Top Navigation

**`top-nav`** — Cream nav bar pinned to the top of every page. 64px tall, `{colors.canvas}` background. Carries the Anthropic spike-mark + "Claude" wordmark at left, primary horizontal menu (Product, Solutions, Use Cases, Pricing, Research, Company) center-left, right-side cluster with "Sign in" text-link, "Try Claude" `{component.button-primary}` (coral). Menu items in `{typography.nav-link}` (StyreneB 14px / 500).

### Buttons

**`button-primary`** — The signature coral CTA. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), type `{typography.button}` (StyreneB 14px / 500), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px). Active state `button-primary-active` darkens to `{colors.primary-active}` (#a9583e).

**`button-secondary`** — Cream button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border, same padding + height + radius as primary.

**`button-secondary-on-dark`** — Used over `{colors.surface-dark}` cards. Background `{colors.surface-dark-elevated}` (#252320), text `{colors.on-dark}`. Stays dark — the system never inverts to a light secondary on dark surfaces.

**`button-text-link`** — Inline text button, no background. Used for "Sign in" in the top nav and inline CTA links.

**`button-icon-circular`** — 36px circular icon button. Background `{colors.canvas}`, hairline border, ink-color icon. Used for carousel arrows, share, "view more".

**`text-link`** — Inline body links in `{colors.primary}` (the coral). Underlined on press; the coral inline link is one of the system's most distinctive small details.

### Cards & Containers

**`hero-band`** — Cream-canvas hero with a 6-6 grid: h1 + sub-headline + button row on the left, hero illustration card or product mockup card on the right. Vertical padding `{spacing.section}` (96px).

**`hero-illustration-card`** — A larger card holding the hero's right-side artifact — sometimes a coral-stroke line illustration on cream background, sometimes a dark code editor mockup. Background `{colors.canvas}` or `{colors.surface-dark}` depending on context, rounded `{rounded.xl}` (16px).

**`feature-card`** — Used in 3-up feature grids. Background `{colors.surface-card}` (#efe9de — slightly darker cream), rounded `{rounded.lg}` (12px), internal padding `{spacing.xl}` (32px). Carries a small icon at top, an `{typography.title-md}` headline, and a body description in `{typography.body-md}`.

**`product-mockup-card-dark`** — Dark navy card showing actual Claude product chrome (chat interface, code editor, agent controls). Background `{colors.surface-dark}`, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px). Carries text labels in `{colors.on-dark}` and product UI fragments below.

**`code-window-card`** — A specialized dark card showing a code editor with line numbers, syntax-highlighted code in `{typography.code}` (JetBrains Mono), and sometimes a "Run" button or terminal output panel below. Background `{colors.surface-dark}` with `{colors.surface-dark-soft}` for the inner code block, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). The signature visual element of Claude Code product pages.

**`model-comparison-card`** — Used on the homepage's "Which problem are you up against?" section comparing Opus / Sonnet / Haiku. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px). Carries the model name, a short capability blurb, and a `{component.text-link}` to learn more.

**`pricing-tier-card`** — Standard tier card. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, padding `{spacing.xl}` (32px). Carries the plan name in `{typography.title-lg}` (StyreneB), price in `{typography.display-sm}` (Copernicus serif!), feature checklist in `{typography.body-md}`, and a `{component.button-primary}` at the bottom.

**`pricing-tier-card-featured`** — The featured tier (typically "Pro" or "Team"). Background flips to `{colors.surface-dark}`, text inverts to `{colors.on-dark}`. The dark surface IS the featured-tier signal.

**`callout-card-coral`** — A full-bleed coral card carrying a major call-to-action. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). The coral surface IS the voltage; the CTA inside uses an inverted button style (cream/canvas button on coral).

**`connector-tile`** — Used on the connectors page's integration grid. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, padding 20px. Each tile carries a logo at top, a `{typography.title-sm}` connector name, and a short description.

### Inputs & Forms

**`text-input`** — Standard text input. Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px. 1px hairline border in `{colors.hairline}`.

**`text-input-focused`** — Focus state. Border thickens or shifts to `{colors.primary}` (coral) for emphasis. Carries a 3px coral-at-15%-alpha outer ring.

**`cookie-consent-card`** — Bottom-right floating dark cookie banner. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). One of the few places dark surface appears at small scale on cream pages.

### Tags / Badges

**`badge-pill`** — Small pill label used for category tags. Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.caption}` (13px / 500), rounded `{rounded.pill}`, padding 4px × 12px.

**`badge-coral`** — Coral-fill badge for "NEW", "BETA", featured highlights. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.caption-uppercase}` (12px / 500 / 1.5px tracking), rounded `{rounded.pill}`, padding 4px × 12px.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Used in sub-nav rows on solutions / connectors pages. Inactive: transparent background, `{colors.muted}` text. Active: `{colors.surface-card}` background, `{colors.ink}` text. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer

**`cta-band-coral`** — A pre-footer "Try Claude" CTA card. Full-width coral fill, white type, rounded `{rounded.lg}`, padding 64px. Carries an h2 in `{typography.display-sm}` (still serif!), a sub-line, and a cream-button CTA.

**`cta-band-dark`** — Alternative pre-footer band on developer-focused pages. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding 64px. Often pairs with a code-window card.

**`footer`** — Dark navy footer that closes every page. Background `{colors.surface-dark}` (#181715), text `{colors.on-dark-soft}`. 4-column link list at desktop covering Product / Company / Resources / Legal. Vertical padding 64px. The Anthropic spike-mark + "Anthropic" wordmark sits at the top in `{colors.on-dark}`. The footer never inverts.

## Do's and Don'ts

### Do

- Anchor every page on the cream canvas. Pure white reads as "any other AI tool"; the warm tint is the brand differentiator.
- Use Copernicus serif for every display headline. Pair with StyreneB sans body. Negative letter-spacing on display sizes is non-negotiable.
- Reserve `{colors.primary}` (coral) for primary CTAs and full-bleed `{component.callout-card-coral}` moments. Don't paint accent moments coral elsewhere.
- Use `{component.product-mockup-card-dark}` and `{component.code-window-card}` to show actual Claude product chrome. Don't paint marketing illustrations of code when you can show real code.
- Pair `{component.feature-card}` (cream) with `{component.product-mockup-card-dark}` (navy) in alternating bands. The cream-to-dark rhythm is the brand's pacing mechanism.
- Use the Anthropic spike-mark glyph as the brand wordmark prefix. Never invert the mark to white-on-dark within the wordmark itself.
- Apply `{spacing.section}` (96px) between major bands.

### Don't

- Don't use cool grays or pure white for canvas. Cream is the brand.
- Don't bold serif display weight. Copernicus at 700 reads as bombastic; the system stays at 400.
- Don't use cool blue or saturated cyan as a brand accent. The coral is the brand voltage.
- Don't put coral everywhere. The coral is scarce on individual elements and generous only on full-bleed coral callout cards.
- Don't use Inter for display headlines. The serif character is the brand voice.
- Don't repeat the same surface mode in two consecutive bands. The pacing alternates: cream → cream-card → dark-mockup → cream → coral-callout → dark-footer.
- Don't add hover state styling beyond what the system already encodes — primary darkens on press; nothing else changes.

## Responsive Behavior

### Breakpoints

| Name    | Width       | Key Changes                                                                                                                                            |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile  | < 768px     | Hamburger nav; hero h1 64→32px; hero-illustration-card stacks below content; feature grids 1-up; connector tiles 2-up; pricing 1-up; footer 4 cols → 1 |
| Tablet  | 768–1024px  | Top nav stays horizontal but tightens; feature cards 2-up; connector tiles 3-up; pricing 2-up                                                          |
| Desktop | 1024–1440px | Full top-nav with all menu items; 3-up feature cards; 4-up or 6-up connector tiles; 3-up pricing tiers                                                 |
| Wide    | > 1440px    | Same as desktop with more outer breathing room; max content width caps at 1200px                                                                       |

### Touch Targets

- `{component.button-primary}` at minimum 40 × 40px.
- `{component.button-icon-circular}` at exactly 36 × 36 — slightly under WCAG 44 but visually centered.
- `{component.text-input}` height is 40px.
- Connector tile entire card area is tappable; effective tap area >> 44px.

### Collapsing Strategy

- Top nav collapses to hamburger at < 768px; menu opens as a full-screen cream sheet.
- Hero band's 6-6 grid collapses to single-column on mobile — h1 + sub-head + buttons first, then the illustration / mockup card below.
- Feature grids reduce columns rather than scaling cards down.
- Pricing tier cards collapse 4 → 2 → 1; featured-tier dark surface stays visually distinct at every breakpoint.
- Code-window cards retain code legibility at every breakpoint by allowing horizontal scroll within the card rather than wrapping code lines.

### Image Behavior

- Code blocks inside dark mockups stay at fixed font-size; horizontal scroll on mobile rather than wrapping.
- Hero illustrations scale proportionally; line-art strokes thin slightly on mobile.
- Avatar photos in testimonials crop to circles at every breakpoint.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.feature-card}`, `{component.code-window-card}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay Copernicus serif 400 with negative tracking. Body stays StyreneB / Inter 400. The split is unbreakable.
6. Cream + coral + dark navy is the trinity. Don't introduce a fourth surface tone (no purple cards, no green sections).
7. When in doubt about emphasis: bigger Copernicus serif before bolder weight.

## Known Gaps

- Copernicus and StyreneB are licensed Anthropic typefaces and not available as public web fonts. Substitutes (Tiempos Headline / Cormorant Garamond / EB Garamond for serif; Inter / Söhne for sans) are documented in the typography section.
- The Anthropic radial-spike-mark is a brand glyph rendered as inline SVG; it's not formalized as a system token here. Treat it as a logo asset.
- Animation and transition timings (chat message reveal, code block typewriter effect on the homepage, agentic-flow diagram animations) are not in scope.
- Form validation states beyond `{component.text-input-focused}` are not extracted — error / success states would need a sign-up or feedback flow to confirm.
- The actual Claude product surface (claude.ai chat interface) shares some tokens with the marketing site but adds many product-specific components (chat bubbles, message tools, file upload chips, conversation history sidebar) that are out of scope for this marketing-surface document.
- The "agent" / "computer use" demo cards on certain pages display animated Claude controlling a browser — the static screenshot doesn't fully capture the animation chrome.

---

## Navi v2 적용 가이드

> 이 절부터는 **프로젝트 확장**이다. 위 원문은 claude.com 마케팅 사이트에서 추출된 것이므로, 업무 도구(칸반 보드 · 태스크 문서 · 에이전트 제안)에 맞게 해석 규칙과 앱 전용 컴포넌트를 여기서 정한다.
> 대상 화면은 `docs/spec.md` 의 범위 1~3: **태스크 생성(유형 템플릿) · 태스크 상세(섹션 편집 · 제안 diff 수락/거부 · 미결정 답변) · 업무 보드(개발 준비됨 게이트)**.
> 목업은 `docs/design/` 아트보드 8장(화면 6 + 상태 시트 2). 2026-09-01 디자인 리뷰 + 범위 1 스펙 개정(완료 조건 폐기 → 세부사항·예외 조건 필수, 단어 단위 diff) 반영본.

### A. 선택 이유와 해석 원칙

**왜 Claude 인가.** Navi 의 핵심 상호작용은 "에이전트가 문서 수정을 *제안*하고 사람이 읽고 수락한다"이다. 장문 마크다운과 diff 를 오래 읽는 도구이므로 크림 캔버스 + 인문주의 타입이 맞고, 코랄이 희소 액센트라서 diff 초록/빨강·게이트 뱃지·경고 같은 **의미 색**이 액센트와 경쟁하지 않는다.

**리뷰에서 확정한 제품 결정 (2026-09-01)**

| 결정                                  | 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 미결정 답변                           | **답변 텍스트를 입력하고 "답변 완료"를 눌러야 체크**된다. 체크만으로는 통과하지 않는다. 답을 문서에 옮기고 싶으면 행 액션 "Navi에게 문서 반영 요청" → 제안 파이프라인                                                                                                                                                                                                                                                                                                    |
| 문서 편집                             | **섹션 단위 인라인 편집.** 섹션을 클릭하면 그 섹션만 편집창이 되고 저장 시 버전 +1. 편집 단위 = 제안 단위 = 섹션                                                                                                                                                                                                                                                                                                                                                         |
| diff 위치                             | **문서의 대상 섹션 위에 diff 와 [거부][수락]** 을 렌더링한다(spec 문구 그대로). diff 는 **단어 단위(LCS, 서버 계산)** — 삭제는 취소선 + `error-wash`, 추가는 `success-wash` + 500. 교체 단위는 섹션이지만 표시는 단어 단위다. Navi 패널에는 사유·대상·상태와 "문서에서 보기"만 있는 **요약 카드**                                                                                                                                                                        |
| 템플릿 구조 (범위 1 개정)             | 섹션 축은 **정책(무엇) → 세부사항(어떤 값으로, `항목 — 값`) → 예외 조건(언제 제외)**. **세부사항·예외 조건 필수**, 완료 조건·인수 기준은 담당자에게 요구하지 않는다. 고정 문구는 세부사항 아래 `### 알림톡 템플릿` 코드블록(마커 유지). 백엔드 템플릿 헤딩은 `## 정책:` 처럼 콜론으로 끝나며 표시할 때만 뗀다                                                                                                                                                            |
| Todo 이동 경고                        | 게이트 3항목 체크리스트를 본문으로 두고, 헤드라인은 **첫 실패 항목**에 따라 분기                                                                                                                                                                                                                                                                                                                                                                                         |
| 문체                                  | **시스템 UI = 합니다체·명사형, Navi 발화(채팅 답변·제안 사유) = 해요체.** 한 문단 안에서 섞지 않는다                                                                                                                                                                                                                                                                                                                                                                     |
| 생성 vs 분석                          | 생성 다이얼로그는 Backlog 에 만들기만 한다. `(예:` 마커 검사는 상세의 "분석 시작" 클릭 시점                                                                                                                                                                                                                                                                                                                                                                              |
| 편집 본문의 새 헤딩 (코드 리뷰 후)    | 편집 중 본문에 `## ` 줄이 있으면 **저장을 차단**하고 안내 문구를 보인다(`###` 소제목과 코드 펜스 안은 허용). 섹션 식별은 이름이 아니라 **인덱스**. 첫 헤딩 앞 텍스트(preamble)도 "본문" 블록으로 편집 가능                                                                                                                                                                                                                                                               |
| 취소·아카이브 태스크 (코드 리뷰 후)   | 보드에서 숨기고, 상세로 직접 진입하면 **읽기 전용 배너** + 편집/분석 버튼 숨김 (리다이렉트 아님)                                                                                                                                                                                                                                                                                                                                                                         |
| 보드 드롭 판정 (코드 리뷰 후)         | 포인터가 컬럼 위에 있을 때만 드롭(`pointerWithin`, 없으면 `rectIntersection`). 가장 가까운 컬럼으로 자동 커밋하지 않는다                                                                                                                                                                                                                                                                                                                                                 |
| 컬럼 안 순서 · 카드 액션 (2026-09-01) | 카드는 `@dnd-kit/sortable` 로 **컬럼 안에서도 정렬**된다(드래그 중 실제 카드가 자리를 옮겨 미리보기, 점선 자리표시 없음). 서버에는 놓인 컬럼의 전체 id 순서를 `PATCH /tasks/reorder` 로 보낸다 — `display_order` 는 컬럼 안에서만 의미가 있다. 검색·필터로 숨은 카드는 원래 앞 카드를 따라간다(`mergeVisibleOrder`). 카드 우상단 **kebab**(hover·포커스 시 표시)에 상세 열기 · 우선순위 · 이동 · 태스크 취소 — 드래그의 키보드 대안. Space = 키보드 드래그, Enter = 열기 |
| 우선순위 · 태그 (2026-09-01)          | 우선순위 0~4(0 = 매우 높음, 기본 2 = 보통), 태그는 백엔드 쉼표 문자열 ↔ 배열. **카드**: 태그 pill 행(20px `surface-card` 12/500 muted), 우선순위는 기본값이 아닐 때만 id 옆 12px(높음·매우 높음은 ink). **상세 메타 행**: 인라인 트리거(`MetaButton`, 텍스트처럼 보이고 hover 배경 한 단계) → 우선순위 라디오 메뉴 / 태그 팝오버(쉼표 구분 입력 + 미리보기 pill). 읽기 전용이면 텍스트만. 색으로 우선순위를 표현하지 않는다                                              |
| 태스크 취소 · 복원 (2026-09-01)       | 취소는 확인 다이얼로그(480) 후 `status=CANCELED` — 빨간 채움 없이 `button-secondary` + `error-deep` 텍스트, 토스트에 **되돌리기** 액션. 취소된 상세의 읽기 전용 배너에 **"Backlog로 복원"**. 아카이브는 백엔드 API 가 없어 프론트 액션 없음. `--destructive` 는 `error-deep` 으로 매핑(메뉴 destructive 항목 텍스트)                                                                                                                                                     |
| 범위 2 연동 (2026-09-02)              | 제안 파이프라인을 백엔드에 연결. diff 는 **서버 LCS 결과를 렌더만** 한다(줄 단위, changed 줄만 어절 parts). 거부는 같은 응답으로 재제안이 돌아온다. **stale 은 accept 409 로 확정** — 프론트는 `task.version` 차이를 사전 경고로만 보인다. 채팅은 동기(최대 60초) — busy 점 3개 + 입력창을 중단 버튼으로 교체(AbortController). 대화는 stateless 세션 로컬. 리로드 후 pending 제안은 목록 API 에 diff 가 없어 미리보기 없이 수락/거부만 가능(백엔드 요청 중)             |

**마케팅 → 앱 재해석 규칙** (원문 Do/Don't 를 앱에 맞게 조정. 여기 없는 항목은 원문을 따른다):

| 원문 규칙                           | 앱 적용                                                                                                                                                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cream → cream-card → dark 밴드 교대 | 앱엔 밴드가 없다. 배경 `{colors.canvas}` 한 장 위에 `{colors.surface-soft}` 컬럼/패널, 그 위에 `{colors.canvas}` 카드 — **3단 figure/ground** 로 대체                                                                                                                      |
| `surface-dark` 는 제품 목업·푸터    | **코드 블록, 툴팁, 토스트에만** 사용. 다크 카드/다크 패널 금지                                                                                                                                                                                                             |
| 코랄은 CTA 와 full-bleed 콜아웃     | **한 화면에 코랄 채움 버튼 1개** (생성 다이얼로그 "태스크 생성" / 상세: 분석 전 "분석 시작", 제안 대기 시 "수락" / 보드 "새 태스크"). 그 외 코랄은 **Navi 식별 점(8px)** 과 pending 제안의 1px 보더·헤더 워시까지만. 상태 표시 pill 에 코랄 워시 금지(중립 pill + 코랄 점) |
| 96px 섹션 리듬, 32px 카드 패딩      | 앱 밀도: 카드 12–16px, 패널 24px, 컬럼 간격 16px                                                                                                                                                                                                                           |
| 호버 미문서화                       | 호버는 **배경 한 단계**(`canvas`→`surface-soft`→`surface-card`)만. 링크는 underline 만. 그림자·이동·확대 금지                                                                                                                                                              |
| 버튼 40px                           | 앱 기본 **36px**, 다이얼로그 하단 40px                                                                                                                                                                                                                                     |
| 인풋 = canvas + hairline            | hairline 은 캔버스 대비 1.25:1 이라 경계가 안 보인다. **인풋 배경은 컨테이너보다 한 단계 다른 표면**(canvas 위 → `surface-soft`, `surface-soft` 위 → `canvas`) + hairline. 포커스는 1px `{colors.primary}` + 3px `primary-wash` 링                                         |
| 라이트/다크 프리뷰                  | **MVP 는 라이트 전용.** 다크 *표면*만 있고 다크 *테마*는 없다. 보류                                                                                                                                                                                                        |

### B. 타이포그래피 — 한국어 적용

원문 서체(Copernicus / StyreneB)는 비공개이고 한글도 없다. 한글이 1차 언어이므로 **한글·라틴을 한 패밀리로** 덮는 대체를 택한다.

| 역할                                                         | 서체                        | 설치                                                                         | 비고                                                                           |
| ------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Display (`display-*`)                                        | **Noto Serif KR** 400 · 500 | `@fontsource/noto-serif-kr`                                                  | 원문의 "세리프 디스플레이 400 + 음수 트래킹" 유지                              |
| Sans (`title-*`, `body-*`, `caption*`, `button`, `nav-link`) | **Pretendard Variable**     | npm `pretendard` (`dist/web/variable/pretendardvariable-dynamic-subset.css`) | 라틴이 Inter 파생. fallback `Inter, "Noto Sans KR", -apple-system, sans-serif` |
| Mono (`code`)                                                | **JetBrains Mono**          | `@fontsource-variable/jetbrains-mono`                                        | 원문 그대로                                                                    |

**앱 타입 스케일** — 아래 값 외의 크기(15px 등)는 쓰지 않는다. Tailwind `@theme` 에 그대로 매핑한다.

| 용도                                        | 값                                            | 비고                                                          |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| 페이지 타이틀 (보드 제목, 태스크 제목)      | `display-sm` 28 / 400 / serif / −0.3px / 1.25 |                                                               |
| 다이얼로그 타이틀                           | `title-lg` **22 / 500**                       | 모든 다이얼로그 동일                                          |
| 섹션 헤드 (문서 h2, 패널 헤더, 미결정 사항) | `title-md` 18 → 앱에서는 **16 / 500**         | 문서 안 h2 와 에디터 헤더 모두 16                             |
| 카드 타이틀, 미결정 항목 질문               | 14 / 500                                      |                                                               |
| **UI 기본 본문**                            | `body-sm` 14 / 400 / 1.55                     |                                                               |
| **문서 본문** (읽기·편집·diff)              | **16 / 400 / 1.7**                            | 원문 body-md 1.55 를 프로즈용 1.7 로 조정. diff 행은 15 / 1.6 |
| 메타 (시간, 담당자, 버전, 캡션)             | `caption` 13 / 500 · **색 `{colors.muted}`**  |                                                               |
| pill·칩 라벨, 컬럼 라벨, 키커               | 12 / 500 · 색 `{colors.muted}`                | 라틴 대문자 +1.5px, 한글 +0.5px                               |
| diff 마커, ID, 버전                         | `code` 12–14 mono                             |                                                               |
| 워드마크 "Navi"                             | 15 / 600 (예외)                               |                                                               |

한글 규칙: 대문자·+1.5px 트래킹은 라틴에만. 한글 라벨은 +0.5px. 한글 display 는 `letter-spacing: -0.01em` 이상 좁히지 않는다.

### C. 앱 전용 확장 토큰

원문 색 위에 **워시(wash)** 와 **딥(deep)** 을 추가한다. 워시는 `{colors.canvas}` 위에 해당 색을 알파 블렌딩한 결과를 고정 hex 로 둔 것(런타임 알파 금지). 딥은 워시 위 12–13px 텍스트가 **AA(4.5:1)를 넘도록** 어둡게 만든 것 — 2026-09-01 리뷰에서 실측 후 두 값을 어둡게 조정했다.

```yaml
colors-ext:
  primary-wash: '#f5ece6' # coral 10% on canvas — 선택 타일, pending 제안 헤더, 포커스 링
  primary-text: '#994d35' # 캔버스 위 코랄 '텍스트'. canvas 5.75 · wash 5.2 (구 #a9583e 는 wash 위 4.3 로 미달)
  success-wash: '#e4f0e3' # diff 추가 행, 개발 준비됨 뱃지 배경
  success-deep: '#27693b' # wash 5.6 · canvas 5.9 · 게이트 점에도 사용 (구 #2f7a44 는 4.48)
  error-wash: '#f4e3e0' # diff 삭제 행, LLM 오류 말풍선
  error-deep: '#a53a3a' # wash 5.2
  warning-wash: '#f4ebd1' # 경고 콜아웃, stale 배너
  warning-deep: '#7a5a0c' # wash 5.4
  marker-wash: '#f6e7d3' # `(예: …)` 마커
  marker-text: '#8a5a1f' # wash 4.9
  teal: '#5db8a6' # 스트리밍 점 (비텍스트)
  overlay: 'rgba(20, 20, 19, 0.32)' # 다이얼로그 스크림 (canvas 위 합성 = #b0b0ad)
```

**텍스트 색 규칙 (대비 실측 기준)**

- 12–13px 텍스트는 `{colors.muted}` `#6c6a64` (canvas 5.1 · surface-soft 4.8). **`{colors.muted-soft}` `#8e8b82` 는 12–13px 텍스트에 쓰지 않는다** (3.2:1) — 플레이스홀더, disabled 라벨, 비활성 아이콘 전용.
- 캔버스 위 코랄 텍스트는 `primary-text`. `{colors.primary}` 텍스트 금지(3.1:1).
- 흰 글자 on `{colors.primary}` 버튼은 3.3:1 — 브랜드 유지로 수용하고 라벨 weight 600. (Known Gap)

**색 예산 (한 화면 기준)**: 코랄 채움 버튼 1개 · Navi 식별 점 · pending 제안 보더/헤더 워시. 의미색은 상태가 있을 때만. 태스크 **유형 4종은 색으로 구분하지 않는다** — 중립 pill + 아이콘(신규 기능 `Sparkles` · 기존 기능 수정 `PenLine` · 자동화·배치 `Timer` · 정책 변경 `Scale`) + `title` 툴팁.

**엘리베이션**

- Level 0: 1px `{colors.hairline}` — 카드, 컬럼 구분, 인풋(+표면 단차)
- Level 1: `0 1px 3px rgba(20,20,19,0.08)` — 토스트, 팝오버
- Level 2: `0 8px 24px rgba(20,20,19,0.12)` + `overlay` 스크림 — 다이얼로그·시트, **드래그 중인 카드**. 다이얼로그에 hairline 보더는 두지 않는다

### D. spec.md 화면 컴포넌트

토큰 참조는 원문 front matter(`{colors.*}`, `{rounded.*}`, `{spacing.*}`) 와 §C 를 함께 쓴다. 목업 파일명을 함께 적는다.

#### D.0 공통 셸

| 컴포넌트                  | 스펙                                                                                                                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-topbar`              | 높이 56, bg `{colors.canvas}`, 하단 1px hairline. 좌: 코랄 점 8px + "Navi" 15/600 · 구분선 · 탭("업무 보드"·"분석", 활성 bg `{colors.surface-card}`) 또는 브레드크럼 · 우: 검색(240×36, bg `surface-soft`) + 화면별 액션 슬롯(코랄 1개 + secondary + kebab 36px) |
| `button-primary`          | 36px · padding `0 14px`(아이콘 있으면 `0 14px 0 12px`) · bg `{colors.primary}` · text white 14/600 · `{rounded.md}`. 다이얼로그는 40px · `0 16px`. disabled: bg `{colors.primary-disabled}` text `{colors.muted}`                                                |
| `button-secondary`        | 36/40px · 1px hairline · bg `{colors.canvas}` · text ink 14/500. hover bg `surface-soft`                                                                                                                                                                         |
| `button-ghost`            | 배경 없음 · text `{colors.body}` 14/500 · padding `0 12px`. 인라인 소형은 32px 13/500                                                                                                                                                                            |
| `button-destructive-text` | ghost + text `error-deep`. "거부"에만. 빨간 채움 금지                                                                                                                                                                                                            |
| `button-icon`             | 36px 정사각 ghost. 다이얼로그 닫기(X)도 36                                                                                                                                                                                                                       |
| `text-input`              | 36px(다이얼로그 40) · 표면 단차 + hairline · 텍스트 16(폼) / 14(인라인). focus: 1px primary + 3px `primary-wash`                                                                                                                                                 |
| `badge-pill`              | 22px · `{rounded.pill}` · bg `surface-card` · 12/500 ink. 상태 표시는 좌측 아이콘/점으로: 적용됨 = `success-deep` 체크, 거부됨 = `muted` X, 만료됨 = `warning-deep` 경고, 제안 대기 = 코랄 점                                                                    |
| `badge-ready`             | 유일한 채움 pill: bg `success-wash` · text `success-deep` · `CheckCircle2` 13px + "개발 준비됨" 12/500                                                                                                                                                           |
| `avatar`                  | **24px**, bg `surface-card`, 이니셜 11/600 `{colors.body}`                                                                                                                                                                                                       |
| `callout`                 | bg 워시 + 아이콘 18px + 헤드라인 14/500 + 본문 13. `{rounded.md}`, padding 12 14. 좌측 컬러 보더 없음                                                                                                                                                            |
| `toast`                   | bg `{colors.surface-dark}` · text `{colors.on-dark}` 13 · `{rounded.md}` · Level 1 · 액션 버튼 bg `{colors.surface-dark-elevated}`. 일시 오류(네트워크·저장 실패)에만                                                                                            |
| `dialog`                  | `{rounded.xl}` · bg canvas · padding 24 · Level 2 + 스크림 · 타이틀 22/500 · 폭 480(경고) / 720(생성) · 하단 버튼 40px 우측 정렬                                                                                                                                 |

#### D.1 태스크 생성 — 유형 템플릿 (범위 1) — `TaskCreate.dc.html`

| 컴포넌트             | 스펙                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type-tile`          | 4-up 그리드(gap 12) · padding 16 · `{rounded.lg}` · 아이콘 20 `muted` · 이름 14/500 · 설명 12 `muted` **명사구**("새 기능 추가" / "기존 동작 변경" / "주기 실행·자동 처리" / "규칙·조건·금액 변경")                                                                      |
| `type-tile-selected` | bg `primary-wash` · 1px `{colors.primary}` · 아이콘 `primary-text`. 선택 시 에디터에 템플릿 **실제 텍스트** 삽입. **본문을 이미 수정한 뒤 다른 타일을 누르면 확인 다이얼로그**("작성한 내용이 ○○ 템플릿으로 바뀝니다")                                                   |
| `template-editor`    | bg `surface-soft` · hairline · `{rounded.lg}` · padding 20 22 · min-height 320 · 본문 16/1.7 · 섹션 헤더 16/500(콜론 제거). **세부사항·예외 조건 헤더에 "필수" 12/500 muted** — 삭제 불가. `### 알림톡 템플릿` 코드블록은 `surface-dark` 표면, 블록 안 마커도 하이라이트 |
| `template-marker`    | `(예: …)` 인라인 하이라이트: bg `marker-wash` · text `marker-text` · `{rounded.xs}` · padding 1 5 · `box-decoration-break: clone`. 마커가 수정되면 제거                                                                                                                  |
| 하단                 | 좌: 13 `muted` "Backlog에 생성됩니다 · 예제 텍스트 N건 남음 — 분석 시작 전에 실제 값으로 바꿔 주세요" · 우: `button-secondary` "취소" · `button-primary` **"태스크 생성"** (제목·유형 미입력 시 disabled)                                                                |

#### D.2 태스크 상세 (범위 1·2·3) — `DetailPre.dc.html`(분석 전) · `Main.dc.html`(분석 후) · `ProposalStates.dc.html` · `PanelStates.dc.html`

2-pane: 좌 문서(유동, 최대 760) · 우 Navi 패널 400, bg `surface-soft`, 좌측 1px hairline.

**헤더**

| 컴포넌트                                            | 스펙                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task-header`                                       | 유형 pill(아이콘+라벨) + 상태 pill(중립) · 제목 `display-sm` · 메타 행 13/500 muted: id `code` · **우선순위(라디오 메뉴) · 태그(팝오버)** — `MetaButton` 인라인 트리거, 값은 ink · "N시간 전 생성/수정". 버전·담당자는 백엔드에 생기면 추가                                                                                                                         |
| 상단바 액션                                         | `button-icon` kebab("태스크 취소") + 분석 전: `button-primary` **"분석 시작"** · 분석 중: disabled + 스피너 "분석 중…" · 분석 후: `button-secondary` "분석 다시 실행" (코랄은 제안의 "수락"에 양보). 읽기 전용이면 둘 다 숨김                                                                                                                                       |
| `gate-strip`                                        | hairline 박스, 항목 3개 가로: 통과 `CheckCircle2` + 13/500 `success-deep` / 미통과 `Circle` + `muted`. 라벨은 **실패 사유 문구**: "예제 마커 N건 남음" · "분석 전" / "분석 실행 중 — 미결정 사항을 추출하고 있습니다" · "미결정 N건 남음" / 통과 시 "예제 마커 0건" · "분석 실행됨" · "미결정 답변 완료". **분수(2/3) 표기 없음.** 3개 통과 시 우측에 `badge-ready` |
| `analyze-warning-dialog` (`AnalyzeWarning.dc.html`) | "분석 시작" 클릭 시 마커가 남아 있으면. 타이틀 **"분석을 시작하기 전에"** · 콜아웃 "예제 텍스트 **N건**이 남아 있습니다" · 잔존 마커를 섹션명 12/500 + `template-marker` 로 나열 · 액션 `button-secondary` "그대로 분석" · `button-primary` "돌아가서 수정"(= 첫 마커 섹션으로 스크롤 + 편집 모드 진입). 차단하지 않는다. 마커 0건이면 다이얼로그 없이 바로 분석    |

**문서 — 읽기 · 편집**

| 컴포넌트                    | 스펙                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document-section`          | h2 16/500 + 본문 16/1.7, 섹션 간 24. 헤더 우측에 hover 시 `button-ghost` 32px "편집"(PenLine 13). 세부사항·예외 조건 헤더엔 "필수". 세부사항 안 `### 알림톡 템플릿` 은 다크 코드블록                                                                                                                                                                                                        |
| `section-editing`           | 클릭한 섹션만: bg canvas · 1px primary + 3px `primary-wash` 링 · `{rounded.lg}` · padding 14 16 · 마크다운 textarea(16/1.7, 마커 하이라이트 유지) · 하단 좌 12 muted "이 섹션만 저장됩니다 · 마크다운" · 우 `button-ghost` "취소" + `button-secondary` "저장 · vN+1"(코랄 아님 — 화면의 코랄은 상단바). 헤더 우측 "편집 중" 12/500 `primary-text`. 저장 시 해당 섹션의 pending 제안은 stale |
| `undecided-empty` (분석 전) | bg `surface-soft` 박스: 14/500 "아직 분석을 실행하지 않았습니다" + 13 muted 안내                                                                                                                                                                                                                                                                                                            |

**문서 — 제안 (diff 는 문서 위)**

| 컴포넌트                     | 스펙                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 섹션 헤더 표시               | 대상 섹션 h2 옆 중립 pill + 코랄 점 "제안 대기 N". 패널 카드 "문서에서 보기" 클릭 → 이 섹션으로 스크롤                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `section-proposal` (pending) | 섹션 본문 자리에 블록: 1px `{colors.primary}` · `{rounded.lg}` · overflow hidden. **헤더** bg `primary-wash`: 코랄 점 + "Navi 제안" 13/500 `primary-text` + 사유 13 body(해요체). **diff** 는 섹션 본문(16/1.7) 안에 **단어 단위 인라인**: 삭제 = bg `error-wash` + 취소선 + `error-deep`, 추가 = bg `success-wash` + 500 + `success-deep`, 변경 없는 단어는 `body` 그대로. 서버가 LCS 로 계산하고 프론트는 `same/del/add` 런을 렌더만 한다. 통째로 새로 들어간 줄은 줄 전체가 추가 런. **푸터** hairline-soft 상단선: 좌 12 muted "수락하면 이 섹션만 교체되고 vN+1로 저장됩니다" · 우 `button-destructive-text` "거부" + `button-primary` "수락" |
| `field-proposal-card`        | 메타 필드(마감일·우선순위·담당자·태그) 변경 제안(`update_field`)은 문서 **상단**에 카드로: 1px `{colors.primary}` · 헤더 "메타 필드 변경 제안" `primary-text` · `필드: 이전 → 새 값` 단어 diff · 같은 액션 행. 백엔드에 메타 필드가 생기면 활성화                                                                                                                                                                                                                                                                                                                                                                                                  |
| `section-proposal-rejecting` | "거부" 클릭 → 푸터가 bg `surface-soft` 입력 영역으로 확장: 13/500 "거부 사유 — Navi가 이 사유를 반영해 다시 제안합니다" · textarea(min 64, 포커스 링) · `button-ghost` "취소" + `button-primary` "사유와 함께 재요청"(이 순간의 코랄)                                                                                                                                                                                                                                                                                                                                                                                                              |
| `section-proposal-rejected`  | hairline 블록: 회색 점 + "Navi 제안 · 거부됨" 13/500 muted · 우측 스피너 + "사유를 반영해 다시 제안하는 중" 12 · 사유 인용(좌 2px hairline, 13). 섹션 본문은 원문 유지. 새 제안이 오면 pending 블록으로 교체                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `section-proposal-stale`     | hairline 블록 상단에 `warning-wash` 배너: `AlertTriangle` + 13/500 "문서가 변경되어 이 제안은 만료되었습니다 (vN에서 ○○이 수정됨)" + `button-ghost` "다시 제안 받기". diff 는 opacity .5, 버튼 disabled. **수락 시 낙관적 잠금 충돌도 같은 배너**, 문구만 "문서가 변경되어 적용하지 못했습니다"                                                                                                                                                                                                                                                                                                                                                    |
| `section-proposal-applying`  | 수락 요청 중: 푸터 좌 스피너 + "적용 중 — 섹션이 그대로인지 확인하고 vN+1로 저장합니다" · 버튼 disabled                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 적용 후                      | 블록이 사라지고 섹션 본문이 새 내용. 헤더 옆 중립 pill "Navi 제안 적용 · vN"(초록 체크). 활동에 "Navi 수정(사유) → 사용자 승인"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

**문서 — 미결정 사항 (범위 3)**

| 컴포넌트                   | 스펙                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 섹션 헤더                  | "미결정 사항" 16/500 · 우측 13/500 muted **"답변 N · 남음 M"**                                                                                                                                                                                                                       |
| `undecided-item`           | hairline 리스트 행(padding 12 14, 구분선 hairline-soft): 체크박스 18px(`{rounded.xs}`, 체크 = bg ink + 흰 체크, 미체크 = 1px `#cfc6bb`) + 질문 14/500 `body-strong`. 답변됨: 아래 13 muted "답변 · …(반영 위치)"                                                                     |
| `undecided-item-answering` | 행 클릭 → bg `surface-soft`: 질문 + `text-input` 36(포커스 링) + 하단 좌 `button-ghost` 32 "Navi에게 문서 반영 요청"(코랄 점) · 우 `button-ghost` "취소" + `button-secondary` "답변 완료". **답변 완료 = 저장 + 체크.** 체크박스 직접 클릭은 입력 모드를 연다(빈 답변으로 체크 불가) |

**Navi 패널**

| 컴포넌트                                  | 스펙                                                                                                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `panel-header`                            | 48px, 코랄 점 + "Navi" 14/500 + 12 muted "요구사항 코칭"                                                                                                                                                          |
| `panel-greeting` (첫 진입)                | Navi 첫 발화 말풍선(`navi-message` 스타일, bg canvas): "문서를 고치고 싶은 내용을 말해주세요. 저는 직접 수정하지 않고 변경안을 만들어 보여드려요. 수락하면 그때 문서에 반영돼요." — 빈 상태 카드 대신 대화로 시작 |
| `suggestion-chips`                        | 입력창 위 추천 요청 3개: 32px pill · hairline · bg canvas · 12/500 body · 클릭 시 그대로 전송. 예: "예외 조건에 빠진 엣지케이스를 추가해줘" · busy 중엔 disabled                                                  |
| `proposal-summary` (pending)              | hairline 카드 12: 코랄 점 + "Navi 제안" 13/500 `primary-text` + 대상 `code` 12 · 사유 13 body · 링크 "문서에서 보기 →" 13/500 `primary-text`. **diff·버튼 없음**                                                  |
| `proposal-summary` (적용됨/거부됨/만료됨) | 한 줄: 회색 점 + "Navi 제안" muted + 대상 + 우측 `badge-pill`(적용됨·vN 초록 체크 / 거부됨·사유 1 / 만료됨 경고). 적용됨은 아래 13 muted 사유 한 줄                                                               |
| `user-message`                            | 우측 정렬, bg `surface-card`, `{rounded.lg}`, 14 ink, 최대 300. 거부 사유는 "(제안 거부) 사유" 형태로 대화에 남는다                                                                                               |
| `navi-message`                            | 배경 없음, 14 body, **해요체**. `no_change` 는 이 형태로만(카드 없음)                                                                                                                                             |
| `navi-streaming`                          | teal 점 3개(8px, 투명도 1/.6/.3 순환) + 13 muted "Navi가 제안을 만들고 있습니다…". 입력창은 opacity .85 + 전송 버튼 자리에 `Square` 중단(`primary-text`)                                                          |
| `navi-error`                              | bg `error-wash` `{rounded.lg}` · `error-deep`: 13/500 "제안을 만들지 못했습니다" + 13 사유(합니다체) + `button-ghost` 32 "다시 시도". 서버 검증 실패(재시도 1회 후)·타임아웃에 사용                               |
| `chat-input`                              | 하단 고정, bg canvas, hairline, `{rounded.lg}`, textarea 14 + 전송 원형 28(입력 있을 때 `primary-text`)                                                                                                           |
| 패널 스크롤                               | 최신 하단 고정, 새 메시지 도착 시 자동 스크롤(사용자가 위로 올린 상태면 유지 + "새 메시지" 칩)                                                                                                                    |
| `activity-row`                            | 13: 시간(64px, muted) · 본문 · 버전 `code`. "**Navi 수정**(사유) → **사용자 승인**" 강조는 500 ink                                                                                                                |

#### D.3 업무 보드 (범위 3) — `Board.dc.html`

| 컴포넌트                                    | 스펙                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `board-column`                              | 폭 300, bg `surface-soft`, **`{rounded.lg}` 12**, padding 12, gap 8. 헤더: 라벨 12/500 muted(라틴 uppercase +1.5 / 한글 +0.5) + 카운트 `code` 12 muted. 컬럼: Backlog · Todo · 진행중 · 완료. **다른 컬럼에서 카드를 받을 때 bg `surface-card`**. 드래그 중에는 드래그 원본(opacity .35)이 놓일 자리로 실제로 옮겨져 자리표시 역할을 한다 — 점선 박스는 빈 컬럼 문구에만 남는다                                                                                                                                                                                                  |
| `board-column-empty`                        | 점선 박스 + 13 muted "완료된 태스크가 없습니다" (컬럼별 문구)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `task-card`                                 | bg canvas · hairline · **`{rounded.lg}` 12** · padding 12. 1행: 유형 아이콘 원 22(아이콘 14, `title` 툴팁) + 제목 14/500 **2줄 말줄임** + 우상단 kebab 28(hover·포커스·메뉴 열림 시만 표시) · 2행: `badge-ready` 또는 `gate-dots` · (태그 행: 20px pill `surface-card` 12/500 muted) · 3행: `code` id + 기본값 아닌 우선순위 12/500(높음 이상은 ink) · 우측 시각 12 muted. 완료 컬럼은 제목 muted, 뱃지 없음. 아바타는 담당자 필드가 생기면                                                                                                                                      |
| `task-card-menu`                            | kebab 메뉴 176px: 상세 열기 · 우선순위 ▸(라디오, 현재 값 12 muted) · 이동 ▸(현재 컬럼 제외) · 구분선 · **태스크 취소**(destructive = `error-deep` 텍스트). 메뉴 안 이벤트는 카드 클릭·드래그 센서로 번지지 않는다                                                                                                                                                                                                                                                                                                                                                                |
| `cancel-task-dialog`                        | 480 · 타이틀 "태스크 취소" · 본문 14 body(제목 인용 ink 500) "보드에서 사라지고 상세는 읽기 전용 · Backlog로 복원 가능" · 액션 `button-ghost` "돌아가기" + `button-secondary` `error-deep` "태스크 취소". 성공 토스트에 "되돌리기"                                                                                                                                                                                                                                                                                                                                               |
| `gate-dots`                                 | 6px 점 3개, **순서 고정 = gate-strip 순서(마커·분석·미결정)**, 통과 `success-deep` / 미통과 hairline, `title` 툴팁에 3항목 문구. 옆 12/500 muted 텍스트 = **첫 실패 항목**: "마커 N건" / "분석 전" / "미결정 N건"                                                                                                                                                                                                                                                                                                                                                                |
| `task-card-dragging`                        | Level 2 그림자 + 1px primary + `rotate(-1.5deg)`. 원래 자리 카드는 opacity .35                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 필터 행                                     | 36px 칩: 전체(활성 bg `surface-card`) · 내 태스크 · 준비됨만 · 구분선 · "유형 ▾"(아이콘↔라벨 대응을 여기서 노출)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `todo-move-warning` (`TodoWarning.dc.html`) | 게이트 미통과 카드를 Todo 에 놓았을 때. 타이틀 "Todo로 이동" · 콜아웃 헤드라인은 **첫 실패 항목**으로 분기: "예제 텍스트 N건이 남아 있습니다" / "분석이 실행되지 않았습니다" / "미결정 N건이 남아 있습니다" + 13 "개발 준비 게이트를 통과하지 않은 태스크입니다. 개발자 역질문이 생길 수 있습니다." · 본문 = **게이트 3항목 체크리스트**(gate-strip 스타일 세로), 실패 항목 아래에 미결정 질문 최대 3개 13 muted · 액션 `button-secondary` "그래도 이동" · `button-primary` "돌아가서 확인". **X = 이동 취소(카드 원위치), "돌아가서 확인" = 취소 + 상세 열기.** 차단하지 않는다 |
| 반응형                                      | 보드 최소폭 1312. 1280 이하에서는 **보드 컨테이너만 가로 스크롤**(페이지 스크롤 아님), 상단바 검색은 176px 로 줄어든다. 상세의 Navi 패널은 1024 미만에서 숨김. 로딩은 스켈레톤(보드 컬럼 4개 · 상세 헤더+섹션 3개, `surface-card` pulse). MVP 는 데스크톱 전용                                                                                                                                                                                                                                                                                                                   |

### E. Tailwind v4 / shadcn 매핑

`src/index.css` 의 `@theme` 에 원문 hex 를 그대로 선언한다. shadcn(`base-nova`, `baseColor: neutral`, `cssVariables: true`) 의 의미 변수는 아래로 **덮어쓴다**.

```css
@theme {
  /* getdesign Claude — 원문 */
  --color-canvas: #faf9f5;
  --color-surface-soft: #f5f0e8;
  --color-surface-card: #efe9de;
  --color-surface-cream-strong: #e8e0d2;
  --color-surface-dark: #181715;
  --color-surface-dark-elevated: #252320;
  --color-surface-dark-soft: #1f1e1b;
  --color-ink: #141413;
  --color-body: #3d3d3a;
  --color-body-strong: #252523;
  --color-muted: #6c6a64;
  --color-muted-soft: #8e8b82;
  --color-hairline: #e6dfd8;
  --color-hairline-soft: #ebe6df;
  --color-primary: #cc785c;
  --color-primary-active: #a9583e;
  --color-primary-disabled: #e6dfd8;
  --color-on-primary: #ffffff;
  --color-on-dark: #faf9f5;
  --color-on-dark-soft: #a09d96;
  --color-accent-teal: #5db8a6;
  --color-accent-amber: #e8a55a;
  --color-success: #5db872;
  --color-warning: #d4a017;
  --color-error: #c64545;
  /* §C 확장 — 대비 실측 반영 */
  --color-primary-wash: #f5ece6;
  --color-primary-text: #994d35;
  --color-success-wash: #e4f0e3;
  --color-success-deep: #27693b;
  --color-error-wash: #f4e3e0;
  --color-error-deep: #a53a3a;
  --color-warning-wash: #f4ebd1;
  --color-warning-deep: #7a5a0c;
  --color-marker-wash: #f6e7d3;
  --color-marker-text: #8a5a1f;
  --color-checkbox-border: #cfc6bb;

  --font-display: 'Noto Serif KR', 'Tiempos Headline', Georgia, serif;
  --font-sans: 'Pretendard Variable', Pretendard, Inter, 'Noto Sans KR', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --shadow-1: 0 1px 3px rgba(20, 20, 19, 0.08);
  --shadow-2: 0 8px 24px rgba(20, 20, 19, 0.12);
}

:root {
  /* shadcn 의미 변수 → 원문 토큰 */
  --background: var(--color-canvas);
  --foreground: var(--color-ink);
  --card: var(--color-canvas);
  --card-foreground: var(--color-ink);
  --popover: var(--color-canvas);
  --popover-foreground: var(--color-ink);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-on-primary);
  --secondary: var(--color-surface-card);
  --secondary-foreground: var(--color-ink);
  --muted: var(--color-surface-soft);
  --muted-foreground: var(--color-muted);
  --accent: var(--color-surface-soft);
  --accent-foreground: var(--color-ink);
  --destructive: var(--color-error);
  --border: var(--color-hairline);
  --input: var(--color-hairline);
  --ring: var(--color-primary);
  --radius: 8px;
}
```

규칙:

- 컴포넌트에서는 **의미 클래스**(`bg-canvas`, `text-body`, `border-hairline`, `bg-success-wash text-success-deep`)만 쓴다. `bg-orange-*`, hex 인라인 금지.
- `bg-primary/10` 같은 런타임 알파 대신 §C 워시 토큰을 쓴다.
- 폰트 로드는 `index.css` 최상단: `@import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"; @import "@fontsource/noto-serif-kr/400.css"; @import "@fontsource/noto-serif-kr/500.css"; @import "@fontsource-variable/jetbrains-mono";`
- `h1` 은 `font-display` 400. `h2` 이하는 `font-sans` 500. 문서 프로즈는 `text-[16px] leading-[1.7]`.
- 포커스: 모든 인터랙티브 요소에 `focus-visible:ring-[3px] ring-primary-wash border-primary` — 인풋만이 아니라 버튼·카드·체크박스·타일에도.

### F. 체크리스트 (머지 전)

- [ ] 화면당 코랄 채움 버튼 1개. 상태 pill 은 중립 + 아이콘/점, 코랄 워시 pill 금지
- [ ] 캔버스 위 코랄 **텍스트**는 `primary-text`(#994d35). `primary` 텍스트 금지
- [ ] 12–13px 텍스트는 `muted`. `muted-soft` 는 플레이스홀더·disabled 전용
- [ ] 의미색은 상태가 있을 때만, 워시+딥 조합으로 (`success-deep` #27693b)
- [ ] 태스크 유형은 아이콘 + 툴팁, 색 없음
- [ ] 다크 표면은 코드 블록·툴팁·토스트에만
- [ ] 그림자는 드래그·토스트·다이얼로그에만. 호버는 배경 한 단계, 링크는 underline
- [ ] 콜아웃·배너는 워시 배경 + 아이콘. 좌측 컬러 보더, 그라데이션, 이모지 금지
- [ ] 페이지 타이틀 serif 400, 그 외 Pretendard. 15px 등 스케일 밖 크기 금지
- [ ] radius: 버튼/인풋/칩 8 · 카드/패널/컬럼 12 · 다이얼로그 16 · 뱃지 pill
- [ ] 아바타 24, 다이얼로그 타이틀 22/500, 아이콘 버튼 36
- [ ] 문체: 시스템 합니다체·명사형 / Navi 발화 해요체. 한 문단 안에서 섞지 않음
- [ ] 문구는 spec 원문 그대로: "예제 텍스트 N건이 남아 있습니다", "미결정 N건이 남아 있습니다", "개발 준비됨"
- [ ] 제안 상태 6종(pending·rejecting·rejected·stale·applying·applied)과 패널 상태(streaming·no_change·error)가 모두 구현됨
- [ ] 템플릿 섹션은 백엔드 md 가 정본 — 프론트에 섹션명·완료 조건 하드코딩 없음. "완료 조건" 문구는 어디에도 쓰지 않는다
