'use client'

import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'

const STORAGE_KEY = 'sophia_socials_calendar_day_titles'

function getStored(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function setStored(map: Record<string, string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

/** Clé date au format YYYY-MM-DD */
export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function useDayTitles() {
  const [titles, setTitles] = useState<Record<string, string>>(getStored)

  useEffect(() => {
    setTitles(getStored())
  }, [])

  const getTitle = useCallback((date: Date) => {
    return titles[toDateKey(date)] ?? ''
  }, [titles])

  const setTitle = useCallback((date: Date, title: string) => {
    const key = toDateKey(date)
    const next = { ...titles }
    if (title.trim() === '') {
      delete next[key]
    } else {
      next[key] = title.trim()
    }
    setTitles(next)
    setStored(next)
  }, [titles])

  return { getTitle, setTitle, titles }
}
