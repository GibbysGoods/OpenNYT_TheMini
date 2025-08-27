import type { CrosswordModel, CellModel, EntryModel, Puzzle } from '../types'

function key(row: number, col: number): string {
  return `${row},${col}`
}

export function buildCrosswordModel(puzzle: Puzzle): CrosswordModel {
  const rows = puzzle.size.rows
  const cols = puzzle.size.cols

  if (puzzle.grid.length !== rows) {
    throw new Error('Puzzle grid rows do not match size.rows')
  }

  const cells: CellModel[][] = []

  for (let r = 0; r < rows; r++) {
    const rowString = puzzle.grid[r]
    if (rowString.length !== cols) {
      throw new Error(`Puzzle grid row ${r} does not match size.cols`)
    }
    const row: CellModel[] = []
    for (let c = 0; c < cols; c++) {
      const ch = rowString[c]
      const isBlock = ch === '#'
      row.push({
        row: r,
        col: c,
        isBlock,
        solution: isBlock ? '' : ch.toUpperCase(),
      })
    }
    cells.push(row)
  }

  let numberCounter = 1
  const acrossEntries: EntryModel[] = []
  const downEntries: EntryModel[] = []
  const positionToEntryId: Record<string, { across?: string; down?: string }> = {}
  const entryById: Record<string, EntryModel> = {}

  // Determine starts and label numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c]
      if (cell.isBlock) continue

      const startsAcross = c === 0 || cells[r][c - 1].isBlock
      const startsDown = r === 0 || cells[r - 1][c].isBlock

      if (startsAcross || startsDown) {
        cell.numberLabel = String(numberCounter++)
      }

      if (startsAcross) {
        const coords: Array<{ row: number; col: number }> = []
        let cc = c
        while (cc < cols && !cells[r][cc].isBlock) {
          coords.push({ row: r, col: cc })
          cc++
        }
        const number = cell.numberLabel!
        const id = `A-${number}`
        const answer = coords.map(p => cells[p.row][p.col].solution).join('')
        const entry: EntryModel = {
          id,
          number,
          direction: 'across',
          cells: coords,
          answer,
          clue: puzzle.clues.across[number],
        }
        acrossEntries.push(entry)
        entryById[id] = entry
        for (const p of coords) {
          const k = key(p.row, p.col)
          positionToEntryId[k] = positionToEntryId[k] || {}
          positionToEntryId[k].across = id
        }
      }

      if (startsDown) {
        const coords: Array<{ row: number; col: number }> = []
        let rr = r
        while (rr < rows && !cells[rr][c].isBlock) {
          coords.push({ row: rr, col: c })
          rr++
        }
        const number = cell.numberLabel!
        const id = `D-${number}`
        const answer = coords.map(p => cells[p.row][p.col].solution).join('')
        const entry: EntryModel = {
          id,
          number,
          direction: 'down',
          cells: coords,
          answer,
          clue: puzzle.clues.down[number],
        }
        downEntries.push(entry)
        entryById[id] = entry
        for (const p of coords) {
          const k = key(p.row, p.col)
          positionToEntryId[k] = positionToEntryId[k] || {}
          positionToEntryId[k].down = id
        }
      }
    }
  }

  return {
    rows,
    cols,
    cells,
    acrossEntries,
    downEntries,
    positionToEntryId,
    entryById,
  }
}

