---
version: alpha
name: Atlassian
website: "https://www.atlassian.com"
description: >-
  Atlassian's homepage runs the company's open Atlassian Design System tokens live in the DOM — 468 `--ds-*` custom properties on `:root`, a white canvas (#ffffff) anchored on near-black ink (#101214), navy display headlines, and a single Atlassian Blue (#1868db) reserved for the primary "Get started with Jira" pill that sits at 10000px corner radius. Display type is Charlie Display at weight 500–600 (up to 84px on the hero), with Charlie Text running the body and nav at 16–20px. The system reads as the work-platform pattern at scale — quiet chrome, dense semantic token vocabulary, one chromatic gate for the action.
seo:
  title: "Atlassian Design System for React — Charlie Display, #1868db, 22 components"
  metaDescription: "Atlassian's design system as a DESIGN.md file. Charlie Display, Atlassian Blue #1868db, 468 :root vars, 22 components — for React, Next.js, and AI tools."
  highlights:
    - "Live design tokens on `:root` — 468 `--ds-*` custom properties render every brand and structural color"
    - "Single Atlassian Blue voltage — `#1868db` fills the Jira CTA pill and link role; navy `#1c2b42` carries deep brand fills"
    - "Two-typeface pairing — Charlie Display at 84px weight 600 for hero, Charlie Text at 16–20px for body and nav"
    - "Pill geometry on the primary CTA — `10000px` radius button against 3px and 20px card corners elsewhere"
    - "Semantic-token chrome — names like `--ds-background-brand-bold` (`#1868db`) and `--ds-background-brand-boldest` (`#1c2b42`) ship straight to the page"
  tags:
    - "Project Management"
    - "Productivity & SaaS"
  lastUpdated: "2026-05-13"
  author:
    name: "Dov Azencot"
    url: "https://x.com/dovazencot"
  opening: |
    Atlassian's marketing surface is the rare enterprise homepage that ships its design tokens to the browser as `--ds-*` custom properties — 468 of them on `:root`, each carrying a hex value the DOM resolves at paint time. The canvas is pure white (`#ffffff`) and ink sits in a near-black (`#101214`); the only true chromatic event is Atlassian Blue (`#1868db`), bound to the `--ds-link` and `--ds-background-brand-bold` roles and reserved for the hero CTA pill ("Get started with Jira"). Display type is Charlie Display at 84px weight 600 across "Unleash your teams and their agents"; body and nav drop to Charlie Text at 16–20px weight 400. Where most enterprise homepages drown the action in three competing buttons and a gradient hero, Atlassian gates the entire above-the-fold composition through one blue pill.
    The DESIGN.md file packages 22 color tokens, 11 typography styles, 6 corner radii, 8 spacing values, and 22 components. Colors split into ink (`#101214`, `#292a2e`, `#505258`, `#63666b`), surface (`#ffffff`, `#dddee1`, `#e9f2fe`), brand voltage (`#1868db` link / `#1c2b42` boldest navy / `#1558bc` pressed), and a semantic chart family (`#22a06b` green, `#357de8` blue, `#af59e1` purple, `#ae2e24` red) inherited from the open Atlassian Design System. The format is the Google Labs DESIGN.md spec — token references like `{colors.brand-bold}` and `{typography.display-xl}` that designers and AI agents can both parse without translation.
    Feed the file to Claude, Cursor, or GitHub Copilot and the agent reproduces Atlassian's specific gate: a white canvas, navy headlines, Charlie at weight 500 for display and 400 for body, and Atlassian Blue scoped to a single 10000px pill per viewport. Reference the tokens directly inside Tailwind config, CSS variables, or paste the component block into a brand audit. The discipline worth studying is the refusal of the enterprise CTA stack — Atlassian commits to one primary action per fold, lets the navy boldest fill `#1c2b42` carry the dark sections, and trusts product mockups in white cards to do the persuasion work decorative gradients do elsewhere.
  related:
    - href: "/design"
      title: "Browse all design systems"
      description: "The full directory of DESIGN.md files on shadcn.io, with live mockups for each."
    - href: "https://atlassian.design"
      title: "Atlassian Design System"
      description: "The open design system Atlassian ships — token names, components, and accessibility guidance."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs' open spec for machine-readable design system files — the format this page is built on."
  questions:
    - id: "primary-color"
      title: "What is Atlassian's primary brand color?"
      answer: "Atlassian's link-and-action voltage is Atlassian Blue (`#1868db`), bound to the `--ds-link`, `--ds-background-brand-bold`, and `--ds-icon-brand` token roles. It fills the hero CTA pill ('Get started with Jira') and every primary link. The pressed state shifts to `#1558bc` (`--ds-link-pressed`), and the boldest brand fill steps up to navy `#1c2b42` (`--ds-background-brand-boldest`) for the dark Teamwork Graph band. Everything else on the page is greyscale: ink `#101214`, subtle text `#505258`, hairline `#dddee1`."
    - id: "dark-mode"
      title: "Does Atlassian's homepage use a dark mode?"
      answer: "The mainline marketing surface commits to white. Canvas is `#ffffff`, with the inverse-canvas token (`--ds-background-inverse-subtle`) at `#000000` reserved for the dark Teamwork Graph showcase band near the bottom of the page. The Atlassian Design System ships a full dark theme for product UI (Jira, Confluence), but the homepage stays light — the only dark stretch is that single anchored band, where text inverts to `#ffffff` against `#000000` and brand voltage stays `#1868db`."
    - id: "typography"
      title: "What typography does Atlassian use, and what should I use if Charlie isn't available?"
      answer: "Atlassian runs two proprietary families: Charlie Display for hero and section heads, Charlie Text for body, nav, and labels. The hero h1 sits at 84px weight 600 lineHeight 84px on Charlie Display; h2 ranges 32–68px weight 500; body p sits at 18–24px weight 400 on Charlie Text. Inter at weight 500 is the closest open substitute for Charlie Display; Inter at weight 400 covers Charlie Text. The system falls back to a long native stack (`-apple-system`, `system-ui`, `Segoe UI`, `Roboto`, `Oxygen`, `Ubuntu`, `Fira Sans`, `Droid Sans`, `Helvetica Neue`) before sans-serif, so the cascade degrades gracefully without Charlie."
    - id: "shape-language"
      title: "Why is the primary CTA a `10000px` pill while cards are `20px`?"
      answer: "Atlassian gates the radius scale by component role. The Jira CTA sits at `10000px` (the engineering shorthand for a true pill) — the highest-affordance shape in the system, signalling 'tap this'. Feature cards and the Teamwork-platform tabs run `20px` radius, which is rounded but rectangular. Form fields and chips sit at `3px` (`--ds-border-radius`) — the engineered-control register. Brand logos and avatars use `100%`. The result is a deliberate three-tier shape language: pill for the single primary action, large-rounded for content cards, near-square for input chrome."
    - id: "css-variables"
      title: "Why does Atlassian ship 468 CSS custom properties on `:root`?"
      answer: "Atlassian's design tokens system (`@atlaskit/tokens`) compiles every semantic role — `--ds-text`, `--ds-background-brand-bold`, `--ds-border-selected`, `--ds-chart-categorical-1`, `--ds-icon-discovery` — into a CSS variable injected at the document root. Every component in the page resolves color through that indirection rather than hardcoding hex values, which is how Atlassian flips the entire product to dark mode at the token layer. The marketing site inherits the same `--ds-*` vocabulary, so the same tokens that style Jira boards also style the homepage hero pill."
    - id: "use-in-project"
      title: "How do I use this DESIGN.md to build a React project?"
      answer: "Feed the file to Claude, Cursor, or any agent that reads structured tokens — the AI will reproduce Atlassian's gate: white canvas, navy headlines, Atlassian Blue scoped to one pill per fold. Reference the 22 color tokens, 11 type styles, and 22 components directly: every value is a quoted hex or px size you can paste into Tailwind config, CSS variables, or a `:root` block that mirrors `--ds-*` naming. Combine with shadcn/ui primitives — the `button-primary` recipe (background `#1868db`, text `#ffffff`, radius `10000px`, padding `14px 26px`, height `58px`) maps onto `Button` with one variant override."

colors:
  brand-bold: "#1868db"
  brand-bold-hover: "#1558bc"
  brand-boldest: "#1c2b42"
  link: "#1868db"
  link-pressed: "#1558bc"
  ink: "#101214"
  ink-neutral-bold: "#292a2e"
  ink-subtle: "#505258"
  ink-subtlest: "#63666b"
  ink-on-dark: "#ffffff"
  canvas: "#ffffff"
  surface-pressed: "#dddee1"
  surface-selected: "#e9f2fe"
  inverse-canvas: "#000000"
  hairline: "#dddee1"
  hairline-strong: "#b7b9be"
  chart-green: "#22a06b"
  chart-blue: "#357de8"
  chart-teal: "#2898bd"
  chart-purple: "#af59e1"
  chart-purple-bold: "#803fa5"
  chart-red: "#ae2e24"
  chart-orange: "#c75300"
  text-success: "#4c6b1f"

typography:
  display-xl:
    fontFamily: "Charlie Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 84px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0
  display-lg:
    fontFamily: "Charlie Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 68px
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: 0
  display-md:
    fontFamily: "Charlie Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 52px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: 0
  display-sm:
    fontFamily: "Charlie Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: 0
  display-xs:
    fontFamily: "Charlie Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  subhead:
    fontFamily: "Charlie Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0.3px
  body-lg:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  body-md:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.44
    letterSpacing: 0
  body-md-strong:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.44
    letterSpacing: 0
  body-sm:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  eyebrow:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.13
    letterSpacing: 0.3px
  button-md:
    fontFamily: "Charlie Text, -apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0

rounded:
  none: "0px"
  xs: "3px"
  sm: "4px"
  md: "10px"
  lg: "20px"
  xl: "40px"
  full: "10000px"
  circle: "100%"

spacing:
  xxs: "4px"
  xs: "6px"
  sm: "8px"
  md: "16px"
  base: "20px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
  section: "64px"
  gutter: "136px"

components:
  button-primary:
    backgroundColor: "{colors.brand-bold}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "14px 26px"
    height: "58px"
  button-primary-hover:
    backgroundColor: "{colors.brand-bold-hover}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "14px 26px"
    height: "58px"
  button-primary-pressed:
    backgroundColor: "{colors.link-pressed}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "14px 26px"
    height: "58px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "14px 26px"
    border: "1px solid {colors.hairline-strong}"
    height: "58px"
  button-on-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "14px 26px"
    height: "58px"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    height: "72px"
    padding: "10px 16px"
  nav-link:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    height: "44px"
  hero-heading:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.none}"
    padding: "0"
  product-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "32px"
    border: "1px solid {colors.hairline}"
  product-card-dark:
    backgroundColor: "{colors.brand-boldest}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "32px"
  featured-card-brand:
    backgroundColor: "{colors.brand-bold}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "32px"
  tab-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.body-md-strong}"
    rounded: "{rounded.full}"
    padding: "8px 32px"
  tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.body-md-strong}"
    rounded: "{rounded.full}"
    padding: "8px 32px"
  eyebrow-label:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.none}"
    padding: "0"
  link-text:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.link}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "0"
  badge-news:
    backgroundColor: "{colors.surface-selected}"
    textColor: "{colors.link}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  chart-tile-green:
    backgroundColor: "{colors.chart-green}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: "24px"
  chart-tile-purple:
    backgroundColor: "{colors.chart-purple}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: "24px"
  chart-tile-orange:
    backgroundColor: "{colors.chart-orange}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: "24px"
  section-dark:
    backgroundColor: "{colors.inverse-canvas}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "64px 136px"
  divider:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    height: "1px"
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "64px 136px"
---

