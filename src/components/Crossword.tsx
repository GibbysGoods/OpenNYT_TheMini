import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { CrosswordModel, Direction, FillCell, SelectionState } from '../types'
import './Crossword.css'

function makeEmptyFill(model: CrosswordModel): FillCell[][] {
  return Array.from({ length: model.rows }, () =>
    Array.from({ length: model.cols }, () => ({ guess: '', status: 'normal' as const }))
  )
}

function key(row: number, col: number): string {
  return `${row},${col}`
}

function getEntryCells(model: CrosswordModel, sel: SelectionState): Array<{ row: number; col: number }>{
  const ids = model.positionToEntryId[key(sel.row, sel.col)]
  const id = sel.direction === 'across' ? ids?.across : ids?.down
  if (!id) return []
  return model.entryById[id].cells
}

export interface CrosswordProps {
  model: CrosswordModel
  title: string
  subtitle?: string
}

export default function Crossword({ model, title, subtitle }: CrosswordProps) {
  const [selection, setSelection] = useState<SelectionState>({ row: 0, col: 0, direction: 'across' })
  const [fill, setFill] = useState<FillCell[][]>(() => makeEmptyFill(model))

  useEffect(() => {
    setFill(makeEmptyFill(model))
    setSelection({ row: 0, col: 0, direction: 'across' })
  }, [model])

  const selectedEntryCells = useMemo(() => getEntryCells(model, selection), [model, selection])

  const inputsRef = useRef<Map<string, HTMLInputElement | null>>(new Map())

  const focusCell = useCallback((r: number, c: number) => {
    const el = inputsRef.current.get(key(r, c))
    el?.focus()
  }, [])

  const toggleDirection = useCallback(() => {
    setSelection(sel => ({ ...sel, direction: sel.direction === 'across' ? 'down' : 'across' }))
  }, [])

  const moveSelection = useCallback((dir: Direction | 'left' | 'right' | 'up' | 'down') => {
    setSelection(sel => {
      const { row, col } = sel
      let nr = row
      let nc = col
      if (dir === 'left') nc = Math.max(0, col - 1)
      if (dir === 'right') nc = Math.min(model.cols - 1, col + 1)
      if (dir === 'up') nr = Math.max(0, row - 1)
      if (dir === 'down') nr = Math.min(model.rows - 1, row + 1)
      if (!model.cells[nr][nc].isBlock) {
        setTimeout(() => focusCell(nr, nc), 0)
        return { ...sel, row: nr, col: nc }
      }
      return sel
    })
  }, [model, focusCell])

  const onInput = useCallback((r: number, c: number, value: string) => {
    setFill(prev => {
      const copy = prev.map(row => row.slice())
      copy[r][c] = { ...copy[r][c], guess: value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1) }
      return copy
    })
    // Advance selection within the entry
    const entryCells = getEntryCells(model, selection)
    const idx = entryCells.findIndex(p => p.row === r && p.col === c)
    const next = entryCells[idx + 1]
    if (value && next) {
      setSelection(sel => ({ ...sel, row: next.row, col: next.col }))
      setTimeout(() => focusCell(next.row, next.col), 0)
    }
  }, [model, selection, focusCell])

  const clearCell = useCallback((r: number, c: number) => {
    setFill(prev => {
      const copy = prev.map(row => row.slice())
      copy[r][c] = { ...copy[r][c], guess: '' }
      return copy
    })
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === 'Backspace') {
      if (fill[r][c].guess) {
        clearCell(r, c)
      } else {
        const entryCells = getEntryCells(model, selection)
        const idx = entryCells.findIndex(p => p.row === r && p.col === c)
        const prev = entryCells[idx - 1]
        if (prev) {
          setSelection(sel => ({ ...sel, row: prev.row, col: prev.col }))
          setTimeout(() => focusCell(prev.row, prev.col), 0)
        }
      }
      e.preventDefault()
      return
    }
    if (e.key === 'Tab') {
      toggleDirection()
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowLeft') return moveSelection('left')
    if (e.key === 'ArrowRight') return moveSelection('right')
    if (e.key === 'ArrowUp') return moveSelection('up')
    if (e.key === 'ArrowDown') return moveSelection('down')
  }, [fill, model, selection, toggleDirection, moveSelection, focusCell, clearCell])

  const highlightSet = useMemo(() => {
    const set = new Set<string>()
    for (const p of selectedEntryCells) set.add(key(p.row, p.col))
    return set
  }, [selectedEntryCells])

  const activeAcrossId = model.positionToEntryId[key(selection.row, selection.col)]?.across
  const activeDownId = model.positionToEntryId[key(selection.row, selection.col)]?.down
  const activeId = selection.direction === 'across' ? activeAcrossId : activeDownId

  const checkEntry = useCallback(() => {
    if (!activeId) return
    const entry = model.entryById[activeId]
    setFill(prev => {
      const copy = prev.map(row => row.slice())
      entry.cells.forEach((p) => {
        const right = model.cells[p.row][p.col].solution
        const g = copy[p.row][p.col].guess
        const status = g && g !== right ? 'incorrect' : 'normal'
        copy[p.row][p.col] = { ...copy[p.row][p.col], status }
      })
      return copy
    })
  }, [activeId, model])

  const revealEntry = useCallback(() => {
    if (!activeId) return
    const entry = model.entryById[activeId]
    setFill(prev => {
      const copy = prev.map(row => row.slice())
      entry.cells.forEach((p) => {
        const right = model.cells[p.row][p.col].solution
        copy[p.row][p.col] = { guess: right, status: 'revealed' }
      })
      return copy
    })
  }, [activeId, model])

  const clearEntry = useCallback(() => {
    if (!activeId) return
    const entry = model.entryById[activeId]
    setFill(prev => {
      const copy = prev.map(row => row.slice())
      entry.cells.forEach((p) => {
        copy[p.row][p.col] = { guess: '', status: 'normal' }
      })
      return copy
    })
  }, [activeId])

  return (
    <div className="crossword-app">
      <div className="header">
        <div className="title">{title}</div>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>

      <div className="grid-container">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${model.cols}, 44px)` }}>
          {model.cells.map((row, r) =>
            row.map((cell, c) => {
              const k = key(r, c)
              const isSelected = selection.row === r && selection.col === c
              const isHighlighted = highlightSet.has(k)
              const f = fill[r][c]
              const classes = [
                'cell',
                cell.isBlock ? 'block' : '',
                isSelected ? 'selected' : '',
                isHighlighted ? 'highlight' : '',
                f.status === 'incorrect' ? 'incorrect' : '',
                f.status === 'revealed' ? 'revealed' : '',
              ].filter(Boolean).join(' ')
              return (
                <div key={k} className={classes} onClick={() => setSelection(sel => ({ ...sel, row: r, col: c }))}>
                  {!cell.isBlock && (
                    <>
                      {cell.numberLabel && <div className="number">{cell.numberLabel}</div>}
                      <input
                        ref={(el) => { inputsRef.current.set(k, el) }}
                        value={f.guess}
                        onChange={(e) => onInput(r, c, e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, r, c)}
                        onFocus={() => setSelection(sel => ({ ...sel, row: r, col: c }))}
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        autoCorrect="off"
                      />
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div>
        <div className="controls">
          <button className="control-button" onClick={toggleDirection}>Toggle Direction (Tab)</button>
          <button className="control-button" onClick={checkEntry}>Check</button>
          <button className="control-button" onClick={revealEntry}>Reveal</button>
          <button className="control-button" onClick={clearEntry}>Clear</button>
        </div>

        <div className="clues">
          <ClueList
            heading="Across"
            entries={model.acrossEntries}
            activeId={selection.direction === 'across' ? activeId : undefined}
            onClickEntry={(id) => {
              const e = model.entryById[id]
              const start = e.cells[0]
              setSelection({ row: start.row, col: start.col, direction: 'across' })
              focusCell(start.row, start.col)
            }}
          />
          <ClueList
            heading="Down"
            entries={model.downEntries}
            activeId={selection.direction === 'down' ? activeId : undefined}
            onClickEntry={(id) => {
              const e = model.entryById[id]
              const start = e.cells[0]
              setSelection({ row: start.row, col: start.col, direction: 'down' })
              focusCell(start.row, start.col)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ClueList({ heading, entries, activeId, onClickEntry }: {
  heading: string
  entries: Array<{ id: string; number: string; clue?: string; answer: string }>
  activeId?: string
  onClickEntry: (id: string) => void
}) {
  return (
    <div className="clue-list">
      <h3>{heading}</h3>
      <div>
        {entries.map(e => (
          <div key={e.id} className={`clue-item ${activeId === e.id ? 'active' : ''}`} onClick={() => onClickEntry(e.id)}>
            <div className="clue-num">{e.number}</div>
            <div className="clue-text">{e.clue ?? ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

