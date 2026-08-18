from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate, Paragraph,
    Spacer, Table, TableStyle
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "battle-cities-whitepaper-v0.4.pdf"
HERO = ROOT / "images" / "hero.png"
LOGO = Path(r"C:\repos\BattleCity\public\assets\battle-cities-menu-logo.png")
MASCOT = Path(r"C:\Users\tassa\Downloads\mascot.png")
SHOP = Path(r"C:\Users\tassa\AppData\Local\Temp\codex-clipboard-5ea21b7d-9391-4371-9b9d-fc472e3c976d.png")
RANKING = Path(r"C:\Users\tassa\AppData\Local\Temp\codex-clipboard-72a1d343-8575-4d40-8f2a-e7eb46b31a7a.png")
POWERUP_ASSETS = {
    "Shield": Path(r"C:\repos\BattleCity\data\graphics\powerup-helmet.png"),
    "Base Defence": Path(r"C:\repos\BattleCity\data\graphics\powerup-shovel.png"),
    "Freeze": Path(r"C:\repos\BattleCity\data\graphics\powerup-clock.png"),
    "Speed": Path(r"C:\repos\BattleCity\data\graphics\powerup-speed.png"),
    "Star": Path(r"C:\repos\BattleCity\data\graphics\powerup-star.png"),
    "Zoom Out": Path(r"C:\repos\BattleCity\data\graphics\powerup-zoomout.png"),
    "Wipeout": Path(r"C:\repos\BattleCity\data\graphics\powerup-grenade.png"),
    "Extra Life": Path(r"C:\repos\BattleCity\data\graphics\TANKS\powerup-life.png"),
}

BG = colors.HexColor("#06090B")
PANEL = colors.HexColor("#0D1216")
STEEL = colors.HexColor("#3A4952")
WHITE = colors.HexColor("#F5F2E8")
GRAY = colors.HexColor("#A3ADB0")
GOLD = colors.HexColor("#FFB30F")
BLUE = colors.HexColor("#1677FF")
GREEN = colors.HexColor("#47DE17")
EMBER = colors.HexColor("#FF6A1A")


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setStrokeColor(STEEL)
    canvas.setLineWidth(0.6)
    canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
    canvas.setFillColor(GRAY)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(18 * mm, 9.2 * mm, "BATTLE CITIES // WHITEPAPER v0.4")
    canvas.drawRightString(A4[0] - 18 * mm, 9.2 * mm, f"{doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
title = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=34,
                       leading=38, alignment=TA_CENTER, textColor=WHITE, spaceAfter=8)
subtitle = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=12,
                          leading=18, alignment=TA_CENTER, textColor=GRAY)
h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=20,
                    leading=24, textColor=GOLD, spaceBefore=2, spaceAfter=10)
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13,
                    leading=17, textColor=BLUE, spaceBefore=13, spaceAfter=6)
body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.8,
                      leading=15, textColor=WHITE, spaceAfter=8)
muted = ParagraphStyle("Muted", parent=body, textColor=GRAY)
bullet = ParagraphStyle("Bullet", parent=body, leftIndent=13, firstLineIndent=-8, bulletIndent=3,
                        spaceAfter=4)
small = ParagraphStyle("Small", parent=body, fontSize=8.2, leading=12, textColor=GRAY)
table_head = ParagraphStyle("TableHead", parent=body, fontName="Helvetica-Bold", fontSize=8.2,
                            leading=10, textColor=BG)
table_cell = ParagraphStyle("TableCell", parent=body, fontSize=8.5, leading=11, textColor=WHITE)


def p(text, style=body):
    return Paragraph(text, style)


def powerup_icon(name):
    asset = POWERUP_ASSETS[name]
    if asset.exists():
        return Image(str(asset), width=10 * mm, height=10 * mm)
    return p("-", table_cell)


def bullets(items):
    return [Paragraph(item, bullet, bulletText="•") for item in items]