## Overview

Atlassian's homepage is the rare enterprise marketing surface that ships its design system tokens to the browser as live `--ds-*` CSS custom properties — 468 of them on `:root`, each carrying a hex value the DOM resolves at paint time. The canvas commits to white (`#ffffff`); ink runs near-black (`#101214`); the single chromatic event above the fold is Atlassian Blue (`#1868db`), bound to the `--ds-link` and `--ds-background-brand-bold` roles and reserved for the hero CTA pill at `10000px` corner radius.

**Token transparency**: the marketing site does not transcode design tokens into one-off marketing CSS — it loads the same `--ds-background-brand-bold`, `--ds-text`, and `--ds-border` vocabulary that styles Jira and Confluence inside the product, then resolves them on `:root`. The hex behind the Jira CTA pill (`#1868db`) is the same value an Atlaskit button renders in the app. Where most enterprise homepages route brand color through Webflow custom fields and bespoke marketing variables, Atlassian routes it through the same token graph the engineering team ships to product.

Display type is **Charlie Display** at weight 500–600, hitting 84px on the hero h1 ("Unleash your teams and their agents") with line-height equal to font-size (a tight 1.0 ratio). Body and nav drop to **Charlie Text** at 16–20px weight 400 with line-height 1.3–1.5. The hierarchy is engineered: there are no decorative weights between display and body — the brand earns presence through size jumps (84 → 52 → 32 → 24 → 18), not through bolds. Atlassian also runs a **semantic chart family** — green `#22a06b`, blue `#357de8`, purple `#af59e1`, red `#ae2e24`, teal `#2898bd` — pulled from the product's analytics surfaces and dropped into homepage product-tile illustrations.

