# Verification

Verified on 2026-10-01. This is the first playable, five-level release.

## Automated checks

`npm run check` passes:

- All local HTML, JavaScript module, and level-data references exist
- JavaScript syntax checks
- 18 tests covering engine, level validation, storage, and app-event integration
- Breadth-first search confirms shortest solutions of 2, 3, 8, 11, and 12 moves
- Independent movement review covered 4,912 position-pair/direction cases
- No-op inputs, independent wall collisions, overlap and crossing, and simultaneous goals
- Corrupt/incompatible/unavailable local storage, record fingerprints, and best-score updates
- Immediate repeated input, held-key filtering, win → undo, restart, level navigation, hints, modal guards, focus loss, and reset behavior

The app-event tests use a lightweight DOM harness. They complement real-browser checks; they do not claim browser rendering coverage.

## Real Chromium browser checks

- Public production URL loads without signing in
- All five authored solutions completed using the real on-screen controls
- Arrow/WASD movement, blocked input, visible overlap, restart, undo after a win, next-level navigation
- Progress and best records survive reload
- A held arrow produces one move; moving focus to the address bar does not advance the puzzle
- Two progressive hints; reset-confirmation cancellation preserves records
- Level and information dialogs, public source link, and accurate concept/development credits
- Sound begins muted; on/off state and audio initialization checked without game-origin console errors
- Desktop viewport around 1180 × 757; full board and controls fit after the short-height layout adjustment
- Responsive layout and controls checked at 500 × 757 and 400 × 606 CSS pixels using window resizing and browser zoom; no horizontal overflow

## Limits

Physical iOS/Android devices, Safari, and Firefox were not tested. Browser audio initialization was checked, but acoustic quality was not independently evaluated. These are coverage limits, not known gameplay failures.

## Runtime dependencies

None. All game code, graphics, fonts, and level data are local assets. The only outgoing user-facing link is the public source repository. Gameplay makes no external API calls.
