# Verdel design tokens

Every brand value lives in one of two places. Change it there, never in a component file.

## Where values live

| What | Where | Example |
| --- | --- | --- |
| Scheme colours (background, text, buttons) | Theme settings → Colors, read as `--color-background` and `--color-foreground` | cream `#F7F3EC` on forest text |
| Fonts, radii, spacing scale | Theme settings, read as Dawn's variables | `--media-radius`, `--inputs-radius` |
| Everything Dawn has no setting for | `:root` in `assets/verdel.css` | `--verdel-accent` |

## The Verdel tokens

| Token | Value | Use it for |
| --- | --- | --- |
| `--verdel-accent` | `oklch(0.509 0.098 68.5)` | Filled call-to-action surfaces: bag checkout bar, header CTA, signup button, subscribe saving badge |
| `--verdel-accent-hover` | accent mixed 12% toward black | Hover on anything filled with the accent |
| `--verdel-on-accent` | `rgb(247 243 236)` | Text on the accent where the scheme background isn't cream |
| `--verdel-shadow-dialog` | `0 1.2rem 3.2rem rgb(0 0 0 / 0.24)` | Dialogs over the page (quiz). Cards get borders, not shadows. |
| `--verdel-ease-out` | `cubic-bezier(0.32, 0.72, 0, 1)` | Things that move into place: nav underline, hero entrance, accordion open |
| `--verdel-underline-offset` | `0.3rem` | Every text link underline |

## Text and line strength

Greys are the scheme's text colour at a fixed opacity, so they follow any scheme. Write `rgba(var(--color-foreground), var(--verdel-alpha-…))`.

| Token | Opacity | Use it for |
| --- | --- | --- |
| `--verdel-alpha-muted` | 0.75 | Secondary text: labels, captions, unit prices. 5.1:1 on cream. |
| `--verdel-alpha-focus` | 0.5 | Focus outlines |
| `--verdel-alpha-control` | 0.2 | Borders of things you click: options, pair cards, section rules in hero and footer |
| `--verdel-alpha-line-strong` | 0.16 | Dividers between blocks: bag rows, FAQ items, header lines |
| `--verdel-alpha-line` | 0.12 | Dividers inside a list: rule lists, subscribe rows |
| `--verdel-alpha-tint-hover` | 0.07 | Open tab and link hover in the shop panel |
| `--verdel-alpha-tint` | 0.06 | Image placeholders, picked quiz answer |
| `--verdel-alpha-tint-subtle` | 0.04 | Picked subscribe option, ingredient image placeholder |

## Rules

- A new grey picks one of the opacities above. If none fits, the design is asking for a new role: add a token here first.
- Hover and colour changes take 150ms. Anything that moves uses `--verdel-ease-out` and turns off under `prefers-reduced-motion`.
