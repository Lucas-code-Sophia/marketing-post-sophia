'use client'

import { getWeekDays, formatCalendarDate, getPostsForDate, getWeekDayNames } from '@/lib/calendar/utils'
import { isSameDay, startOfDay, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { CalendarEvent } from './CalendarEvent'
import type { Post } from '@/types'
import { cn } from '@/lib/utils'

interface CalendarWeekProps {
  date: Date
  posts: Post[]
  onDateClick?: (date: Date) => void
}

export function CalendarWeek({ date, posts, onDateClick }: CalendarWeekProps) {
  const days = getWeekDays(date)
  const weekDayNames = getWeekDayNames()
  const today = startOfDay(new Date())

  return (
    <div className="bg-white rounded-lg border">
      {/* En-tête jours de la semaine */}
      <div className="grid grid-cols-7 border-b">
        {weekDayNames.map((dayName, index) => {
          const day = days[index]
          const dayLabel = format(day, 'd MMM', { locale: fr })
          const isToday = isSameDay(day, today)

          return (
            <div
              key={index}
              className={cn(
                'p-3 text-center border-r last:border-r-0',
                isToday && 'bg-blue-50'
              )}
            >
              <div className="text-xs text-gray-500 mb-1">{dayName}</div>
              <div
                className={cn(
                  'text-sm font-medium',
                  isToday && 'text-blue-600 font-bold'
                )}
              >
                {dayLabel}
              </div>
            </div>
          )
        })}
      </div>

      {/* Colonnes des jours */}
      <div className="grid grid-cols-7 min-h-[500px]">
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
              <div className="space-y-2">
                {dayPosts.length > 0 ? (
                  dayPosts.map((post) => (
                    <CalendarEvent key={post.id} post={post} />
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
