# Battle Cities Whitepaper

**Version 0.4 - August 2026**

## Executive summary

Battle Cities is a competitive tank-combat game built for web, mobile, and the Solana ecosystem. $BATC is the fixed-supply utility token designed to connect the game's shop, competitive events, and long-term player economy. The game is built around skill-led competition: spending $BATC improves preparation and customization, while tournament placement is determined by verified gameplay performance.

## Game and player loop

Players enter the battlefield, pilot tanks, and improve their results through mastery, loadout decisions, and consistent play. The core loop is:

1. Play matches and improve leaderboard performance.
2. Use the Battle Cities shop to acquire fuel and tank powerups with $BATC.
3. Enter the next match better prepared while preserving meaningful skill-based competition.
4. Compete for hourly and monthly leaderboard rewards.

Fuel and powerups are gameplay utility and are subject to balancing limits. They must not bypass competitive integrity, create an unavoidable paid advantage, or guarantee a tournament result.

## Scoring and ranking

Battle Cities uses two related measurements: **match score**, earned from gameplay, and **Game Points**, derived server-side for seasonal leaderboard ranking.

### Match score

- Tank Tier A/B/C/D defeats award 100/200/300/400 points.
- Collecting any powerup awards 500 points.
- In multiplayer, the player or players tied for the highest level score receive a 1,000-point bonus.
- Every 20,000 match-score points awards an extra life.
- Wipeout defeats do not award kill-score credit.

### Seasonal Game Points

`Game Points = min(2,000, floor(match score / 10) + 100 × (level reached - 1) + 500 if the match is won)`

Match score is capped at 1,000,000 and the level input at 99 before the formula is applied. The seasonal Gaming leaderboard aggregates eligible players' Game Points across accepted or pending match records; rejected records are excluded. Client-submitted Game Points are never trusted.

## $BATC utility

$BATC is the planned Battle Cities SPL token on Solana. It has a fixed maximum supply of 50,000,000 BATC. Its intended utility includes:

- Purchasing fuel in the in-game shop.
- Purchasing eligible tank powerups and related gameplay items.
- Supporting reward programs and tournament incentives.
- Supporting liquidity, ecosystem growth, and future community initiatives.

The token mint address will be announced only through official Battle Cities channels at launch. Players should not treat pre-announcement token addresses as official.

## The Battle Cities shop

The shop is the primary in-game use case for $BATC. It lets players purchase fuel and eligible tank powerups. Pricing, item availability, cooldowns, inventories, and gameplay effects are controlled by the live game economy and can be adjusted to preserve a fair and sustainable game.

Competitive safeguards:

- Powerups are designed as tactical options, not guaranteed wins.
- Ranked modes can apply item restrictions, mirrored loadouts, caps, or separate queues.
- Battle Cities may change, disable, or remove an item when telemetry identifies a balance or integrity risk.
- Cosmetic items and non-competitive progression are preferred for expansion of token utility.

### Current shop inventory

The current interface provides Token Shop, SOL Shop, and Loadout views. The Token Shop currently lists Fuel x1/x5/x20 (10/45/160 BATC); Shield/Base Def/Freeze (25/30/35 BATC); Speed/Star/Zoom Out (35/50/30 BATC); Wipeout/Extra Life (45/40 BATC); and a Starter Pack (90 BATC). Live prices and inventory can change with the game economy.

### Powerup behavior

Dropped powerups remain available for 30 seconds. Shield, Freeze, Speed, and Zoom Out last 10 seconds; Base Defence lasts 17 seconds; Star upgrades the tank for the current run; Extra Life is immediate; and Wipeout is immediate and does not give kill-score credit.

### BATC player-economy flow

`Acquire BATC → Token Shop → Match Loadout → Verified Game Session → Seasonal Gaming Leaderboard → Top-10 Hourly/Monthly SOL + BATC Rewards`

The verified session records authoritative score and match facts, plus replay data that can be explored through player/ranking views. The destination of BATC spent in the shop—such as treasury, reward pool, burn, or a combination—will be published before token utility goes live.

## Competitive rewards