def callout(label, text, accent=GOLD):
    table = Table([[p(f"<b>{label}</b><br/>{text}", body)]], colWidths=[174 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.9, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


story = []

# Cover
story += [Spacer(1, 14 * mm)]
if LOGO.exists():
    story += [Image(str(LOGO), width=132 * mm, height=69 * mm, kind="proportional"), Spacer(1, 1 * mm)]
else:
    story += [p("BATTLE CITIES", title)]
story += [p("Competitive tank combat on Solana", subtitle), Spacer(1, 5 * mm)]
if MASCOT.exists():
    story += [Image(str(MASCOT), width=86 * mm, height=55 * mm, kind="proportional"), Spacer(1, 3 * mm)]
story += [callout("WHITEPAPER v0.4 // AUGUST 2026", "A game-first overview of BATC utility, the Battle Cities shop, competitive rewards, token distribution, and implementation commitments.", GOLD), Spacer(1, 9 * mm)]
story += [p("BATTLEFIELD BRIEF", h2), p("Battle Cities is built around competitive tank gameplay, a player-useful token economy, and transparent guardrails. Skill decides the leaderboard; BATC supports the game economy.", body), PageBreak()]

# Summary and gameplay
story += [p("01. EXECUTIVE SUMMARY", h1), p("Battle Cities is a competitive tank-combat game for web, mobile, and the Solana ecosystem. $BATC is a fixed-supply utility token that connects the game shop, competitive events, and long-term player economy.", body),
          callout("DESIGN PRINCIPLE", "Spending $BATC can improve preparation and customization, but tournament placement is determined by verified gameplay performance.", BLUE),
          p("02. GAME AND PLAYER LOOP", h1), p("Players enter the battlefield, pilot tanks, and improve their results through mastery, loadout decisions, and consistent play. The core loop is simple:", body)]
story += bullets(["Play matches and improve leaderboard performance.", "Use the Battle Cities shop to acquire fuel and tank powerups with $BATC.", "Enter the next match better prepared while preserving meaningful skill-based competition.", "Compete for hourly and monthly leaderboard rewards."])
story += [p("Fuel and powerups are gameplay utility and are subject to balancing limits. They must not bypass competitive integrity, create an unavoidable paid advantage, or guarantee a tournament result.", muted), PageBreak(),
          p("02A. SCORING & RANKING", h1), p("Battle Cities uses two related measurements: <b>match score</b>, earned from gameplay, and <b>Game Points</b>, derived server-side for seasonal leaderboard ranking.", body),
          p("Match score", h2), p("Enemy defeats award 100 / 200 / 300 / 400 points for Tank Tiers A / B / C / D. Collecting any powerup awards 500 points. In multiplayer, the player or players tied for the highest level score receive a 1,000-point bonus. Every 20,000 match-score points awards an extra life. Wipeout defeats do not award kill points.", body),
          p("Seasonal Game Points", h2), callout("SERVER-DERIVED FORMULA", "Game Points = min(2,000, floor(match score / 10) + 100 x (level reached - 1) + 500 if the match is won).", BLUE),
          p("Match score is capped at 1,000,000 and the level input is capped at 99 before the formula is applied. The seasonal Gaming leaderboard aggregates each eligible player's Game Points across accepted or pending match records; rejected records are excluded. Client-submitted Game Points are never trusted.", body), PageBreak()]

# Utility and shop
story += [p("03. $BATC UTILITY", h1), p("$BATC is the planned Battle Cities SPL token on Solana. It has a fixed maximum supply of <b>50,000,000 BATC</b>.", body),
          p("Its intended utility includes:", h2)]
story += bullets(["Purchasing fuel in the in-game shop.", "Purchasing eligible tank powerups and related gameplay items.", "Supporting reward programs and tournament incentives.", "Supporting liquidity, ecosystem growth, and future community initiatives."])
story += [p("The token mint address will be announced only through official Battle Cities channels at launch. Players should not treat pre-announcement token addresses as official.", muted),
          p("04. THE BATTLE CITIES SHOP", h1), p("The shop is the primary in-game use case for $BATC. It lets players purchase fuel and eligible tank powerups. Pricing, item availability, cooldowns, inventories, and gameplay effects are controlled by the live game economy and can be adjusted to preserve a fair and sustainable game.", body),
          p("Competitive safeguards", h2)]
story += bullets(["Powerups are tactical options, not guaranteed wins.", "Ranked modes can apply item restrictions, mirrored loadouts, caps, or separate queues.", "Battle Cities may change, disable, or remove an item when telemetry identifies a balance or integrity risk.", "Cosmetic items and non-competitive progression are preferred for expansion of token utility."])
story += [PageBreak(), p("04A. SHOP INVENTORY", h1), p("The current interface provides Token Shop, SOL Shop, and Loadout views. The Token Shop offers fuel, power items, and packs. Prices are stated in BATC, the official token symbol used throughout this whitepaper and on the project site.", body)]
shop_rows = [[p("Category", table_head), p("Item", table_head), p("Current price", table_head)],
             [p("Fuel", table_cell), p("Fuel x1 / x5 / x20", table_cell), p("10 / 45 / 160 BATC", table_cell)],
             [p("Power", table_cell), p("Shield / Base Def / Freeze", table_cell), p("25 / 30 / 35 BATC", table_cell)],
             [p("Power", table_cell), p("Speed / Star / Zoom Out", table_cell), p("35 / 50 / 30 BATC", table_cell)],
             [p("Power", table_cell), p("Wipeout / Extra Life", table_cell), p("45 / 40 BATC", table_cell)],
             [p("Pack", table_cell), p("Starter (+5 + kit)", table_cell), p("90 BATC", table_cell)]]
shop_table = Table(shop_rows, colWidths=[34 * mm, 88 * mm, 52 * mm], repeatRows=1)
shop_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD), ("BACKGROUND", (0, 1), (-1, -1), PANEL), ("GRID", (0, 0), (-1, -1), 0.35, STEEL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
story += [shop_table, Spacer(1, 7 * mm)]
if SHOP.exists():
    story += [Image(str(SHOP), width=174 * mm, height=98 * mm, kind="proportional"), p("Current Battle Cities shop interface", small)]
story += [PageBreak(), p("04B. POWERUPS & BATC FLOW", h1), p("A dropped powerup remains available on the battlefield for 30 seconds. Its collected effect depends on its type.", body)]
powerup_rows = [[p("Icon", table_head), p("Powerup", table_head), p("Effect", table_head), p("Duration", table_head)],
                [powerup_icon("Shield"), p("Shield", table_cell), p("Player invulnerability", table_cell), p("10 seconds", table_cell)],
                [powerup_icon("Base Defence"), p("Base Defence", table_cell), p("Base frame becomes steel / invulnerable", table_cell), p("17 seconds", table_cell)],
                [powerup_icon("Freeze"), p("Freeze", table_cell), p("Freezes active enemies", table_cell), p("10 seconds", table_cell)],
                [powerup_icon("Speed"), p("Speed", table_cell), p("1.45x player movement speed", table_cell), p("10 seconds", table_cell)],
                [powerup_icon("Star"), p("Star", table_cell), p("Raises tank tier, capped at Tier D", table_cell), p("For the current run", table_cell)],
                [powerup_icon("Zoom Out"), p("Zoom Out", table_cell), p("Wider gameplay camera", table_cell), p("10 seconds", table_cell)],
                [powerup_icon("Wipeout"), p("Wipeout", table_cell), p("Destroys active enemies; no kill-score credit", table_cell), p("Instant", table_cell)],
                [powerup_icon("Extra Life"), p("Extra Life", table_cell), p("Adds one life", table_cell), p("Instant", table_cell)]]
powerup_table = Table(powerup_rows, colWidths=[16 * mm, 29 * mm, 82 * mm, 47 * mm], repeatRows=1)
powerup_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD), ("BACKGROUND", (0, 1), (-1, -1), PANEL), ("GRID", (0, 0), (-1, -1), 0.35, STEEL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 1), (0, -1), "CENTER"), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
story += [powerup_table, Spacer(1, 8 * mm), p("BATC player-economy flow", h2)]
flow_rows = [[p("1. Acquire BATC", table_cell), p("2. Token Shop", table_cell), p("3. Match Loadout", table_cell)],
             [p("Presale, wallet, or supported market", small), p("Fuel, powerups, and packs", small), p("Fuel enters a match; selected items are consumed", small)],
             [p("4. Verified Game Session", table_cell), p("5. Gaming Leaderboard", table_cell), p("6. Top-10 Rewards", table_cell)],
             [p("Authoritative score, match facts, and replay record", small), p("Server-derived Game Points aggregate by season", small), p("Hourly and monthly SOL + BATC rewards to eligible players", small)]]
