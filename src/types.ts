export type Direction = 'across' | 'down'

export interface Puzzle {
  title: string
  author?: string
  date: string // YYYY-MM-DD
  size: { rows: number; cols: number }
  // Grid is solution: use '#' for blocks, letters A-Z for solution characters
  grid: string[]
  clues: {
    across: Record<string, string>
    down: Record<string, string>
  }
}

export interface CellModel {
  row: number
  col: number
  isBlock: boolean
  solution: string // single uppercase character or '' when block
  // Optional displayed number label if this cell starts any entry
  numberLabel?: string
}

export interface EntryModel {
  id: string // e.g., A-1, D-12
  number: string
  direction: Direction
  cells: Array<{ row: number; col: number }>
  answer: string
  clue?: string
}

export interface CrosswordModel {
  rows: number
  cols: number
  cells: CellModel[][]
  acrossEntries: EntryModel[]
  downEntries: EntryModel[]
  // Fast lookup helpers
  positionToEntryId: Record<string, { across?: string; down?: string }>
  entryById: Record<string, EntryModel>
}

export interface FillCell {
  guess: string
  status: 'normal' | 'incorrect' | 'revealed'
}

export interface SelectionState {
  row: number
  col: number
  direction: Direction
}