**Key Characteristics:**

- **Single action gate**: every fold contains exactly one Atlassian Blue pill (`#1868db`); secondary actions are white pills with hairline borders.
- White canvas (`#ffffff`) all the way down except for one anchored dark band (`#000000`) at the Teamwork Graph showcase.
- Charlie Display for hero and section heads, Charlie Text for nav and body — two families, no third.
- Pill geometry (`10000px`) only on buttons and chips; cards stay at `20px`, form fields at `3px`.
- Navy boldest (`#1c2b42`) carries dark product-card fills — `--ds-background-brand-boldest` resolved straight to the page.
- The chart family (`#22a06b`, `#357de8`, `#af59e1`, `#ae2e24`) appears only inside product-tile illustrations, never as section backgrounds.

## Colors

- **Atlassian Blue (`#1868db`)** — frequency 39. Used as text (18), border (18), background (3). Bound to `--ds-link`, `--ds-background-brand-bold`, `--ds-icon-brand`, `--ds-border-selected`, `--ds-text-brand`. The page's single chromatic voltage — the Jira CTA pill, every link, every focus indicator.
- **Atlassian Blue pressed (`#1558bc`)** — frequency 10. Used as text (3), background (4), border (3). The `--ds-link-pressed` and `--ds-background-brand-bold-hovered` value — never appears at rest, only on active and hover states of the primary.
- **Brand boldest navy (`#1c2b42`)** — frequency 158. Used as text (79), border (79). Bound to `--ds-background-brand-boldest`. The dark fill for product cards that need brand atmosphere — appears across the "Featured apps" tiles and the Teamwork Platform header strip.
- **Ink primary (`#101214`)** — frequency 274. Used as text (133), bg (8), border (133). The page's load-bearing text color, bound to `--ds-border` and `--ds-skeleton-subtle`. Reserved for headlines, body type, and the selected tab fill.
- **Ink neutral-bold (`#292a2e`)** — frequency 81. Used as text (41), border (40). The `--ds-text` and `--ds-icon` value — secondary type and default icon stroke.
- **Ink subtle (`#505258`)** — frequency 54. Used as text (27), border (27). Bound to `--ds-text-subtle` and `--ds-icon-subtle` — the workhorse for supporting paragraphs and inactive tabs.
- **Ink subtlest (`#63666b`)** — frequency 4. Used as text (2), border (2). The `--ds-text-subtlest` quietest grade — captions and legal type.
- **Canvas white (`#ffffff`)** — frequency 240. Used as text (113), bg (11), border (111), shadow (5). The default surface and `--ds-surface`. Also serves as inverse ink against the navy dark band.
- **Inverse canvas (`#000000`)** — frequency 1049. Used as text (524), border (524), bg (1). Resolves through `--ds-UNSAFE-transparent` (the alpha-overlay token) and the dark `--ds-background-inverse-subtle` band — most occurrences are transparent borders rather than fills.
- **Surface pressed (`#dddee1`)** — frequency 2. Used as bg (1), border (1). The `--ds-surface-pressed` hairline color — depressed-state fills on overlay cards.
- **Selected surface (`#e9f2fe`)** — frequency 4. Used as bg (4). Bound to `--ds-background-selected` and `--ds-background-brand-subtlest` — the pale blue tint behind selected chips and badges.
- **Hairline strong (`#b7b9be`)** — frequency 1. Used as border (1). The `--ds-border-input` value — applied to text-input outlines that lack a specific brand border.
- **Chart green (`#22a06b`)** — frequency 0. Bound to `--ds-border-accent-green` and `--ds-chart-green-bold`. Reserved for product-tile illustration accents, never as a section background.
- **Chart blue (`#357de8`)** — frequency 0. Bound to `--ds-chart-brand` and `--ds-chart-categorical-1` — the analytics-categorical-1 hex inside dashboard mockups.
- **Chart purple (`#af59e1`)** — frequency 0. Bound to `--ds-icon-discovery` and `--ds-chart-purple-bolder` — the "Discovery" semantic in product UI screenshots.
- **Chart red (`#ae2e24`)** — frequency 0. Bound to `--ds-text-danger` — danger semantic, no marketing exposure on the homepage above the fold.
- **Chart orange (`#c75300`)** — frequency 0. Bound to `--ds-chart-warning-bold` — warning semantic inside dashboard mockups.

