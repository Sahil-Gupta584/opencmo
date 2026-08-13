Recreate the provided OpenCMO landing-page screenshot as closely as possible. Treat the screenshot as the visual source of truth. Do NOT redesign it, modernize it, simplify it, or substitute generic SaaS styling. The goal is a highly faithful recreation of the visual language, spacing, typography, colors, borders, shadows, gradients, grid, proportions, and overall composition.

IMPORTANT:

* Ignore the small dashboard/product UI visible at the bottom of the screenshot. Do not implement the dashboard details.
* Focus on the website chrome/navigation, hero section, background, badge, headline, description, CTA buttons, supporting text, and the beginning/top edge of the large product preview container.
* The page should feel like a premium editorial/developer SaaS landing page rather than a conventional startup template.
* The design is intentionally soft, warm, minimal, slightly playful, and typography-driven.
* Preserve the large amount of whitespace.
* Do not introduce extra sections, cards, illustrations, gradients, icons, or decorative elements that aren't present in the reference.

==================================================

1. OVERALL PAGE / CANVAS
   ==================================================

Viewport reference:

* Screenshot dimensions: approximately 1265 × 900 px.
* Desktop-first layout.
* Main page background is an extremely light warm off-white / ivory rather than pure white.
* Approximate base background: #FFFAF7.
* The entire page has a very subtle warm/pink atmospheric glow in certain areas.

The page is divided visually into:

1. Top navigation bar.
2. Large hero section.
3. Large product-preview frame beginning near the bottom of the viewport.

The hero is centered horizontally.

The visual style should communicate:

* premium
* editorial
* calm
* sophisticated
* open-source/developer oriented
* slightly playful
* soft coral/pink/lavender color palette
* strong typography contrast

Avoid:

* excessive rounded cards
* heavy shadows
* dark navy SaaS styling
* blue/purple startup gradients
* excessive animations
* generic Inter-only typography
* excessive glassmorphism

==================================================
2. TOP NAVIGATION
=================

Create a horizontal navigation bar at the very top.

Height:

* Approximately 80px.

Background:

* Same warm off-white as the page: approximately #FFFAF7.
* No strong visible shadow.
* There is a very subtle horizontal divider/border at the bottom around #F2E8E3.

Content has a centered max-width container of approximately 1115–1120px.

Approximate horizontal layout:

LEFT:

* OpenCMO logo/brand.
* Positioned approximately 75px from the left edge of the screenshot.
* Logo consists of a small rounded-square coral icon followed by the word "OpenCMO".

Logo icon:

* Approximately 32px × 32px.
* Coral/orange background.
* Approximate color: #FF6F59 / #FF705B.
* Border radius: approximately 9px.
* Inside is a lowercase/rounded white "o".
* White symbol is centered.
* The icon has no visible border.
* Very subtle soft shadow/glow may be used.
* The icon should feel like a compact app/logo mark.

Brand text:

* "OpenCMO"
* Dark warm charcoal rather than pure black.
* Approximate color: #332A28.
* Font should feel like a refined serif/editorial font.
* Medium/bold weight.
* Approximately 15–16px.
* Vertically centered with the logo.
* Gap between logo and text: approximately 9–10px.

CENTER NAV:
The navigation links sit around the center/right-center of the navbar.

Links:

* "How it works"
* "Roadmap"
* "Pricing"
* GitHub icon followed by "Open source"

Approximate font:

* 14px.
* Warm muted brown/gray.
* Approximately #796B66.
* Medium or regular weight.
* No underline.
* No pill backgrounds.

Spacing:

* Approximately 36–40px between standard navigation items.
* "Open source" has a small GitHub/octocat outline icon immediately before the text.
* Icon approximately 16px.
* Icon and text separated by ~7px.

RIGHT:
Two actions:

1. "Sign in"
2. "Try OpenCMO →"

"Sign in":

* Approximately 14px.
* Semibold.
* Dark warm gray.
* It is displayed over two lines in the screenshot because of the constrained width:
  "Sign"
  "in"
