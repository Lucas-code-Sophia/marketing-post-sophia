'use client'

import { useState } from 'react'
import { getWeekDays, getPostsForDate, getWeekDayNames } from '@/lib/calendar/utils'
import { isSameDay, startOfDay, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { CalendarEvent } from './CalendarEvent'
import { useDayTitles, toDateKey } from '@/hooks/useDayTitles'
import type { Post } from '@/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface CalendarWeekProps {
  date: Date
  posts: Post[]
  onDateClick?: (date: Date) => void
  onPostClick?: (post: Post) => void
}

export function CalendarWeek({ date, posts, onDateClick, onPostClick }: CalendarWeekProps) {
  const days = getWeekDays(date)
  const weekDayNames = getWeekDayNames()
  const today = startOfDay(new Date())
  const { getTitle, setTitle } = useDayTitles()
  const [editingDateKey, setEditingDateKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const startEditing = (day: Date) => {
    const key = toDateKey(day)
    setEditingDateKey(key)
    setEditingValue(getTitle(day))
  }

  const saveTitle = (day: Date) => {
    setTitle(day, editingValue)
    setEditingDateKey(null)
    setEditingValue('')
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* En-tête jours de la semaine */}
      <div className="grid grid-cols-7 border-b">
        {weekDayNames.map((dayName, index) => {
          const day = days[index]
          const dayLabel = format(day, 'd MMM', { locale: fr })
          const isToday = isSameDay(day, today)
          const dateKey = toDateKey(day)
          const title = getTitle(day)
          const isEditing = editingDateKey === dateKey

          return (
            <div
              key={index}
              className={cn(
                'p-3 text-center border-r last:border-r-0',
                isToday && 'bg-blue-50'
              )}
            >
              <div className="text-xs text-gray-500 mb-1">{dayName}</div>
              <button
                type="button"
                onClick={() => startEditing(day)}
                className={cn(
                  'text-sm font-medium block w-full rounded hover:bg-gray-200/80 transition-colors py-0.5',
                  isToday && 'text-blue-600 font-bold'
                )}
              >
                {dayLabel}
              </button>
              {isEditing ? (
                <Input
                  autoFocus
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => saveTitle(day)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle(day)
                    if (e.key === 'Escape') {
                      setEditingDateKey(null)
                      setEditingValue('')
                    }
                  }}
                  placeholder="Titre du jour"
                  className="h-7 text-xs py-1 px-2 mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : title ? (
                <p className="text-xs text-gray-700 font-medium mt-1 line-clamp-2" title={title}>
                  {title}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Colonnes des jours */}
      <div className="grid grid-cols-7 min-h-[600px]">
        {days.map((day, index) => {
          const dayPosts = getPostsForDate(posts, day)
          const isToday = isSameDay(day, today)

          return (
            <div
              key={index}
              className={cn(
                'border-r last:border-r-0 p-3',
                isToday && 'bg-blue-50'
              )}
            >
              <div className="space-y-3">
                {dayPosts.length > 0 ? (
                  dayPosts.map((post) => (
                    <CalendarEvent key={post.id} post={post} compact onClick={onPostClick} />
                  ))
                ) : (
                  <div className="text-sm text-gray-400 text-center py-4">
                    Aucun post
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