## Typography

Two proprietary families, no third. **Charlie Display** carries the hero h1 at 84px weight 600 with line-height 84px — a tight 1.0 ratio that pulls "Unleash your teams and their agents" into a dense two-line block. Section heads step down 68 → 52 → 32 px at weight 500 with line-height 1.10–1.15. The 28px tier (display-xs) drops to weight 400 — Atlassian uses size, not bold, to mark hierarchy from there down.

**Charlie Text** covers body, nav, and labels at 16–24px weight 400. The two flavors live at 16px line-height 1.5 (long-form paragraphs) and 18–20px line-height 1.44–1.30 (subheads inside cards). Eyebrow labels use weight 500 with letter-spacing `0.3px` — the only place positive tracking appears.

The fallback chain is a long native stack: `-apple-system, system-ui, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`. If Charlie isn't licensed, **Inter** at weight 500 for display and 400 for body is the closest open substitute; **Geist Sans** also works. Avoid native Helvetica fallback — its heavier x-height clashes with Charlie's narrower letterforms.

## Layout

The grid is centered with a maximum content width near `1168px` and side gutters that step to `136px` on wide viewports (the `0px 136px` padding pattern appears 11 times in the extracted spacing histogram). Sections stack vertically with `64px` of vertical rhythm between major bands. Inside sections, content blocks use `32px` between heading and supporting copy, `24px` between sibling cards, and `8px` for micro-spacing inside list items.