flow_table = Table(flow_rows, colWidths=[58 * mm, 58 * mm, 58 * mm])
flow_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#162027")), ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#162027")), ("BACKGROUND", (0, 1), (-1, 1), PANEL), ("BACKGROUND", (0, 3), (-1, 3), PANEL), ("GRID", (0, 0), (-1, -1), 0.5, BLUE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
story += [flow_table, Spacer(1, 8 * mm), callout("ACCOUNTING POLICY TO PUBLISH", "The destination and governance of BATC spent in the shop - such as treasury, reward-pool funding, burn, or a combination - is not yet committed in this whitepaper. It must be published before token utility goes live.", EMBER), PageBreak()]

# Tournaments
story += [p("05. COMPETITIVE REWARDS", h1), p("Battle Cities will run recurring leaderboard competitions, designed to reward verified skill and consistent play.", body),
          p("Hourly tournaments", h2), p("Each hourly tournament ranks eligible players by the published leaderboard rules for that event. The top 10 verified players receive a reward allocation in <b>SOL and BATC</b>.", body),
          callout("BEFORE AN EVENT STARTS", "The tournament panel will state the event window, eligible mode, scoring rule, prize pool, top-10 distribution, and claim process.", GREEN),
          p("Monthly rewards", h2), p("At the end of each monthly season, the top 10 eligible players receive monthly leaderboard rewards. Monthly placement is based on the applicable season leaderboard and may use anti-abuse checks, minimum participation requirements, or final-score verification before distribution.", body),
          p("Integrity and eligibility", h2), p("Rewards are not automatic until eligibility is confirmed. Battle Cities may reject, reverse, hold, or reallocate rewards for cheating, automation, collusion, exploit abuse, account farming, materially inaccurate leaderboard data, sanctions restrictions, or a breach of game rules. Ties, interrupted matches, outages, and disputed results are resolved under the published competition rules.", body),
          callout("REWARD NOTICE", "SOL and BATC rewards are promotional game rewards, not yield, interest, or a guarantee of value. Reward values, schedules, and eligibility may change as the game economy evolves.", EMBER), PageBreak(),
          p("05A. LEADERBOARDS", h1), p("The live ranking interface separates Gaming and Trading views, displays season context, player rank, perks, and total points. The Gaming leaderboard is the foundation for hourly and monthly competitive rankings.", body)]