Battle Cities will run recurring leaderboard competitions.

### Hourly tournaments

Each hourly tournament ranks eligible players by the published leaderboard rules for that event. The top 10 verified players receive a reward allocation in SOL and BATC. The published tournament panel will state the event window, eligible mode, scoring rule, prize pool, top-10 distribution, and claim process before each event begins.

### Monthly rewards

At the end of each monthly season, the top 10 eligible players receive monthly leaderboard rewards. Monthly placement is based on the applicable season leaderboard and may use anti-abuse checks, minimum participation requirements, or final-score verification before distribution.

### Leaderboards

The ranking interface separates Gaming and Trading views and displays season context, rank, perks, and total points. The Gaming leaderboard is the basis for hourly and monthly competitive rankings. The published event panel will state the prize pool, top-10 distribution, scoring formula, and claim procedure before the competition opens.

### Integrity and eligibility

Rewards are not automatic until eligibility is confirmed. Battle Cities may reject, reverse, hold, or reallocate rewards for cheating, automation, collusion, exploit abuse, account farming, materially inaccurate leaderboard data, sanctions restrictions, or a breach of game rules. Ties, interrupted matches, outages, and disputed results are resolved under the published competition rules.

SOL and BATC rewards are promotional game rewards, not yield, interest, or a guarantee of value. Reward values, schedules, and eligibility may change as the game economy evolves.

## Tokenomics

| Allocation | Share | BATC |
| --- | ---: | ---: |
| Public Sale | 39% | 19,500,000 |
| Ecosystem & Rewards | 20% | 10,000,000 |
| Liquidity & Staking | 15% | 7,500,000 |
| Marketing | 10% | 5,000,000 |
| Team | 10% | 5,000,000 |
| Treasury | 5% | 2,500,000 |
| Private Presale | 1% | 500,000 |
| **Total fixed supply** | **100%** | **50,000,000** |

The presale implementation currently defines three private-presale stages totaling 500,000 BATC: 200,000 BATC in Stage 1, 150,000 BATC in Stage 2, and 150,000 BATC in Stage 3.

The 20% Ecosystem & Rewards allocation is the intended source for player and competitive reward programs. It is not a promise of a fixed payout rate or perpetual reward pool. The treasury is reserved for long-term operational, development, security, and ecosystem needs.

## Supply controls and transparency

The 50,000,000 BATC supply is fixed and the project presents no hidden inflation allocation. Before token launch, Battle Cities should publish the mint address, token-authority status, wallet addresses controlling reserved allocations, liquidity arrangements, and vesting/unlock schedules. No token holder should rely on a timeline that has not been officially published.

Vesting and unlock schedules for team, treasury, marketing, ecosystem, liquidity, and sale allocations are intentionally not specified in this version. They will be published in an updated whitepaper and on official channels before relevant token distribution events.

## Roadmap

| Period | Milestone |
| --- | --- |
| March 2026 | Website launch |
| April 2026 | Web game launch |
| May 2026 | Solana Seeker launch |
| June-July 2026 | Presale readiness and wallet/allocation validation |
| August 2026 | Presale Stage 1 |
| September 2026 | DEX listing and liquidity launch |
| October 2026 | Play Solana and Google Play expansion |
| November 2026 onward | Ecosystem expansion, community rewards, partnerships, and broader BATC utility |

Roadmap dates describe targets and may change based on development, security, platform approval, market, or regulatory considerations.

## Risks and disclaimers

$BATC is intended as a game utility token. It is not equity, a debt instrument, a deposit, a financial product, or a promise of profit. Digital assets are volatile and may lose all value. Participation in a presale, token purchase, tournament, or reward program may not be available in every jurisdiction. Players are responsible for their own tax, legal, wallet-security, and eligibility decisions.

Battle Cities will continue to balance gameplay, publish competition rules, and improve transparency as the product grows. This version is an operational whitepaper and does not replace the final token disclosure, terms of service, privacy policy, competition rules, or legal advice.

## Official community

- Discord: https://discord.gg/jHmYTCVJgm
- X: https://x.com/BattleCitiesHQ
