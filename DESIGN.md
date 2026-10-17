---
name: PitStopHub
description: A black, media-first motorsport feed where white is the interface and red is reserved for what is about to happen.
colors:
  carbon: "#000000"
  asphalt: "#0e0e10"
  panel-raised: "#17171a"
  panel-low: "#121214"
  panel-high: "#1e1e22"
  panel-highest: "#26262b"
  line-strong: "#2a2a2e"
  white: "#ffffff"
  on-surface: "#f4f4f6"
  silver: "#b9b9c0"
  silver-dim: "#8f8f98"
  outline: "#6f6f78"
  outline-variant: "#3a3a40"
  racing-red: "#e10600"
  signal: "#ff5a4f"
  positive-green: "#4ae176"
  field-steel: "#9aa5b8"
typography:
  display-hero:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline-lg:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline-md:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline-sm:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body-lg:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 450
    lineHeight: 1.55
  body-md:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  counter:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  label-badge:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0.01em"
    fontFeature: "tnum"
  label-telemetry:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.01em"
    fontFeature: "tnum"
  reel-title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  2xl: "1.5rem"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  gutter: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.carbon}"
    typography: "{typography.label-badge}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-following:
    backgroundColor: "{colors.racing-red}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    height: "44px"
  glyph-button:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    size: "44px"
  glyph-button-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.carbon}"
  pill-strip-item:
    textColor: "{colors.silver}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 16px"
  pill-strip-item-selected:
    backgroundColor: "{colors.white}"
    textColor: "{colors.carbon}"
  list-group:
    backgroundColor: "{colors.asphalt}"
    rounded: "{rounded.2xl}"
  rail-row:
    textColor: "{colors.silver}"
    rounded: "{rounded.md}"
    height: "44px"
  rail-row-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.carbon}"
  sheet:
    backgroundColor: "{colors.asphalt}"
    rounded: "{rounded.2xl}"
  toast:
    backgroundColor: "{colors.white}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.pill}"
---

# Design System: PitStopHub

## Overview

**Creative North Star: "The Reel"**

PitStopHub is a vertical media feed for motorsport. A black stage holds one race at a time: the category tints only the backdrop, the race title sits at the bottom left in heavy Archivo, and a rail of four round glyphs sits at the right. Everything that is not the feed is quiet: neutral black panels, white interface, silver text. The system is code-led and operational: it answers "what starts next and how fresh is this data" before anything decorative.

White is the only interface colour. Red is a signal, not a theme: it appears for the next start, for live, and for "following", and nowhere else. Data freshness is carried by form, not colour (a solid, dashed or half bar), so legibility does not depend on hue.

The UI is in Portuguese, sentence case throughout, one type family, tabular numerals wherever numbers align.

**Key Characteristics:**
- Pure black ground, neutral panels with no blue or wine cast.
- White as the interface colour; red reserved.
- One family (Archivo), heavy weights for titles, minimum text size 12px.
- Round controls (pills and 44px glyphs), large-radius panels.
- Depth by tonal layering and hairlines; no decorative shadows.
- Category colour lives in the media field only.

## Colors

A black stage with white interface, silver text tiers, and a single reserved red.