The hero uses centered alignment with the heading at `968px` width — type spans nearly the whole content frame, leaving only the side gutters as breathing room. Below the fold, three-tile card grids replace center alignment; tiles run at equal width with `24px` gutters and `32px` internal padding. The Teamwork Platform tabs sit inside a centered pill row, then unfold into a single full-width product-mockup card.

## Elevation & Depth

Atlassian leans on **hairline + surface contrast** rather than drop shadows for elevation. The canvas is `#ffffff`; cards on the canvas use a 1px hairline border in `#dddee1` (`--ds-border`) to lift off without a shadow. The only documented shadow surfaces live behind the white floating cards inside the Teamwork Graph dark band, where elevation reverses — cards float off `#000000` with a soft `--ds-shadow-overflow` glow.

The Atlassian Design System ships `--ds-elevation-surface-current`, `--ds-elevation-surface-raised`, `--ds-elevation-surface-overlay` tokens that resolve to `#ffffff` on light mode — the elevation differentiator is z-index and shadow alpha, not surface color. The marketing homepage uses two elevation tiers (`current` for body content, `raised` for floating mockup cards) and skips the overlay tier entirely.

## Shapes

Three-tier radius language by component role: `10000px` (pill) on the primary CTA and chip badges, `20px` (rounded-lg) on feature cards and product tiles, `3px` (rounded-xs) on form fields and inputs. The `40px` value appears on a handful of large illustration containers — never on type-bearing components.

A `100%` (circle) radius is reserved for brand-logo avatars and the Atlassian logo lockup. The pill is gated to interactive surfaces; cards are gated to content surfaces; the near-square `3px` is gated to engineered-control surfaces. Atlassian deliberately avoids the mid-range `8–12px` register — the gap between `3px` and `20px` signals to the reader which components are containers and which are inputs.

## Components

