'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarMonth } from './CalendarMonth'
import { CalendarWeek } from './CalendarWeek'
import { PostPreviewModal } from '@/components/posts/PostPreviewModal'
import { useCalendar, type CalendarView as ViewType } from '@/hooks/useCalendar'
import {
  getNextMonth,
  getPreviousMonth,
  getNextWeek,
  getPreviousWeek,
  formatMonthYear,
  formatWeekRange,
  startOfWeek,
  endOfWeek,
} from '@/lib/calendar/utils'
import { fr } from 'date-fns/locale'
import type { Post } from '@/types'

interface CalendarViewProps {
  initialView?: ViewType
}

export function CalendarView({ initialView = 'month' }: CalendarViewProps) {
  const {
    view,
    setView,
    currentDate,
    setCurrentDate,
    posts,
    loading,
    error,
  } = useCalendar({ initialView, initialDate: new Date() })

  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(getPreviousMonth(currentDate))
    } else {
      setCurrentDate(getPreviousWeek(currentDate))
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(getNextMonth(currentDate))
    } else {
      setCurrentDate(getNextWeek(currentDate))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement du calendrier...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">Erreur : {error}</div>
      </div>
    )
  }

  const headerTitle = view === 'month'
    ? formatMonthYear(currentDate)
    : formatWeekRange(
        startOfWeek(currentDate, { weekStartsOn: 1 }),
        endOfWeek(currentDate, { weekStartsOn: 1 })
      )

  return (
    <div className="space-y-4">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {headerTitle}
          </h2>
          
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={handleToday} className="ml-4">
            Aujourd'hui
          </Button>
        </div>

        {/* Toggle vue */}
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            <Grid className="mr-2 h-4 w-4" />
            Mois
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Semaine
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      {view === 'month' ? (
        <CalendarMonth date={currentDate} posts={posts} onPostClick={handlePostClick} />
      ) : (
        <CalendarWeek date={currentDate} posts={posts} onPostClick={handlePostClick} />
      )}

      {/* Modal d'aperçu */}
      <PostPreviewModal
        post={selectedPost}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        canEdit={true}
      />
    </div>
  )
}
