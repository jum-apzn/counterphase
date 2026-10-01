# 역위상 / Counterphase

[Play Counterphase](https://counterphase.js10041530.chatgpt.site/) · Public, no sign-in required

A single-player browser puzzle. One input moves two signals: blue follows your direction, orange moves in the opposite direction. A blocked signal stays still independently. Use walls to align both signals with their own receivers at the same time.

## Run locally

Requires Node.js 20 or newer. No dependencies, account, build service or API key required.

```sh
npm run dev
# Open http://localhost:4173
npm run check
```

The complete game lives in `dist/`. Any static HTTP host can serve that directory. After downloading the source, local play needs no internet connection. Browser module loading requires an HTTP server rather than a file:// URL.

## Controls

- Arrow keys / WASD / on-screen direction pad: move
- Z: undo one move, including after a win
- R: restart this level
- Signals can overlap and pass through each other
- A move where both signals are blocked does not count
- Records are stored only in this browser; sound starts muted

## Level format

`dist/levels.json` is an array of exactly five level objects. Coordinates are zero-based `[x,y]`. Rows have equal width, at most 7 by 7 cells. `#` is a wall and `.` is an open cell. Each level provides two progressive hints and a verified solution.

```json
{
  "id": "01",
  "title": "반대 방향",
  "grid": ["#####", "#...#", "#...#", "#...#", "#####"],
  "start": {"blue": [1, 2], "orange": [3, 2]},
  "goals": {"blue": [2, 1], "orange": [2, 3]},
  "hints": ["파랑은 입력 방향으로, 주황은 반대로 움직여요.", "오른쪽, 위 순서로 움직여 보세요."],
  "solution": ["R", "U"]
}
```

The engine treats the ordered pair of positions as the full state. Breadth-first search verifies solvability and shortest paths. Editing layout, start or goals changes the record fingerprint, so old progress cannot silently apply to a changed puzzle.

## Verification

`npm run check` validates local asset references, JavaScript syntax, and 18 automated tests. See [QA.md](QA.md) for the real-browser verification scope and remaining device coverage.

## Privacy and assets

No accounts, analytics, cookies, network APIs, external fonts, advertising or timers. Graphics are original CSS/SVG shapes; optional audio is synthesized locally. Do not commit credentials, deployment identities, private messages or user information.

## Credits

- Concept and five-stage progression: 점 and 깜
- Implementation and current level data: 점

깜 helped choose the turn-based structure and the opposite-movement → wall-anchoring → combination progression. Code and level-data credit will be updated only when those contributions land.

## Contributions

Puzzle data is separate from the engine and interface. Contributions should include exact solutions, hints and test results. Public credits name only verified contributions.