- **`button-primary`** — Atlassian Blue (`#1868db`) fill, white text, Charlie Text 20px weight 400, `10000px` radius, padding `14px 26px`, height `58px`. The Jira CTA — one per fold.
- **`button-primary-hover`** — same geometry, fill shifts to `#1558bc` (the `--ds-background-brand-bold-hovered` value).
- **`button-secondary`** — white fill, ink text, 1px `#b7b9be` border, same `10000px` radius — pairs alongside primary as the muted alternative.
- **`button-on-dark`** — white pill with ink text, used on the navy and black bands.
- **`top-nav`** — white canvas, ink text, Charlie Text 16px, 72px height with `10px 16px` padding per link.
- **`nav-link`** — flat 44px height, no border, ink at default and `#1868db` on hover.
- **`hero-heading`** — Charlie Display 84px weight 600 line-height `84px`, no padding, no border, sits centered at `968px` width.
- **`product-card`** — white canvas, 1px `#dddee1` hairline, `20px` radius, `32px` padding — the workhorse content tile.
- **`product-card-dark`** — navy boldest fill (`#1c2b42`), white text — appears in the "Featured apps" trio for emphasis.
- **`featured-card-brand`** — Atlassian Blue (`#1868db`) fill, white text — the singular branded tile in the product-tile grid.
- **`tab-default`** / **`tab-selected`** — pill chips at `10000px` radius, padding `8px 32px`. Default is white-on-ink-subtle; selected flips to ink fill with white text.
- **`eyebrow-label`** — Charlie Text 16px weight 500, letter-spacing `0.3px` uppercase — the only place positive tracking appears.
- **`link-text`** — inherits body-md sizing with `#1868db` ink — used inline inside paragraphs.
- **`badge-news`** — pale blue (`#e9f2fe`) fill, blue text, pill radius — the "On Demand Now Available" announcement chip.
- **`chart-tile-{green,purple,orange}`** — saturated chart-family fills, white text, `20px` radius — the colored product-tile trio at "Fueled by Atlassian's latest AI innovations".
- **`section-dark`** — `#000000` fill, white text, `64px 136px` padding — the Teamwork Graph anchored band.
- **`divider`** — 1px hairline at `#dddee1` — section breaks above the footer.
- **`footer`** — white canvas, ink-subtle text, Charlie Text 12px caption sizing, `64px 136px` padding.

## Do's and Don'ts

**Do** use `#1868db` (`{colors.brand-bold}`) exclusively for the primary CTA, inline links, and focus indicators. The hex shows up as a text color 18 times in the page, as a border 18 times, as a background 3 times — almost every appearance is for an interactive role.

**Do** stack hierarchy through size, not weight. Display drops 84 → 68 → 52 → 32 → 28 with weight 500–600 at the top and weight 400 by 28px. Add a bold at 28px and the page reads as a marketing one-pager, not the Atlassian product surface.

**Don't** apply `10000px` pill radius to anything except buttons, chips, and pill badges. Use it on a `200px`-tall card and the card reads as a giant button. Cards belong at `{rounded.lg}` (`20px`); form fields belong at `{rounded.xs}` (`3px`).

**Don't** use `#1c2b42` for body text. The navy boldest is a background fill bound to `--ds-background-brand-boldest` — its contrast against `#ffffff` is fine for type at display sizes but fails the WCAG ratio against pale tints. For text on white, use `#101214` ink instead.

**Don't** combine the chart family (`#22a06b`, `#357de8`, `#af59e1`, `#ae2e24`) with the brand voltage `#1868db` in the same component. The chart hexes are categorical tokens for analytics surfaces; pulling them into marketing chrome breaks the semantic gate Atlassian maintains between product UI and homepage.

**Don't** swap Charlie Display for Charlie Text on the hero. Charlie Display is the only family designed for tight `lineHeight: 84px` at `fontSize: 84px` — Charlie Text at the same size opens the tracking and breaks the engineered density of "Unleash your teams and their agents".

## Known Gaps

- **Form-input styling** — the homepage does not expose a text-input component (the extractor returned `input: null`). The `--ds-background-input` token (`#ffffff`) and the implied `#b7b9be` border outline an input recipe but Atlassian's full form chrome lives on signup pages, not the marketing hero.
- **Dark-mode product UI** — Atlassian Design System ships a full dark theme for Jira and Confluence; the homepage stays light except for the single Teamwork Graph band. This DESIGN.md captures the marketing track only.
- **Motion and animation timings** — Atlassian uses entrance animations on tile reveals and tab transitions; durations and easings are not exposed via `--ds-*` properties on `:root`.
- **Charlie Display and Charlie Text are proprietary** — Inter at weight 500/400 is the closest open substitute.
- **The 468 `--ds-*` variables include token roles not surfaced on this homepage** (warning, danger, success, discovery semantics) — they ship to `:root` because the page imports the full design-token stylesheet, but most don't paint pixels above the fold.
