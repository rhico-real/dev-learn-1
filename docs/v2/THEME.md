# RunHop Docs v2 Theme Guide

This file captures the visual system and interaction rules used by the custom docs UI in `docs/v2`.

## Goal

Build a documentation UI that feels close to DevDocs:

- dark, dense, developer-oriented layout
- persistent left navigation
- sticky right-hand table of contents
- compact reading surface
- fast in-page anchor navigation
- collapsible per-page subnavigation

## App Structure

The UI is split into three major areas:

1. `sidebar`
   - persistent left rail
   - brand block
   - search box
   - grouped document navigation
   - collapsible subitems for active page headings
2. `workspace`
   - sticky top bar
   - main article card
3. `toc`
   - sticky right rail
   - current page heading links

## Files

- `index.html`
  - page shell and CDN dependencies
- `styles.css`
  - layout, theme tokens, typography, spacing, and interaction styling
- `app.js`
  - markdown loading, sidebar parsing, routing, search, TOC sync, and anchor behavior

## Color Tokens

Defined in `:root` in `styles.css`.

```css
--bg: #1f2328;
--bg-sidebar: #24282d;
--bg-sidebar-2: #2b3036;
--bg-panel: #2a2f35;
--bg-panel-2: #31363d;
--bg-hover: #363c44;
--bg-active: #0b71c7;
--bg-active-soft: rgba(11, 113, 199, 0.16);
--border: #3b4148;
--border-soft: rgba(255, 255, 255, 0.04);
--text: #d9dde1;
--text-soft: #a9b1ba;
--text-faint: #7b838d;
--accent: #4aa3ff;
--accent-soft: #86c0ff;
```

## Typography

Fonts:

- headings and brand: `Space Grotesk`
- UI and body text: `Inter`
- code: `JetBrains Mono`

Sizing targets:

- topbar title: `1rem`
- section labels: `0.67rem` to `0.68rem`
- nav items: `0.94rem`
- nav subitems: `0.9rem`
- article base size: `0.92rem`
- article body text: `0.9rem`
- `h1`: `1.95rem`
- `h2`: `1.28rem`
- `h3`: `1rem`
- `h4`: `0.84rem`
- code blocks: `0.82rem`

This version is intentionally tighter than the initial draft so more content fits on screen.

## Layout Dimensions

Primary layout tokens:

```css
--sidebar-width: 320px;
--toc-width: 280px;
--topbar-height: 60px;
```

Behavior:

- app uses a 2-column shell: sidebar + workspace
- content area uses a 2-column grid: article + toc
- sidebar height is locked to `100vh`
- workspace is independently scrollable
- toc is sticky within the content grid

## Spacing Rules

Article spacing:

- article padding: `24px 28px 32px`
- mobile article padding: `20px 16px 24px`
- `h1` bottom spacing: `18px`
- `h2` top margin: `32px`
- `h3` top margin: `24px`
- paragraph line-height: `1.58`
- horizontal rule margin: `26px 0`

Navigation spacing:

- nav section labels: `padding: 0 18px 8px`
- nav item row height: `34px`
- nav row padding: `0 12px 0 10px`
- subitem padding: `7px 18px 7px 39px`

## Interaction Rules

### Sidebar

- top-level page rows navigate to the document
- caret button toggles the page’s subnavigation open/closed
- only the current page auto-opens on document navigation
- user can manually close the current page subnav
- left sidebar scroll must stay stable when clicking same-page anchors

### Same-page Anchors

When clicking a heading link in the page subnav or TOC:

- do not rerender the article
- update URL hash only
- scroll directly to the heading
- preserve sidebar scroll position

### Sticky TOC

- right rail is sticky using the column container, not the inner card
- active heading is highlighted while scrolling
- TOC auto-keeps the active item visible without aggressive forced scrolling

### Anchor Offset

Headings use:

```css
scroll-margin-top: 84px;
```

This prevents the sticky top bar from covering the heading after anchor navigation.

## Search

Search behavior:

- indexes document titles
- indexes section labels
- indexes heading text
- indexes raw markdown content
- shows a floating result panel below the input

Search UI style:

- dark panel
- compact rows
- title + small meta text

## Markdown Rendering Rules

Current renderer behavior in `app.js`:

- parse markdown with `marked`
- assign stable ids to headings
- capture `##` and `###` headings for subnav and TOC
- rewrite internal markdown links into app routes
- preserve external links as normal links
- rewrite relative image paths against the docs root

## Responsive Rules

At `max-width: 1100px`:

- hide the right TOC
- keep article as full-width content

At `max-width: 820px`:

- sidebar becomes an off-canvas panel
- menu button appears in top bar
- article padding becomes tighter
- `h1` scales down to `1.65rem`

## Reuse Checklist

When applying this theme to another project:

1. Copy `docs/v2/index.html`, `docs/v2/styles.css`, and `docs/v2/app.js`.
2. Replace the brand label in `index.html`.
3. Update the docs root if the markdown source folder changes.
4. Replace `_sidebar.md` with the new project’s section tree.
5. Keep heading structure consistent in markdown so subnav and TOC stay useful.
6. Tune only these tokens first before making larger CSS changes:
   - `--sidebar-width`
   - `--toc-width`
   - `--topbar-height`
   - base text sizes
   - panel/background tokens

## Suggested Customization Points

If adapting this for another project, the safest places to customize are:

- brand colors
- font families
- sidebar width
- article typography scale
- active row color
- card radius and shadows

Avoid changing the routing and same-page anchor logic unless necessary, because that is where the scroll behavior is most fragile.