if RANKING.exists():
    story += [Image(str(RANKING), width=174 * mm, height=98 * mm, kind="proportional"), p("Current Battle Cities gaming ranking interface", small)]
story += [callout("TOP-10 REWARD MODEL", "For every hourly event and monthly season, the exact SOL and BATC prize pool, top-10 split, scoring formula, and claim procedure will be published before the competition window begins.", GREEN), PageBreak()]

# Tokenomics
story += [p("06. TOKENOMICS", h1), p("BATC has a fixed supply of <b>50,000,000 BATC</b>. The current site allocation is presented below.", body)]
rows = [[p("Allocation", table_head), p("Share", table_head), p("BATC", table_head)],
        [p("Public Sale", table_cell), p("39%", table_cell), p("19,500,000", table_cell)],
        [p("Ecosystem & Rewards", table_cell), p("20%", table_cell), p("10,000,000", table_cell)],
        [p("Liquidity & Staking", table_cell), p("15%", table_cell), p("7,500,000", table_cell)],
        [p("Marketing", table_cell), p("10%", table_cell), p("5,000,000", table_cell)],
        [p("Team", table_cell), p("10%", table_cell), p("5,000,000", table_cell)],
        [p("Treasury", table_cell), p("5%", table_cell), p("2,500,000", table_cell)],
        [p("Private Presale", table_cell), p("1%", table_cell), p("500,000", table_cell)],
        [p("<b>Total fixed supply</b>", table_cell), p("<b>100%</b>", table_cell), p("<b>50,000,000</b>", table_cell)]]
