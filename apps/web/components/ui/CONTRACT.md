# UI Foundation Contract

Phase 7 establishes the shared design authority inside `apps/web`.

## Token categories

- Typography: `--font-body`, `--font-display`, plus heading/body line-height defaults in `app/globals.css`
- Color: canvas, surface, text, border, accent, and status tokens in `app/globals.css`
- Elevation: `--shadow-soft`, `--shadow-panel`
- Radius and spacing: `--radius-*`, `--space-*`
- Interaction: `:focus-visible`, `::selection`, and `prefers-reduced-motion` live at the root

## Primitive inventory

- Actions: `Button`
- Form grammar: `Field`, `Input`, `Select`, `CheckboxGroup`
- Status/feedback: `Badge`, `Notice`
- Surfaces/layout: `Surface`, `PageFrame`, `PageHeader`, `Section`

## Status vocabulary

- `success`
- `warning`
- `danger`
- `info`
- `neutral`

Use these semantic tones consistently instead of ad hoc color names.

## Selector rules

- Prefer roles, labels, and visible text by default.
- Add stable hooks only for critical dynamic composites and shell boundaries.
- When a dynamic surface needs a hook, prefer id-driven values over display names or list indices.
- Avoid scattering `data-testid` across every button, field, or badge.

## Touched-surface rule

- Once a file starts consuming the shared foundation, do not add new inline design values to that file.
- New presentational work in migrated files must come from root tokens, CSS Modules, and shared primitives.
- Mixed legacy/new styling may exist temporarily across the app, but not within the same migrated surface.
