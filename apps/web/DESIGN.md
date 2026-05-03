<!-- SEED — re-run $impeccable document once there's code to capture the actual tokens and components. -->
---
name: RunHop Web
description: Serious endurance-sport product UI with premium, disciplined restraint.
---

# Design System: RunHop Web

## Overview

**Creative North Star: "The Racing House"**

RunHop should feel like a serious endurance platform with the authority of an established racing institution. The visual system must project trust, discipline, and premium restraint for runners, cyclists, and race organizers who expect credibility before they commit to an event, a registration, or a community. The mood is not playful fitness, not bubbly wellness, and not generic consumer software. It is performance-minded, sharp, and composed.

The seed direction draws from Ferrari and Bugatti, but it must translate that influence into product behavior rather than pure marketing spectacle. The result should feel controlled and serious, where strong hierarchy, precise spacing, sharp geometry, and disciplined accent use do the work. Premium here means confidence without decoration.

**Key Characteristics:**

- Near-black and neutral surfaces with one red accent used sparingly.
- Sharp geometry, with no soft or rounded overall feel.
- Single disciplined sans direction across the interface.
- Serious product tone before social warmth.
- Motion limited to state feedback and clarity.
- Product UI first, with marketing polish layered through restraint rather than playfulness.

## Colors

The palette should follow a restrained strategy: tinted dark neutrals, controlled light surfaces where needed, and one racing-red accent used only when the interface needs to assert priority or trust.

### Primary
- **Racing Red** ([to be resolved during implementation]): The only high-voltage accent. Reserved for primary actions, key conversion moments, critical highlights, and signature brand signals.

### Neutral
- **Track Black** ([to be resolved during implementation]): The dominant dark canvas. Never pure black. Used for primary app surfaces and high-trust backgrounds.
- **Pit Graphite** ([to be resolved during implementation]): Elevated dark surface for panels, containers, and secondary layers.
- **Timing White** ([to be resolved during implementation]): Controlled light surface for contrast moments, structured editorial sections, and selected marketing bands.
- **Steel Grey** ([to be resolved during implementation]): Muted text, dividers, and supporting information.

**The Scarcity Rule.** The red accent must stay rare. If it starts behaving like decoration instead of command, the system is wrong.

## Typography

**Display Font:** [font pairing to be chosen at implementation]
**Body Font:** [font pairing to be chosen at implementation]
**Label/Mono Font:** [font pairing to be chosen at implementation]

**Character:** The typography should feel disciplined, technical, and premium without becoming cold or futuristic. It must read like a serious product for committed athletes and organizers, not like a luxury fashion poster or a generic startup dashboard.

### Hierarchy
- **Display** ([to be resolved during implementation]): Used sparingly for marketing hero statements and high-authority page headers.
- **Headline** ([to be resolved during implementation]): Used for section titles, major feature headers, and event page structure.
- **Title** ([to be resolved during implementation]): Used for cards, modules, and grouped interface blocks.
- **Body** ([to be resolved during implementation]): Used for descriptions, helper text, event details, and long-form content. Reading width should remain controlled where prose matters.
- **Label** ([to be resolved during implementation]): Used for buttons, navigation, metadata, filters, and compact interface signals.

**The One Voice Rule.** The interface should speak in one disciplined sans voice unless a future implementation proves a second family is necessary. Decorative type is forbidden.

## Elevation

This seed system should be flat by default. Depth should come primarily from tonal layering, contrast, spacing, and image hierarchy rather than obvious shadow stacks. When elevation appears, it should communicate structure or interaction state, not softness.

**The Flat-By-Default Rule.** If a surface looks lifted for aesthetic comfort rather than function, it has drifted toward the wrong product category.

## Components

Component patterns are intentionally not locked yet because no frontend implementation exists. When code begins, the first scan-mode pass should document the real button, input, navigation, card, and shell patterns used in `apps/web`.

## Do's and Don'ts

### Do:
- **Do** keep the system restrained, with one red accent and disciplined neutral surfaces.
- **Do** make the product feel serious, disciplined, premium, and classy in both marketing and authenticated product surfaces.
- **Do** use sharp or minimally rounded geometry so the interface feels established and trustworthy.
- **Do** optimize for WCAG AA readability, strong hierarchy, and clear interaction feedback.
- **Do** treat race registration and organizer credibility as core high-trust moments in the interface.

### Don't:
- **Don't** make it feel like Meta.
- **Don't** make it feel like MongoDB.
- **Don't** make it feel bubbly, soft, or childlike like playful fitness apps.
- **Don't** make it feel Fitbit-like in tone or wellness positioning.
- **Don't** make it feel Google-like, generic, rounded, or overly friendly.
- **Don't** let the interface become playful, toy-like, socially noisy, or casually cute.
- **Don't** use rounded, pill-heavy product styling as the default component language.
