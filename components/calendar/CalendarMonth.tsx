'use client'

import { getMonthDays, formatCalendarDate, getPostsForDate, getWeekDayNames } from '@/lib/calendar/utils'
import { isSameMonth, isSameDay, startOfDay } from 'date-fns'
import { CalendarEvent } from './CalendarEvent'
import type { Post } from '@/types'
import { cn } from '@/lib/utils'

interface CalendarMonthProps {
  date: Date
  posts: Post[]
  onDateClick?: (date: Date) => void
}

export function CalendarMonth({ date, posts, onDateClick }: CalendarMonthProps) {
  const days = getMonthDays(date)
  const weekDayNames = getWeekDayNames()
  const today = startOfDay(new Date())

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

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] border-r border-b last:border-r-0 p-2',
                !isCurrentMonth && 'bg-gray-50',
                isToday && 'bg-blue-50'
              )}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1',
                  !isCurrentMonth && 'text-gray-400',
                  isToday && 'text-blue-600 font-bold'
                )}
              >
                {formatCalendarDate(day)}
              </div>
              
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <CalendarEvent key={post.id} post={post} compact />
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
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
