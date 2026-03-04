# Development Tracks & Milestones

### Track 1: Data Plumbing & Engine Core (Current)
- [x] Set up Manifest V3 framework.
- [x] Implement `MutationObserver` to reliably capture the third-party signature.
- [x] Build the deterministic `mulberry32` PRNG.
- [x] Create the `generateProceduralPet` loop (reverse chronology parsing).
- [x] Verify console outputs match expected procedural outcomes.

### Track 2: Visual Rendering (The Paper Doll System)
- [x] Create `style.css` for absolute positioning and layering.
- [x] Decide on visual medium (CSS shapes vs. layered SVG vs. Emojis).
- [x] Build the `spawnPet(petState)` function to construct the DOM element based on engine output.
- [x] Map the procedural array (e.g., `['slime', '#FF0055', 'bat-wings']`) to actual visual classes/styles.

### Track 3: Pathfinding & Interaction
- [x] Inject the generated pet into the `.js-calendar-graph` container.
- [x] Map the coordinates (`x`, `y` attributes) of `rect.ContributionCalendar-day` elements.
- [x] Build a `setInterval` or `requestAnimationFrame` patrol loop.
- [x] Add basic collision/arrival logic so the pet stops on a square.
- [x] Add an interaction state (e.g., hover over the pet to see its stat block/mutation history).

### Track 4: Polishing & Portability
- [ ] Add a popup toggle (`popup.html`) to disable the pet on certain profiles.
- [ ] Refactor the core engine into a pure JS module so the procedural generation logic can be easily lifted into an external web app or stream widget later.
