import { useEffect, useMemo, useState } from 'react'
import { buildCrosswordModel } from './lib/buildModel'
import { loadPuzzleByDate } from './lib/puzzleLoader'
import { parseDateFromSearch } from './lib/date'
import type { Puzzle } from './types'
import Crossword from './components/Crossword'
import './App.css'

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dt = parseDateFromSearch(window.location.search) ?? new Date()
    loadPuzzleByDate(dt)
      .then(setPuzzle)
      .catch((e) => setError(String(e)))
  }, [])

  const model = useMemo(() => (puzzle ? buildCrosswordModel(puzzle) : null), [puzzle])

  if (error) return <div style={{ padding: 24 }}>Error: {error}</div>
  if (!puzzle || !model) return <div style={{ padding: 24 }}>Loading puzzle…</div>

  const subtitle = [puzzle.author, puzzle.date].filter(Boolean).join(' • ')

  return (
    <div>
      <Crossword model={model} title={puzzle.title} subtitle={subtitle} />
    </div>
  )
}

export default App
