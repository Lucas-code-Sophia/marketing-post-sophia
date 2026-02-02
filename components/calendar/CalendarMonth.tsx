'use client'

import { useState } from 'react'
import { getMonthDays, formatCalendarDate, getPostsForDate, getWeekDayNames } from '@/lib/calendar/utils'
import { isSameMonth, isSameDay, startOfDay } from 'date-fns'
import { CalendarEvent } from './CalendarEvent'
import { useDayTitles, toDateKey } from '@/hooks/useDayTitles'
import type { Post } from '@/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface CalendarMonthProps {
  date: Date
  posts: Post[]
  onDateClick?: (date: Date) => void
  onPostClick?: (post: Post) => void
}

export function CalendarMonth({ date, posts, onDateClick, onPostClick }: CalendarMonthProps) {
  const days = getMonthDays(date)
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
    const key = toDateKey(day)
    setTitle(day, editingValue)
    setEditingDateKey(null)
    setEditingValue('')
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* En-tête jours de la semaine */}
      <div className="grid grid-cols-7 border-b">
        {weekDayNames.map((dayName) => (
          <div
            key={dayName}
            className="p-2 text-center text-sm font-medium text-gray-600 border-r last:border-r-0"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayPosts = getPostsForDate(posts, day)
          const isCurrentMonth = isSameMonth(day, date)
          const isToday = isSameDay(day, today)
          const dateKey = toDateKey(day)
          const title = getTitle(day)
          const isEditing = editingDateKey === dateKey

          return (
            <div
              key={index}
              className={cn(
                'min-h-[120px] border-r border-b last:border-r-0 p-2',
                !isCurrentMonth && 'bg-gray-50',
                isToday && 'bg-blue-50'
              )}
            >
              {/* Numéro du jour : cliquable pour ajouter/modifier le titre */}
              <div className="mb-1 flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => startEditing(day)}
                  className={cn(
                    'text-sm font-medium w-fit rounded px-1 -mx-1 hover:bg-gray-200/80 transition-colors text-left',
                    !isCurrentMonth && 'text-gray-400',
                    isToday && 'text-blue-600 font-bold'
                  )}
                >
                  {formatCalendarDate(day)}
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
                    className="h-7 text-xs py-1 px-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : title ? (
                  <p className="text-xs text-gray-700 font-medium line-clamp-2 break-words" title={title}>
                    {title}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <CalendarEvent key={post.id} post={post} compact onClick={onPostClick} />
                ))}
                {dayPosts.length > 3 && (
                  <div
                    className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded text-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      if (onPostClick && dayPosts.length > 3) {
                        onPostClick(dayPosts[3])
                      }
                    }}
                  >
                    +{dayPosts.length - 3} autre{dayPosts.length - 3 > 1 ? 's' : ''}
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