* Width around 25–30px.
* Line-height approximately 18px.
* Align vertically around center.

"Try OpenCMO" button:

* Dark charcoal/brown background.
* Approximate color: #302A29.
* Approximately 159px × 40px.
* Pill-shaped.
* Border radius approximately 22px / fully rounded.
* White text.
* Font size approximately 13–14px.
* Font weight 600–700.
* Text: "Try OpenCMO"
* Right-facing arrow "→" on the right.
* Arrow is approximately 18px.
* Text and arrow separated by around 10px.
* No visible border.
* Very subtle shadow if needed.

Right-side spacing:

* Approximately 35–40px between "Sign in" and the CTA.

The navbar should remain visually lightweight. Do not make it sticky unless required by the application architecture.

==================================================
3. HERO BACKGROUND / GRID
=========================

Immediately beneath the navbar, create the main hero background.

The most distinctive background feature is a very subtle square grid.

Grid:

* Thin 1px lines.
* Extremely low contrast.
* Warm beige/pink tint.
* Approximate line color: rgba(232, 207, 199, 0.35–0.5).
* Grid cells approximately 42px × 42px.
* Vertical and horizontal lines are evenly spaced.
* Grid spans the entire hero background horizontally and vertically.
* It should remain subtle enough that the typography dominates.

The grid begins immediately beneath the navbar.

Background base:

* #FFFAF7 / warm ivory.

Add extremely subtle atmospheric radial glows behind the hero:

* A soft warm coral/peach glow around the lower-center/left-center region.
* A very subtle pale pink/lavender glow around the right side of the hero.
* These should be highly diffused.
* No obvious hard-edged gradients.
* Think blurred radial light rather than a conventional colorful gradient background.

Suggested implementation:

* One or more absolutely positioned radial-gradient layers with huge blur.
* Opacity approximately 0.08–0.18.
* Do not let the glow overpower the grid.

The lower-center area behind the product preview has a slightly stronger peach/orange atmospheric glow.

==================================================
4. HERO POSITIONING
===================

The hero content is centered horizontally.

The top of the hero begins after the ~80px navbar.

There is generous whitespace above the badge.

Badge top:

* Approximately 175px from the top of the entire screenshot.
* Roughly 95px below the navbar.

Badge is centered horizontally.

The headline starts around y=245–250px.

The description starts around y=466px.

CTA row starts around y=550px.

Small supporting text starts around y=619px.

The product preview starts around y=737px.

Do not compress these vertical relationships.

==================================================
5. SMALL HERO BADGE
===================

Create a centered outlined pill above the headline.

Approximate dimensions:

* Width: 309px.
* Height: 35px.
* Centered horizontally.
* Top position around 175px.
* Border radius: approximately 18px / fully pill-shaped.

Background:

* Nearly white/warm ivory.
* Approximately #FFFDFC.

Border:

* 1px solid very pale peach/coral.
* Approximate #F2CFC6.
* Subtle outer glow/shadow around the border.
* Shadow should be extremely soft and diffuse.

Inside:
LEFT:

* Small coral circular dot.
* Approximately 10px diameter.
* Color approximately #FF6F59.

TEXT:
"OPEN SOURCE MARKETING
STUDIO"

The screenshot displays it over two lines:
OPEN SOURCE MARKETING
STUDIO

Use uppercase.

Typography:

* Small approximately 11–12px.
* Letter spacing approximately 2px.
* Medium/bold weight.
* Coral/orange color approximately #F36F5C.
* Center aligned.
* Line height approximately 13–14px.
* Because the badge is only ~35px high, the text should be compact.

The dot is positioned around 15px from the left edge.
Text starts approximately 60px from the left.
The badge should feel like a small editorial label, not a standard SaaS status pill.

==================================================
6. MAIN HERO HEADLINE
=====================

This is the dominant visual element.

Text exactly:

"Turn small signals
into campaigns."

Use two lines.

Line 1:
Turn small signals

Line 2:
into campaigns.

Typography is extremely important.

The headline uses a high-contrast editorial serif/display font.

It should resemble fonts such as:

* Instrument Serif
* Cormorant Garamond
* Canela-style editorial serif
* Playfair Display only if a closer font is unavailable

Prefer a modern high-contrast serif with:

* thick vertical stems
* very thin hairlines
* elegant curved terminals
* dramatic contrast
* slightly narrow proportions
* fashion/editorial appearance

Do NOT use a generic serif such as Times New Roman.

Approximate font size:

* Around 100px desktop.
* Depending on chosen font, approximately 94–105px.
* Very large.
* Font weight around 500–600 depending on font.
* Tight letter spacing, approximately -4px to -6px.
* Line-height approximately 0.92–0.98.

Headline width:

* Approximately 700–720px.
* Center aligned.

First line:
"Turn small signals"
is dark charcoal.

Approximate dark text color:
#332A28 / #342B29.

Second line:
"into campaigns."
has a smooth multi-color gradient.

The gradient begins with coral/orange on the left and transitions through pink/magenta into lavender/periwinkle blue on the right.

Approximate visual stops:

* left: #FF7059
* around 25%: #F87986
* around 50%: #E987B7
* around 72%: #B98BDE
* right: #7E9FEA

Use a horizontal linear gradient approximately 90deg.

IMPORTANT:
The gradient must be applied to the actual text glyphs using background-clip/text rather than placing a gradient behind the text.

The gradient should be subtle and elegant, not neon.

The second line is approximately the same size as the first line.

There is a slight optical overlap/tightness between the two lines due to the very tight line-height.

The overall headline should occupy roughly:

* width: 680–700px
* height: 180px.

The period at the end should also receive the gradient.

==================================================
7. HERO DESCRIPTION
===================

Below the headline, add centered supporting copy.

Exact text:

"OpenCMO turns your rough idea into a useful Reddit conversation - then
gives it a clear path to every channel that comes next."

Two lines.

Typography:

* Sans-serif.
* Approximately 18px.
* Regular weight.
* Line-height approximately 28px.
* Color approximately #806F69 / #81716C.
* Center aligned.
* Maximum width approximately 610–630px.

The em dash "-" is part of the sentence.

Do not make this text bold.

There should be approximately 25–30px of vertical gap between the headline and description.

The text should feel soft and understated compared to the headline.

==================================================
8. PRIMARY + SECONDARY CTA ROW
==============================

Below the description, create a centered horizontal button row.

Approximate top spacing:

* 34–35px below the description.

Two buttons.

PRIMARY BUTTON:
Text:
"Start with a signal  →"

Dimensions:

* Approximately 194px × 50px.
* Fully rounded pill.
* Border radius approximately 25px.
* Background coral/orange.
* Approximate color: #FF6F59.
* White text.
* Font approximately 13px.
* Weight 600–700.
* Slightly generous horizontal padding.

Arrow:

* White right arrow.
* Approximately 17px.
* Positioned around 12px after the text.

Button shadow:

* Very soft warm coral shadow.
* Something similar to:
  0 8px 20px rgba(255, 111, 89, 0.18)
* Keep it subtle.

Hover:

* Slightly darker/brighter coral.
* Translate upward only 1–2px.
* Shadow can increase slightly.
* Keep animation around 150–200ms.

SECONDARY BUTTON:
Text:
"▶  See the workflow"

Dimensions:

* Approximately 193px × 50px.
* Pill-shaped.
* Border radius approximately 25px.
* Background nearly transparent / same warm ivory.
* 1px border.
* Border color approximately #E9D4CD.
* Text color approximately #756661.
* Font around 13–14px.
* Medium weight.

The play icon:

* Small dark warm-gray triangular play icon.
* Approximately 12px.
* Positioned before "See the workflow".
* Gap around 9px.

There should be approximately 12px horizontal spacing between the two buttons.

The buttons should be vertically aligned exactly.

==================================================
9. MICRO COPY UNDER BUTTONS
===========================

Below the CTA row, add:

"Bring your own AI subscription · $5/mo · no usage anxiety"

Centered.

Typography:

* Approximately 12px.
* Warm muted beige/gray.
* Approximate #AA9690.
* Regular weight.
* Very subtle.
* Letter spacing around 0 to 0.2px.

There is approximately 16–18px of gap between the buttons and this text.

The centered dot separators should be actual middle dots:
·

Do not use vertical bars.

==================================================
10. PRODUCT PREVIEW CONTAINER
=============================

At approximately y=737px, a large product-preview window begins.

Only implement the outer shell/top portion visible in the screenshot. Ignore the detailed dashboard UI inside.

The preview is centered.

Approximate width:

* 1100px.
* Left edge approximately 82px.
* Right edge approximately 82px.
* It extends beyond the bottom of the viewport.

Top corners:

* Approximately 20–22px border radius.

Background:

* Warm white / off-white.
* Approximately #FFFCFA.

Border:

* Extremely subtle 1px border.
* Approximate #F0DDD7.

Shadow:

* Large, soft, diffuse shadow.
* Example:
  0 20px 60px rgba(80, 45, 35, 0.08)
* Do not use a dark or sharp shadow.

There is also a faint warm glow behind the preview frame.

The product preview should look like a premium application screenshot floating above the page.

At the very top of the preview is a thin browser/app-shell style header.

Header height:

* Approximately 40px.

Top-left:
three tiny circular window dots:

* coral/orange
* yellow/peach
* green
* approximately 7–8px each
* separated by 5–6px

Next to them:
small uppercase text resembling:
"OPENGCMO /"
and below/adjacent:
"WORKSPACE"

This is part of the ignored product UI; only reproduce enough of the shell to make the preview believable.

Top-right:
small green status dot followed by:
"connected · your AI"

Again, detailed internal dashboard can be ignored.

IMPORTANT:
Do not let the product preview dominate the hero. The headline remains the visual focal point.

==================================================
11. COLORS
==========

Use a tightly controlled palette.

Primary background:
#FFFAF7

Primary dark text:
#332A28

Muted text:
#806F69

Very muted text:
#A9958F

Primary coral:
#FF6F59

Coral variation:
#F87563

Soft peach:
#F9DDD4

Pink:
#E987B7

Lavender:
#B88DDD

Periwinkle:
#7F9FE8

Dark button:
#302A29

Grid:
rgba(226, 202, 194, 0.35)

Subtle border:
#EFDCD5

Badge border:
#F0CEC5

White:
#FFFDFC

Do not introduce saturated greens/blues except where the reference requires them.

==================================================
12. TYPOGRAPHY
==============

Typography hierarchy is critical.

Use two font families:

DISPLAY:
A high-contrast editorial serif for:

* hero headline
* OpenCMO brand if appropriate
* product preview headings if implemented

Preferred:
Instrument Serif if available.

Alternative:
Cormorant Garamond / DM Serif Display / Playfair Display.

BODY:
A clean modern sans-serif.

Preferred:
Inter / Geist / system sans.

Navigation:
14px.

Description:
18px / 28px.

Buttons:
13–14px / 600 weight.

Microcopy:
12px.

Badge:
11–12px uppercase with approximately 2px letter spacing.

Headline:
approximately 100px desktop, very tight line-height.

Do not use the same font family for everything.

==================================================
13. RESPONSIVE BEHAVIOR
=======================

Desktop screenshot is the primary reference, but implement responsive behavior carefully.

At widths above 1100px:

* Preserve the large headline.
* Keep hero centered.
* Navbar stays horizontal.
* Product preview remains approximately 90% viewport width with max-width around 1100px.

At tablet widths:

* Reduce headline to approximately 70–80px.
* Navigation spacing decreases.
* Keep CTA buttons side-by-side if there is room.

At mobile:

* Headline around 52–60px.
* Two-line composition should remain visually intentional.
* Navigation links can collapse into a mobile menu.
* CTA buttons can stack vertically.
* Badge can reduce width slightly.
* Product preview can become horizontally clipped/scrollable rather than destroying the desktop composition.
* Maintain the warm background and subtle grid.

Do NOT simply scale everything down proportionally.

==================================================
14. SPACING / RHYTHM
====================

