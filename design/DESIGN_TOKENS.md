# Rate'O design tokens for the web app

Source of truth: the Figma brand guideline "Rate'O Brand Guidelines / Colours"
(see `brand-colours.png` in this folder). The mobile app's `src/constants/colors.js`
drifted slightly from Figma; use the Figma values below and treat mobile as a
reference for how the colours are applied, not for the exact hex.

## Brand palette (Figma)

| Token            | Hex       | Use |
|------------------|-----------|-----|
| `brand-900`      | `#113D3C` | Darkest teal. Headers, primary text on light, nav bars, splash. |
| `brand-700`      | `#005C5A` | Medium teal. Primary buttons, links, active tab, icons. |
| `accent-600`     | `#FC9D01` | Deep amber. Primary CTA highlight, badges, rating stars. |
| `accent-400`     | `#FEB336` | Light amber. Hover/secondary accent, chips, logo accent. |
| `cream-50`       | `#FFF5E1` | Cream. Page background, cards on dark, soft surfaces. |

Neutrals are not defined in the guideline. Use these, taken from mobile usage:
`white #FFFFFF`, `black #000000`, `gray-400 #A0A0A0`. Derive the remaining greys
from Tailwind's neutral scale.

## Mobile values, for comparison only

| Mobile key            | Hex       | Closest Figma token |
|-----------------------|-----------|---------------------|
| primary / primaryBackground | `#0D322E` | `brand-900` |
| darkTeal              | `#154741` | `brand-900` |
| teal                  | `#205352` | `brand-700` |
| accentLogo / orange   | `#FEB336` | `accent-400` |
| secondaryBackground   | `#FFF9E6` | `cream-50` |
| gray                  | `#A0A0A0` | neutral |

## Typography

Mobile ships Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`). Use it on
web via Google Fonts unless the Figma typography page says otherwise. If a Figma
typography export is added to this folder, it overrides this line.

## How to wire into Tailwind

Declare the five brand colours plus neutrals as CSS variables on `:root` in
`globals.css`, then map them in `tailwind.config.ts` under `theme.extend.colors`
(`brand`, `accent`, `cream`). Do not hard-code hex values in components.
