import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getLocalDateStr } from '../lib/formatters'
import { predict } from '../lib/prediction/predict'
import { useProfile } from './useProfile'
import type { PredictionResult, BoardWorker, WorkInfoSection, BoardEntry } from '../lib/prediction/types'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'portpal-dispatch-predictor'

interface StoredPrefs {
  board: string
  plate: number | null
}

function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredPrefs>
      return {
        board: parsed.board || '',
        plate: parsed.plate ?? null,
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { board: '', plate: null }
}

function savePrefs(prefs: StoredPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors (private browsing, quota)
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDispatchPredictor() {
  const { profile } = useProfile()
  const [stored] = useState(() => loadPrefs())

  // Board: prefer localStorage, fall back to profile, default to 'b' (most casuals)
  const [board, setBoard] = useState<string>(
    stored.board || profile.board?.toLowerCase() || 'b'
  )
  const [plate, setPlate] = useState<number | null>(stored.plate)
  const [shift] = useState<string>('0800') // Day shift default — most relevant for casuals

  // Refs to avoid stale closures in callbacks
  const boardRef = useRef(board)
  boardRef.current = board
  const plateRef = useRef(plate)
  plateRef.current = plate

  // Sync board from profile on first load if no stored preference
  useEffect(() => {
    if (!stored.board && profile.board) {
      setBoard(profile.board.toLowerCase())
    }
  }, [profile.board, stored.board])

  // Persist prefs when they change
  const updateBoard = useCallback((newBoard: string) => {
    setBoard(newBoard)
    savePrefs({ board: newBoard, plate: plateRef.current })
  }, [])

  const updatePlate = useCallback((newPlate: number | null) => {
    setPlate(newPlate)
    savePrefs({ board: boardRef.current, plate: newPlate })
  }, [])

  const todayStr = getLocalDateStr(new Date())

  // Fetch board roster + work-info in a single query function
  const { data: prediction, isLoading, isError, refetch } = useQuery({
    queryKey: ['dispatch-prediction', board, plate, shift, todayStr],
    queryFn: async (): Promise<PredictionResult | null> => {
      if (!plate || plate < 1) return null

      // Fetch latest board_monitor_tick for this board
      // The boards column is JSONB: { a: {..., workers: [...]}, b: {...}, ... }
      // We fetch the latest tick and extract workers for the target board
      const { data: tickData, error: tickError } = await supabase
        .from('board_monitor_ticks')
        .select('boards, date')
        .order('tick_at', { ascending: false })
        .limit(1)
        .single()

      if (tickError && tickError.code !== 'PGRST116') {
        console.warn('[useDispatchPredictor] tick fetch error:', tickError.message)
      }

      let boardWorkers: BoardWorker[] = []
      let tickDate = todayStr

      if (tickData?.boards) {
        const boards = tickData.boards as Record<string, BoardEntry>
        const boardEntry = boards[board.toLowerCase()]
        if (boardEntry?.workers) {
          boardWorkers = boardEntry.workers
        }
        if (tickData.date) {
          // date comes as YYYY-MM-DD from Supabase DATE column
          tickDate = typeof tickData.date === 'string'
            ? tickData.date.slice(0, 10)
            : todayStr
        }
      }

      // Fetch latest work-info snapshot for Vancouver
      const { data: workInfo, error: workInfoError } = await supabase
        .from('work_info_snapshots')
        .select('sections')
        .eq('location', 'vancouver')
        .order('scraped_at', { ascending: false })
        .limit(1)
        .single()

      if (workInfoError && workInfoError.code !== 'PGRST116') {
        console.warn('[useDispatchPredictor] work-info fetch error:', workInfoError.message)
      }

      const workInfoSections: WorkInfoSection[] = (workInfo?.sections ?? []) as WorkInfoSection[]

      // Run prediction
      return predict(
        { board, plate, shift, date: tickDate },
        { boardWorkers, workInfoSections, date: tickDate },
      )
    },
    enabled: !!plate && plate > 0,
    staleTime: 2 * 60 * 1000,      // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  })

  return {
    // User inputs
    board,
    plate,
    shift,
    setBoard: updateBoard,
    setPlate: updatePlate,
    // Prediction result
    prediction: prediction ?? null,
    loading: isLoading,
    error: isError,
    refetch,
    // Whether user has entered enough info
    isReady: !!plate && plate > 0,
  }
}
