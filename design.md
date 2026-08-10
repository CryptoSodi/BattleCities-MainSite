# BattleCities Website Design System

## Direction

The website should feel like the game's command interface: a steel-black tactical console set against a war-torn blue-to-orange horizon. It is not a neon crypto page. The visual hierarchy comes from game HUDs, armored panels, mission control, and the shop's clear item economy.

**Mood:** tactical, high-energy, premium arcade warfare.

**Primary reference:** the in-game home screen and token shop UI supplied on 2026-08-10.

## Palette — Iron Siege

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Void background | `--bg` | `#06090B` | Page canvas and deep page sections |
| Carbon panel | `--bg-panel` | `#0D1216` | Cards, navigation, inputs, and HUD panels |
| Raised steel | `--bg-panel-2` | `#162027` | Active panel fills and elevated surfaces |
| Steel edge | `--line` | `#3A4952` | Borders, dividers, inactive tabs, and panel trim |
| Primary text | `--white` | `#F5F2E8` | Headings and high-priority labels |
| Secondary text | `--gray` | `#A3ADB0` | Body copy and metadata |
| Command gold | `--gold` | `#FFB30F` | Main CTAs, selected tabs, prices, score, and stars |
| Gold shadow | `--gold-deep` | `#A96A05` | Button depth, outlines, and hover shading |
| Command blue | `--blue` | `#1677FF` | Links, player identity, information, and blue-side visuals |
| Blue glow | `--blue-glow` | `#70B7FF` | Blue highlights and soft atmospheric glow |
| Supply green | `--supply` | `#47DE17` | Fuel, inventory success, available items, and confirmed states |
| Alert red | `--danger` | `#F04432` | Destructive actions, warnings, and enemy-side emphasis |
| Battlefield orange | `--ember` | `#FF6A1A` | Event highlights and restrained environmental accents |

### Color rules

- Gold is the only primary action color. Use it for one clear action per view.
- Blue identifies the player, navigation links, and friendly technology; do not use it for purchase buttons.
- Green means a resource, positive inventory state, or successful operation—not a decorative accent.
- Red is reserved for danger, logout, irreversible actions, and enemy context.
- Use orange sparingly as an environmental accent behind hero content; body text must never sit directly on it.

## Current-site token replacement

Replace the current green-crypto variables with the game-aligned values below.

```css
:root {
  --bg: #06090b;
  --bg-panel: #0d1216;
  --bg-panel-2: #162027;
  --line: #3a4952;
  --white: #f5f2e8;
  --gray: #a3adb0;
  --neon: #ffb30f;       /* retained name; now command gold */
  --neon-dim: #a96a05;
  --neon-glow: rgb(255 179 15 / 45%);
  --blue: #1677ff;
  --blue-glow: rgb(112 183 255 / 38%);
  --supply: #47de17;
  --danger: #f04432;
  --ember: #ff6a1a;
}
```

## Surfaces and components

### HUD panels

- Use near-black panel fills with a 1px steel border and small gold corner brackets.
- Prefer squared corners (0–4px radius), layered outlines, and a subtle inset shadow over soft rounded cards.
- Add a faint scanline or grid texture at very low opacity only; it must not reduce text contrast.

### Buttons

- Primary: command-gold fill, dark text, dark 2px border, and a 3–4px hard shadow in `--gold-deep`.
- Secondary: carbon fill, steel border, white label; on hover, shift the border and icon to command gold.
- Critical: alert-red fill or outline. Never reuse the primary gold treatment for logout or destructive actions.
- Button labels are short, uppercase, and action-led: `JOIN THE FIGHT`, `VIEW LOADOUT`, `ENTER SHOP`.

### Navigation

- Use armored, horizontal tabs on desktop and a compact mission-control bar on mobile.
- The active tab has a gold fill; inactive tabs use carbon with a steel outline.
- The brand lockup should use a shield, tank silhouette, or star mark—not a cat/presale icon.

### Cards and data

- Tokenomics and roadmap entries should resemble shop inventory cards: dark field, steel frame, gold key values.
- Use `--supply` only for available stock, completed objectives, and resource quantities.
- Present values in a condensed display face with aligned numerals, similar to scoreboards.

## Typography

| Use | Recommendation | Treatment |
| --- | --- | --- |
| Display / mission headings | **Teko** or **Rajdhani** | 600–700 weight, uppercase, tight line-height |
| HUD labels / buttons | **Barlow Condensed** | 700 weight, uppercase, 0.06–0.1em tracking |
| Stats / addresses / tokens | **Share Tech Mono** | Uppercase where practical; tabular numerals |
| Body copy | **Rajdhani** | 500–600 weight, 16–18px, high contrast |

Avoid pixel fonts for paragraphs. Use them only for small decorative score labels, if at all; they become tiring at website reading sizes.

## Hero art direction

- Use a full-bleed battlefield or city image only in the hero.
- Apply a dark navy overlay on the left (copy side) and an orange/ember overlay on the right (battle side), echoing the game home screen.
- Keep the hero copy inside a dark HUD plate or a strong gradient shadow for readability.
- Feature one armored game object—tank, base, or shield—not multiple competing token illustrations.

## Motion

- Motion should feel mechanical: short 160–280ms panel reveals, 100ms button feedback, no floating crypto ornaments.
- Use brief gold scan or line-sweep feedback on primary CTA hover/focus.
- Respect `prefers-reduced-motion`; all content must remain visible with animation disabled.
- Avoid momentum/smooth-scroll libraries. Native scroll plus small GSAP section reveals is the preferred baseline.

## Copy voice

Use direct military-game language without becoming roleplay-heavy:

- `MISSION BRIEFING`, `ENTER THE BATTLE`, `SUPPLY DROP`, `COMMAND CENTER`, `DEPLOYMENT STATUS`
- Prefer concrete game outcomes over token hype.
- Keep risk and wallet language plain, prominent, and separate from gameplay messaging.

## Do / don't

- **Do:** use steel framing, tactical gold, blue-versus-orange atmosphere, and inventory-like information cards.
- **Do:** reserve whitespace around primary controls so the UI reads like a command console, not a crowded dashboard.
- **Don't:** make lime green the page's dominant brand color; it belongs to fuel and availability.
- **Don't:** use purple, pink, cat motifs, or generic cyberpunk gradients from the current clone.
- **Don't:** place dense text directly on a battlefield image.