table = Table(rows, colWidths=[82 * mm, 32 * mm, 60 * mm], repeatRows=1)
table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD), ("BACKGROUND", (0, 1), (-1, -2), PANEL), ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#162027")), ("GRID", (0, 0), (-1, -1), 0.35, STEEL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [table, Spacer(1, 8 * mm), p("The presale implementation defines three private-presale stages totaling 500,000 BATC: 200,000 BATC in Stage 1, 150,000 BATC in Stage 2, and 150,000 BATC in Stage 3.", body),
          p("The Ecosystem & Rewards allocation is the intended source for player and competitive reward programs. It is not a promise of a fixed payout rate or perpetual reward pool. The treasury is reserved for long-term operational, development, security, and ecosystem needs.", muted), PageBreak()]

# Transparency + roadmap
story += [p("07. SUPPLY CONTROLS & TRANSPARENCY", h1), p("The 50,000,000 BATC supply is fixed and the project presents no hidden inflation allocation. Before token launch, Battle Cities should publish the mint address, token-authority status, wallet addresses controlling reserved allocations, liquidity arrangements, and vesting/unlock schedules.", body),
          callout("DISCLOSURE COMMITMENT", "Vesting and unlock schedules are intentionally not specified in v0.4. They will be published in an updated whitepaper and on official channels before relevant token distribution events.", GOLD),
          p("08. ROADMAP", h1)]
roadmap = [[p("Period", table_head), p("Milestone", table_head)],
           [p("Mar 2026", table_cell), p("Website launch", table_cell)], [p("Apr 2026", table_cell), p("Web game launch", table_cell)], [p("May 2026", table_cell), p("Solana Seeker launch", table_cell)], [p("Jun-Jul 2026", table_cell), p("Presale readiness and wallet/allocation validation", table_cell)], [p("Aug 2026", table_cell), p("Presale Stage 1", table_cell)], [p("Sep 2026", table_cell), p("DEX listing and liquidity launch", table_cell)], [p("Oct 2026", table_cell), p("Play Solana and Google Play expansion", table_cell)], [p("Nov 2026 onward", table_cell), p("Ecosystem expansion, community rewards, partnerships, and broader BATC utility", table_cell)]]
roadmap_table = Table(roadmap, colWidths=[44 * mm, 130 * mm], repeatRows=1)
roadmap_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), BLUE), ("BACKGROUND", (0, 1), (-1, -1), PANEL), ("GRID", (0, 0), (-1, -1), 0.35, STEEL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [roadmap_table, Spacer(1, 7 * mm), p("Roadmap dates describe targets and may change based on development, security, platform approval, market, or regulatory considerations.", muted), PageBreak()]

# Risks
story += [p("09. COMMUNITY, RISKS & DISCLAIMERS", h1), p("Battle Cities community channels are part of the game's ongoing competitive ecosystem. Follow official updates and event announcements through <link href='https://discord.gg/jHmYTCVJgm' color='#1677FF'>Discord</link> and <link href='https://x.com/BattleCitiesHQ' color='#1677FF'>X @BattleCitiesHQ</link>.", body),
          p("$BATC is intended as a game utility token. It is not equity, a debt instrument, a deposit, a financial product, or a promise of profit. Digital assets are volatile and may lose all value.", body),
          p("Participation in a presale, token purchase, tournament, or reward program may not be available in every jurisdiction. Players are responsible for their own tax, legal, wallet-security, and eligibility decisions.", body),
          p("Battle Cities will continue to balance gameplay, publish competition rules, and improve transparency as the product grows. This version is an operational whitepaper and does not replace the final token disclosure, terms of service, privacy policy, competition rules, or legal advice.", body), Spacer(1, 15 * mm),
          callout("BATTLE CITIES", "Skill leads the battlefield. BATC powers the player economy.", GOLD), Spacer(1, 25 * mm),
          p("Version 0.4 | August 2026 | battlecities.com", subtitle)]

doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=20 * mm)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="battle", frames=[frame], onPage=on_page)])
doc.build(story)
print(OUT)
