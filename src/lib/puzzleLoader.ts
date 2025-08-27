import type { Puzzle } from '../types'
import { formatDateYYYYMMDD } from './date'

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

export async function loadPuzzleByDate(date: Date): Promise<Puzzle> {
  const dateStr = formatDateYYYYMMDD(date)
  const base = import.meta.env.BASE_URL || '/'
  const dailyPath = `${base}puzzles/${dateStr}.json`
  try {
    return await fetchJson(dailyPath)
  } catch {
    // fallback to sample
    return await fetchJson(`${base}puzzles/sample.json`)
  }
}