### Primary
- **Interface White** (`white`, #ffffff): primary buttons, selected pills and tabs, active rail row, active glyph, toast, focus ring, text selection. This is the primary token in the CSS (`--color-primary`).
- **Racing Red** (`racing-red`, #e10600): only the next start / live pulse dot, the "following" state (active follow glyph, following button, red dot on followed rows and on the alerts bell when a followed race is within 48 h), and the intro rule and "Hub" wordmark.
- **Signal Red** (`signal`, #ff5a4f): the legible variant of the brand red when red must be text on black. Defined as a token; the brand red itself is not used for text.

### Tertiary
- **Positive Green** (`positive-green`, #4ae176): only for positive deltas (points gained, moving up). Never decorative.

### Neutral
- **Carbon** (`carbon`, #000000): page ground, rail, top bar, bottom nav, reel stage.
- **Asphalt** (`asphalt`, #0e0e10): panels, list groups, fact lists, sheets, segmented track.
- **Raised Panel** (`panel-raised`, #17171a): container and raised surfaces; lower (#121214), high (#1e1e22) and highest (#26262b) complete the container steps.
- **Line Strong** (`line-strong`, #2a2a2e): `surface-border` and bright surface.
- **Silver** (`silver`, #b9b9c0): secondary text, inactive controls.
- **Silver Dim** (`silver-dim`, #8f8f98): tertiary text, inactive nav labels, group headings. Source states all text tiers hold at least 4.5:1 on #000 and #0e0e10.
- **On Surface** (`on-surface`, #f4f4f6): default body colour.
- **Outline** (#6f6f78) and **Outline Variant** (#3a3a40; also the thin scrollbar thumb).
- **Hairlines**: white at 12% (`hairline`) and 7% (`hairline-soft`) for borders and dividers.

### Category field hues
Each of the 14 categories has one hue in `CATEGORY_ACCENTS` (e.g. F2 #0093cc, F3 #ff8700, WEC #00a19b, WRC #22c55e). They tint only the reel and tile backdrop (radial gradient at 46% and 18% mixed into black). **F1's field is steel (`field-steel`, #9aa5b8)**, which is also the fallback, so the brand red is never a category tone. Team colours appear only as thin data marks and as the field override on a driver page.

### Named Rules
**The Reserved Red Rule.** Red means next start, live, or following. If a red element is none of those, it is wrong.
**The Field Only Rule.** Category hues colour the backdrop and nothing else: no text, buttons, borders or chart series.
**The Positive Only Rule.** Green appears only for a positive delta.

## Typography

**Display, Body and Label Font:** Archivo (variable, with ui-sans-serif, system-ui, sans-serif). Every legacy font alias (`anybody`, `inter`, `mono-tel`, `display`, `apex`) points to Archivo.

**Character:** A single heavy grotesque. Hierarchy comes from weight (800 for titles, 400-450 for reading) and tight tracking on large sizes, not from a second face.

### Hierarchy
- **Reel title** (800, 2rem / 2.5rem sm / 3.5rem lg, line-height 0.98, tracking -0.035em, balanced, max 3 lines): the race name on every reel item. The spotlight variant is 1.875 / 2.25 / 2.75rem.
- **Reel date line** (700, 1.125rem / 1.5rem lg, tabular): the start day and time, with the time zone in silver.
- **Display hero** (800, 2.25rem, 1.0, -0.03em): page-level hero numerals and titles.
- **Headline lg** (800, 1.75rem, 1.12): category page title (2.25rem at lg).
- **Headline md** (700, 1.25rem, 1.2): section titles, sheet titles.
- **Headline sm** (700, 1rem, 1.3): list row titles, fact values.
- **Body lg / md / sm** (450 / 400 / 400; 1.0625 / 0.9375 / 0.8125rem; 1.55 / 1.5 / 1.45): reading text capped at 68ch; md for lists; sm for secondary lines.
- **Counter** (700, 1.5rem, tabular): countdown numerals (2.25rem in the large variant, 800).
- **Label badge / telemetry** (650 / 500, 0.75rem, +0.01em, tabular): pills, tabs, legends, dates. 0.75rem is the floor.

### Named Rules
**The One Family Rule.** Archivo only. No second display face.
**The Sentence Case Rule.** Labels and headings are sentence case. Tracking on labels stays at 0.01em.
**The Tabular Rule.** Any number that lines up (countdowns, dates, standings, facts) uses tabular numerals.

## Layout

At 1024px and above a fixed 264px rail holds the logo, search, Home, Agenda, Explore, the 14 grouped categories, the pinned state legend and the profile and alerts actions; content is offset by 264px. Below 1024px a 56px top bar (logo, search, alerts) and a 68px bottom nav with four equal items (Home, Agenda, Categories, Profile) replace it. Inner pages are centred in a 1180px column with 32px side padding at lg; Home is full bleed.

Spacing tokens: 4, 8, 12 (gutter), 16 (margin and md), 24, 32px. Page margin is 16px.

Home is the signature layout. Below 1280px the reel runs down the page with proximity snapping and the standings and agenda column follows. At 1024-1279px the reel fills the viewport height beside the rail. From 1280px the reel becomes its own scroller (sticky, full viewport height) with mandatory snap and `scroll-snap-stop: always`, next to a 400px aside (standings and agenda, scrolling on its own, hairline left border). Each item is the reel height minus a 4.75rem peek, so the next item's top and a "next" pill are always visible; the last item fills the height.

## Elevation & Depth

Tonal layering, not shadow. Black stage, asphalt panels, hairline borders (12%), and scrims: a black gradient under reel text, 75% black behind sheets. Floating glyphs and the next pill use 45-60% black fill with a 10px backdrop blur and a white 15-20% border. The only shadows in the build are the toast (`0 8px 30px rgba(0,0,0,0.5)`) and the champion cards (soft, black, blurred); both are diffuse, never offset-hard.

### Named Rules
**The Tonal Depth Rule.** Panels separate from the stage by step and hairline, not by shadow.

## Shapes

Round controls, large panels. Buttons, pills, segmented tracks, glyphs and toasts are fully round (999px; glyphs 44px circles). Rail rows and search field are 0.75rem. Lists, fact lists, empty states and skeletons are 1.5rem (`rounded-2xl`). Spotlight is 1.5rem+ (`rounded-3xl`). Sheets are `rounded-t-3xl` on mobile and `rounded-3xl` centred from 768px. Focus ring: 2px white, 3px offset.

## Components

### Buttons
- **Shape:** pill, 44px tall, 20px side padding, label-badge at 0.875rem.
- **Primary:** white fill, black text; hover white at 85%.
- **Secondary:** white 30% outline, hover 10% white fill. **Ghost:** silver text only.
- **Following:** primary turns racing-red with white text (CategoryHeader).
- **Motion:** colour and transform, 200ms; press scales to 0.97.

### GlyphButton
44px circle holding a 22px icon with an optional 12px label below in white with a soft text shadow. Rest: 45% black, blur, white 15% border. Active: white fill, black icon; the follow glyph alone uses red when active. Press scales to 0.9.

### PillStrip and Segmented
PillStrip: 36px filter chips (13px label), selected = white fill, others 20% white outline in silver; wraps from 768px, scrolls horizontally below. Segmented: asphalt pill track with a 1px hairline, selected segment white on black text, 36px segments.

### StateMark and StateLegend
A 3px bar, 1.125rem wide, drawn in current colour: solid = live, dashed = daily, half width = catalog. The legend lists all three; it is pinned in the rail and shown in the category drawer.

### FactList and ListGroup
Asphalt panel, hairline border, 1.5rem radius, 7% dividers. FactList rows put a silver 13px label left and a white 700 tabular value right.

### CategoryHeader tabs
Category name (headline lg), state mark with name, follow button and (below lg) a drawer switch. Tabs (Resumo, Calendario, Classificacao, Grid, Como funciona when rules exist) are 44px text links on a hairline; active = white text with 2px white underline.

### CategoryList rail rows
Grouped list under silver-dim group headings. Rows are 44px: state mark, name, a 6px red dot if followed, and the next race date in tabular silver-dim at right. Active row inverts to white fill with black text.

### RaceSpotlight and ReelBackdrop
ReelBackdrop is the shared stage: category-hue radial field over black, the circuit map (92% wide, 50% tall) when it exists or else the car silhouette as a 34% opacity hue-tinted mask, then a bottom black scrim. RaceSpotlight reuses it in a 3xl-radius, hairline card (min height 18rem, 24rem at lg) with title, date, status or countdown, and place.

### Reel and ReelCard (signature)
One race per item: title, date line, status (live tag with pulsing red dot, awaiting, wrapped, time to be confirmed, or countdown), place with pin, then the category link with its state mark and round counter. Right rail, top to bottom: Seguir, Agenda (hidden when wrapped), Compartilhar, Abrir. Only the active item's controls are in the tab order; ArrowUp and ArrowDown move between items.

### Sheet and Toast
Sheet: bottom sheet on mobile, centred max 32rem panel from 768px, asphalt, hairline, 64px sticky header with 44px close, spring entry (stiffness 380, damping 34) over a 75% black scrim; closes on Esc, restores focus, locks page scroll. Toast: white pill with black text and icon, bottom 6rem on mobile and 2rem from 768px, 200ms rise of 12px, 2.4s (5s with an action).

### Motion
150-250ms. Page entry is 220ms with `cubic-bezier(0.16, 1, 0.3, 1)` (opacity and 6px rise, once). Transitions 200ms on colour and transform. Reduced motion: page-in off, pulse/ping off, smooth scroll off (reel and `goTo` use auto).

## Do's and Don'ts

### Do:
- **Do** use white for every interactive emphasis and reserve #e10600 for next start, live and following.
- **Do** use `signal` (#ff5a4f) if red must be text.
- **Do** show data freshness with the state mark shape (solid, dashed, half), with its text name beside it.
- **Do** keep controls at least 44px and text at least 12px (0.75rem).
- **Do** use tabular numerals for aligned numbers and sentence case for labels.
- **Do** tint only the media field with the category hue; keep F1 steel (#9aa5b8).
- **Do** keep motion between 150 and 250ms with exponential ease-out, and honour reduced motion.

### Don't:
- **Don't** put an eyebrow or kicker above a heading.
- **Don't** use a coloured `border-left` stripe on rows or cards.
- **Don't** use hard offset shadows.
- **Don't** use red as a series, category or chart tone, or any hue as a text colour.
- **Don't** use uppercase tracked labels.
- **Don't** add a second type family or text under 12px.
- **Don't** colour interface chrome with category or team hues; team colours are thin data marks only.
