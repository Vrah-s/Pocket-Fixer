# Pocket Workshop — Starter Game Plan

## Game pitch

Run a small repair shop where each customer brings a curious object with a quick, tactile puzzle to solve. Successful repairs earn coins, unlock new jobs, and let the player personalize the shop. A session should feel complete in about 2–5 minutes.

## Design goals

- Easy to understand in the first minute.
- Repairs feel hands-on and satisfying on a touchscreen.
- Each job is short, with a clear finish and reward.
- Progress is friendly and steady; no energy timers or pay-to-win upgrades.
- Portrait-first interface that works on phones and tablets.

## Core loop

1. Choose the next customer job.
2. Inspect the object and its simple repair request.
3. Complete a touch puzzle using the right tool or action.
4. See the repair result and earn coins/stars.
5. Spend coins on shop decorations or unlock the next set of jobs.

## First playable version (MVP)

- One workshop screen and a short interactive tutorial.
- 3 repair puzzle types: clean/restore, connect or fit parts, and align/adjust.
- 10 jobs built from those mechanics, with increasing difficulty.
- 3 tools, a basic coin and star reward, and 6 shop decorations.
- Local save for unlocked jobs, currency, and chosen decorations.
- Settings for sound, music, and language; pause/restart controls.
- Android and iOS builds from one shared codebase.

### Not in the first version

Online accounts, player-to-player visits, live events, a large story, and randomized loot. These add cost before we know whether the repair puzzles are fun.

## Example first jobs

1. Clean a dusty toy robot by rubbing the screen.
2. Reconnect a broken radio by dragging matching wires to terminals.
3. Tighten a loose clock by turning a gear into the marked position.
4. Fit the right colored pieces into a cracked flowerpot.
5. Remove rust from a bicycle bell, then test it.

Each job should introduce one action, then later jobs can combine familiar actions with a little more challenge.

## Progression and rewards

- Coins are earned for completing jobs; stars reflect how carefully/quickly the repair was done, without blocking progress.
- Decorations are cosmetic and persist between sessions.
- New job sets introduce new object themes and puzzle variations.
- Avoid punitive failure: let players retry immediately, with a gentle hint after repeated attempts.

## Monetization direction

Keep the core game playable without payment. If ads are added later, use optional rewarded ads for a hint or bonus coins, and consider a one-time purchase to remove ads. Do not interrupt a repair with an ad. Validate platform store and child-safety requirements before release.

## Milestones

1. **Paper prototype:** Draw the shop and test 3 repair puzzles with people; confirm the interactions are understandable and enjoyable.
2. **Touch prototype:** Build one polished repair from start to finish, including touch input, feedback, and a reward.
3. **Vertical slice:** Add the workshop screen, tutorial, 3 puzzle types, and save/load; test on real Android and iPhone devices.
4. **MVP content:** Create the remaining jobs, decorations, sound, accessibility settings, and localization-ready text.
5. **Release prep:** Check performance, device layouts, privacy/store requirements, and prepare store assets and builds.

## Decisions to make next

- Art direction: cozy hand-drawn, clean 3D, or bright flat 2D.
- First audience: general casual players or family-friendly play for younger players.
- Whether to include optional ads at launch or first release a paid/ad-free prototype.
- Game engine and target device range.

## Early success checks

- A new player can finish the first repair without verbal help.
- Players understand what to do on the next job.
- The repair action feels satisfying before adding shop progression.
- The game stays readable and responsive on a small phone screen.

