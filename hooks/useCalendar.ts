'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types'
import { getPostsForMonth, getPostsForWeek } from '@/lib/calendar/utils'

export type CalendarView = 'month' | 'week'

interface UseCalendarOptions {
  initialView?: CalendarView
  initialDate?: Date
}

export function useCalendar(options: UseCalendarOptions = {}) {
  const { initialView = 'month', initialDate = new Date() } = options
  
  const [view, setView] = useState<CalendarView>(initialView)
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Non connecté')
        return
      }

      // Récupérer le rôle de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      // Construire la requête selon le rôle
      let query = supabase
        .from('posts')
        .select('*, social_account:social_accounts(account_name)')
        .in('status', ['scheduled', 'published', 'publishing'])
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true })

      // Users ne voient que leurs posts
      if (userData?.role === 'user') {
        query = query.eq('created_by', user.id)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setPosts(data || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [currentDate, view])

  // Filtrer les posts selon la vue
  const filteredPosts = view === 'month' 
    ? getPostsForMonth(posts, currentDate)
    : getPostsForWeek(posts, currentDate)

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    posts: filteredPosts,
    allPosts: posts,
    loading,
    error,
    refetch: fetchPosts,
  }
}
