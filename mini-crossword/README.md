# Open Mini Crossword

An open-source, minimal clone of the New York Times "The Mini" crossword.

Clean, modern UI. Easily configurable daily puzzles using JSON files.

## Features

- 5x5 crossword grid with keyboard navigation and inputs
- Automatic clue numbering for Across and Down
- Clue lists with active highlighting
- Actions: Toggle direction, Check, Reveal, Clear
- Load daily puzzle by date with fallback sample
- Query override via `?date=YYYY-MM-DD`
- Lightweight, dependency-free runtime (React + Vite)

## Getting Started

```bash
cd /workspace/mini-crossword
npm install
npm run dev
```

Open the dev server URL printed in the terminal.

## Puzzle Loading

The app fetches puzzles from `public/puzzles/{YYYY-MM-DD}.json`.

- If a file for today is missing, it falls back to `public/puzzles/sample.json`.
- You can override the date via query string: `?date=2025-01-01`.

### JSON Schema

See `public/puzzles/schema.json` for the format. A quick example:

```json
{
  "title": "Mini Sample",
  "author": "Open Source",
  "date": "2025-01-01",
  "size": { "rows": 5, "cols": 5 },
  "grid": [
    "APPLE",
    "P#E#R",
    "ERA#A",
    "REDO#",
    "EARS#"
  ],
  "clues": {
    "across": { "1": "Fruit that keeps the doctor away" },
    "down": { "1": "Period of history" }
  }
}
```

- `#` denotes a block cell.
- All letters are uppercase A–Z.

## Add Daily Puzzles

Place files at `public/puzzles/YYYY-MM-DD.json`, e.g. `public/puzzles/2025-02-01.json`.

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Ensure your default branch is `main` (or update the workflow trigger).
2. Go to your repo Settings → Pages → Build and deployment: set Source to "GitHub Actions".
3. The workflow at `.github/workflows/deploy.yml` builds and deploys on pushes to `main`.
4. It sets the Vite base path automatically to `/${repo-name}/`.

Local build with base path (to preview locally):

```bash
# Replace my-repo-name with your repository name
BASE_PATH=/my-repo-name/ npm run build
npm run preview
```

## License

MIT

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
