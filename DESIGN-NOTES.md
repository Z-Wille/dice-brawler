# Dice Brawler UI redesign

Open `index.html` in a browser. No build step is required.

## Composition and direction

The previous screen separated the dungeon from a narrow enemy information column, while a narrow wrapping dice tray competed with four tall stat cards. Small abbreviations and similar numeric treatments obscured the relationship between permanent stats, healing, and actual hit damage. Wasted allocations were explained only in a tooltip.

The redesign uses two shared regions: a full-width dungeon with enemy name, HP, passive and intent inset around the opponent; and a player console containing health, dice, destinations, probabilities, commit consequences and actions. The artwork keeps square sprite pixels. The square frame uses consistent insets, borders and aligned columns.

Available dice have light faces. Selected dice have a pointer, outline and PICKED label. Assigned dice have a checkmark and destination label; their destinations have an inset marker. Available destinations have dashed borders. Disabled actions are muted and have plain borders. Dice remain selectable for reassignment until commit.

Permanent upgrades show current → planned stats. Strength reports base hit damage; the single summary above Attack reports normal and critical damage after armor and guard, alongside dodge and critical probabilities. Healing reports actual recoverable HP. The commit line reports healing followed by HP if the incoming strike lands, and enemy HP after a normal hit, including regeneration. It identifies lethal normal hits and possible lethal critical hits. The preview is conditional, not a promise of the random outcome.

## Verification

The latest simplification groups the three permanent upgrades under one heading, distinguishes Recover HP, removes repeated growth labels and the initial instruction sequence, and moves all combat predictions beside Attack. The footer shows only the latest event; History expands upward to show earlier events, newest first. Long latest events intentionally use an ellipsis, with their complete text retained in the accessible status element and moved into History when the next event arrives.

Actual headless Chrome screenshots are in `screenshots/`, at 640 and 900 px square game sizes. Each size includes initial, selected, partially assigned, ready, resolving, victory and defeat states, plus the expanded history. The test harness uses deterministic dice and explicit game-state fixtures to reach these states; victory/defeat then execute the real asynchronous combat handlers. These captures do not represent complete organically played runs.

`node scripts/verify-ui.cjs` repeats the captures on macOS with Google Chrome installed. It uses Chrome's debugging pipe and Node built-ins, without package installation. It also checks healing caps, wasted allocations, armor/critical/guard calculation order, reassignment, commit gating, latest-event retention, and history expansion/collapse. Geometry reports cover key controls and regions, with no overflow observed at supported sizes. Browser screenshots were visually inspected and the design iterated to correct stretched sprites and raise the minimum readable size.

## Limits

The minimum supported game square is **640 × 640 CSS px**, plus the surrounding 16 px page inset. Smaller windows retain the full-size square and show a scrolling notice; this is deliberately not a phone-sized interface. `390-minimum-size-notice.png` documents this constraint.

The smallest secondary labels remain compact; 900 px is the more comfortable presentation. Debug configurations with more than three dice use a horizontally scrolling dice tray. Extreme debug values and all possible debug layouts have not been visually verified. VT323 still loads from Google Fonts, with a monospace fallback; offline fallback typography has not been verified. Safari compatibility is checked with the system WebKit engine using `scripts/verify-webkit.swift`: run `swift scripts/verify-webkit.swift "$PWD/index.html"` on macOS. It verifies live resizing at 932, 672 and 390 px viewport widths, square geometry, control overflow, dice assignment, combat resolution, history, modal focus and debug restart. The game uses explicit equal width and height, inline-size containment and explicit button styling to avoid Safari layout and native-control differences. Firefox and physical iOS devices have not been tested. No first-time-player usability study was conducted, so comprehension is a design judgment rather than a measured result.