Preserve the visual rhythm approximately:

Navbar:
80px high.

Navbar → badge:
~95px.

Badge:
35px high.

Badge → headline:
~38–40px.

Headline:
~175–180px tall.

Headline → description:
~28px.

Description:
~55px.

Description → CTA:
~34px.

CTA:
50px high.

CTA → microcopy:
~16px.

Microcopy → product preview:
~105px.

The large empty spaces are intentional.

Do not vertically compress the page.

==================================================
15. GRID IMPLEMENTATION
=======================

Implement the background grid using CSS rather than an image.

Example conceptual approach:

background-image:
linear-gradient(...),
linear-gradient(...);

with approximately 42px background-size.

The grid should:

* be 1px thin
* have very low opacity
* use warm beige/pink
* cover the hero
* disappear/fade naturally near areas where the product preview overlays it.

The grid should not look like graph paper. It should be extremely subtle.

==================================================
16. GLOW / ATMOSPHERE
=====================

Use multiple blurred radial gradients.

Behind the left/middle hero:

* very faint coral/peach radial glow.

Behind the right side:

* extremely faint pink/lavender radial glow.

Behind the lower product preview:

* slightly stronger warm peach glow.

All glows should have:

* huge radius
* very low opacity
* heavy blur
* no visible hard boundary.

The page should still look almost white when viewed from a distance.

==================================================
17. BORDERS / RADIUS / SHADOW LANGUAGE
======================================

The entire design uses soft rounded geometry.

Primary CTA:
25px radius.

Secondary CTA:
25px radius.

Badge:
18px radius.

Logo:
9px radius.

Product preview:
20–22px radius.

Borders:
1px only.

Never use thick borders.

Shadows:
soft and diffuse.
Avoid:

* harsh black shadows
* inset shadows
* excessive elevation

The design should feel almost flat, with only the product preview and primary CTA having noticeable depth.

==================================================
18. INTERACTION / ANIMATION
===========================

Keep animations subtle.

On page load:

* Hero content can fade/translate upward by ~8px.
* Duration around 500–700ms.
* Use ease-out.

Headline should remain stable after loading.

Buttons:

* hover translateY(-1px)
* slightly stronger shadow
* 150–200ms transition.

Navigation:

* subtle opacity/color transition on hover.

Do NOT add:

* particles
* floating objects
* cursor effects
* excessive parallax
* animated gradients
* spinning logos
* flashy scroll animations

==================================================
19. IMPORTANT VISUAL PRIORITIES
===============================

If exact implementation conflicts with technical convenience, prioritize these elements in this order:

1. Headline typography and dimensions.
2. Warm ivory background.
3. Subtle square grid.
4. Coral → pink → lavender headline gradient.
5. Hero vertical spacing.
6. Badge styling.
7. CTA dimensions and colors.
8. Navbar proportions.
9. Soft atmospheric glows.
10. Product-preview outer frame.

The headline should immediately resemble the screenshot even if the rest of the page is viewed only briefly.

==================================================
20. FINAL DESIGN TEST
=====================

After implementation, compare the rendered page against the reference screenshot at approximately 1265 × 900px.

Check specifically:

* Is the navbar approximately 80px tall?
* Is the logo around x=75px?
* Is the badge around y=175px?
* Does the headline begin around y=250px?
* Is the headline approximately 100px and editorial-serif?
* Is "Turn small signals" dark?
* Is "into campaigns." coral → pink → lavender/blue?
* Is the description centered and muted?
* Are the two CTA buttons approximately 50px high?
* Is the primary button coral and pill-shaped?
* Is the secondary button white/ivory with a thin peach border?
* Is the microcopy small and muted?
* Does the product preview begin around y=737px?
* Is the background grid extremely subtle?
* Are the glows barely visible?
* Does the entire page feel warm, premium, editorial, and calm?

Do not make the page look like a generic AI SaaS landing page. The combination of the editorial serif headline, warm ivory canvas, tiny grid, coral/pink/lavender typography gradient, extremely soft shadows, and generous whitespace is the core identity of this design.
