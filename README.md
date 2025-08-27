# The Mini Crossword (5x5) – GitHub Pages

A clean, minimal, modern 5×5 crossword app inspired by the Mini. Built as static files, so it runs perfectly on GitHub Pages (or any static hosting).

## Quick start

- Open `index.html` in a browser, or push this repo to GitHub and enable GitHub Pages on the `main` branch.
- The app loads today's puzzle `puzzles/YYYY-MM-DD.json`. If missing, it falls back to the latest listed in `puzzles/index.json`.

## File structure

```
index.html        # App shell
styles.css        # Minimal modern UI
script.js         # Grid, navigation, loader, clues, controls
puzzles/
  index.json      # List of available puzzles { date, title?, author? }
  2025-01-01.json # A sample puzzle
  2025-01-02.json # Another sample puzzle
```

## Puzzle format

- Grid is always 5×5.
- Use `#` for black squares.
- All letters in `grid` should be uppercase A–Z.
- Provide Across and Down clues as arrays ordered by appearance.

Example `puzzles/2025-01-01.json`:

```json
{
  "date": "2025-01-01",
  "title": "Fresh Start",
  "author": "Crossword AI",
  "grid": [
    "GO#US",
    "ALERT",
    "#IRA#",
    "OVALS",
    "BE#SE"
  ],
  "clues": {
    "across": [
      "Proceed",
      "Opposite of them",
      "Wide awake",
      "Retirement acct., briefly",
      "Racetrack shapes",
      "Exist",
      "Compass dir."
    ],
    "down": [
      "Peach State abbr.",
      "Martini garnish",
      "Range east of the Volga",
      "Ave. crosser",
      "Baseball stat",
      "Delivery-room doc",
      "Compass dir."
    ]
  }
}
```

Notes:
- The app auto-numbers clues by scanning the grid left-to-right (Across) then top-to-bottom (Down). The text arrays are consumed in that order, so keep them aligned.
- Answers are taken from the `grid`, and user input is checked against it.

## Adding a daily puzzle

1. Create a new file `puzzles/YYYY-MM-DD.json` following the format above.
2. Add an entry to `puzzles/index.json`:
   ```json
   [
     { "date": "2025-01-01", "title": "Fresh Start", "author": "Crossword AI" },
     { "date": "2025-01-02", "title": "New Leaf", "author": "Crossword AI" }
   ]
   ```
   The app will sort these automatically.
3. Commit and push. GitHub Pages will serve the new puzzle immediately.

## Controls and shortcuts

- Type letters to fill the grid.
- Arrow keys: move and set direction.
- Space: toggle Across/Down.
- Enter/Tab: jump to next clue.
- Check/Reveal: per word or entire puzzle.
- Clear: remove all entries for the current puzzle.

## Persistence

Entries are saved per date to `localStorage`, so users can continue later.

## Deploying on GitHub Pages

- Push to GitHub.
- In repository settings → Pages, set source to `main` branch (root).
- Access your site at `https://<user>.github.io/<repo>/`.

## Creating good 5×5 minis

- Aim for 6–8 across entries and 6–8 down entries by blocking strategically.
- Avoid unchecked letters (every letter should be part of one across and one down if possible).
- Keep answers common and clues concise.
- Use symmetric block patterns for a classic feel, but it’s optional.

## License

MIT