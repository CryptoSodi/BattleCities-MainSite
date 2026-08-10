# BattleCities Website Color Theme

## Purpose

This document updates the website's **color direction only** to match the current BattleCities game and shop UI: armored steel panels, command gold, electric battlefield blue, supply green, alert red, and warm battle embers.

It is a handoff specification only. It does **not** change the live website.

## Typography lock — do not change

Keep the existing website typography exactly as it is:

- Keep the current font families: `Press Start 2P`, `Chakra Petch`, and `Share Tech Mono`.
- Keep every existing font size, weight, line-height, letter-spacing, casing, and text alignment.
- Keep all existing text, labels, and button copy.
- Do not substitute a military, pixel, condensed, or system font.

This is a color-only theme. Layout, spacing, borders, radii, imagery, and GSAP/scroll animation behavior remain unchanged unless separately requested.

## Palette

| Role | Token | Hex | Game UI reference |
| --- | --- | --- | --- |
| Page base | `--bg` | `#06090B` | The near-black background behind the shop panels. |
| Raised panel | `--bg-panel` | `#0D1216` | The dark interior of the shop cards and menu modules. |
| Elevated panel | `--bg-panel-2` | `#162027` | The blue-black steel fill in inactive controls. |
| Steel edge | `--line` | `#3A4952` | Metal panel outlines and hardware details. |
| Primary text | `--white` | `#F5F2E8` | The warm off-white labels in the UI. |
| Secondary text | `--gray` | `#A3ADB0` | Quiet labels and supporting information. |
| Command gold | `--neon` | `#FFB30F` | Selected tabs, main actions, score accents, and gold framing. |
| Burnished gold | `--neon-dim` | `#A96A05` | Gold shadows, restrained outlines, and non-active emphasis. |
| Gold glow | `--neon-glow` | `rgb(255 179 15 / 45%)` | Soft focus behind selected gold controls. |
| Friendly blue | `--blue` | `#1677FF` | Blue-side battlefield lights and friendly/system status. |
| Blue glow | `--blue-glow` | `rgb(112 183 255 / 38%)` | Atmospheric blue lighting and informational hover glow. |
| Supply green | `--supply` | `#47DE17` | Available items, fuel, positive quantities, and ready states. |
| Alert red | `--danger` | `#F04432` | Logout, failure, damage, and destructive actions. |
| Battle ember | `--ember` | `#FF6A1A` | War-zone warmth, explosions, and atmospheric accents only. |

## CSS token handoff

When the color theme is implemented, update color values through the existing variables only. Do not change any typography declarations.

```css
:root {
  --bg: #06090b;
  --bg-panel: #0d1216;
  --bg-panel-2: #162027;
  --line: #3a4952;

  --white: #f5f2e8;
  --gray: #a3adb0;

  /* Existing semantic variable name retained; its visual role becomes command gold. */
  --neon: #ffb30f;
  --neon-dim: #a96a05;
  --neon-glow: rgb(255 179 15 / 45%);

  --blue: #1677ff;
  --blue-glow: rgb(112 183 255 / 38%);
  --supply: #47de17;
  --danger: #f04432;
  --ember: #ff6a1a;
}
```

## Color use rules

- **Gold** is the command color: primary buttons, active navigation, key numbers, and interactive focus.
- **Steel** holds structure: panels, separators, inactive borders, and backgrounds. Keep it dark so gold remains decisive.
- **Blue** represents the friendly/technical side of the battlefield: links, system information, and cool atmospheric highlights.
- **Green** is reserved for a successful, available, connected, supplied, or ready state. Do not use it for general decoration.
- **Red** is reserved for destructive, danger, error, and damage states.
- **Ember orange** is an atmospheric accent for warm battlefield imagery and sparse decorative highlights; it should never compete with a primary gold action.

## Component mapping

| Current website element | Color-only treatment |
| --- | --- |
| Page background | Use `--bg`, with restrained blue and ember atmospheric gradients where the current design already supports decorative color. |
| Cards and content blocks | Use `--bg-panel` with `--line` borders; use `--bg-panel-2` only for an elevated or inactive layer. |
| Primary CTA and selected nav | Use `--neon` with `--neon-dim` edge/shadow and the existing glow treatment recolored to `--neon-glow`. |
| Secondary controls | Keep panel fills dark; use steel borders and off-white text. |
| Links and informational states | Use `--blue`; reserve blue glow for hover/focus feedback. |
| Availability, success, and counters | Use `--supply`. |
| Errors and destructive actions | Use `--danger`. |
| Headings and body copy | Use `--white` for primary text and `--gray` for muted text only; retain every current type rule. |

## Acceptance checklist

- [ ] Only color values and color-related shadows/glows change.
- [ ] Existing font-family declarations are unchanged.
- [ ] Existing font sizes and all other text metrics are unchanged.
- [ ] No text, layout, spacing, component dimensions, or GSAP timing changes.
- [ ] Gold is the primary interactive color; green and red remain semantic status colors.
- [ ] The result reads as BattleCities UI: dark armored steel, decisive gold, cool blue, and limited battlefield ember.
