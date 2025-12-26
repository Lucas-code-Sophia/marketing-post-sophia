import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek as _startOfWeek, 
  endOfWeek as _endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  parseISO,
} from 'date-fns'

// Re-export startOfWeek and endOfWeek for use in components
export { _startOfWeek as startOfWeek, _endOfWeek as endOfWeek }
import { fr } from 'date-fns/locale/fr'
import type { Post, PlatformType } from '@/types'

/**
 * Retourne la couleur selon la plateforme
 */
export function getPlatformColor(platform: PlatformType): string {
  const colors: Record<PlatformType, string> = {
    facebook: 'bg-blue-500 border-blue-600',
    instagram: 'bg-pink-500 border-pink-600',
    gmb: 'bg-green-500 border-green-600',
  }
  return colors[platform] || 'bg-gray-500 border-gray-600'
}

/**
 * Retourne la couleur du texte selon la plateforme
 */
export function getPlatformTextColor(platform: PlatformType): string {
  const colors: Record<PlatformType, string> = {
    facebook: 'text-blue-600',
    instagram: 'text-pink-600',
    gmb: 'text-green-600',
  }
  return colors[platform] || 'text-gray-600'
}

/**
 * Formate une date pour l'affichage dans le calendrier
 */
export function formatCalendarDate(date: Date): string {
  return format(date, 'd', { locale: fr })
}

/**
 * Formate le mois/année pour l'en-tête
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: fr })
}

/**
 * Formate la semaine pour l'en-tête
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const start = format(startDate, 'd MMM', { locale: fr })
  const end = format(endDate, 'd MMM yyyy', { locale: fr })
  return `${start} - ${end}`
}

/**
 * Retourne tous les jours d'un mois avec les jours de la semaine précédente/suivante
 */
export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = _startOfWeek(monthStart, { weekStartsOn: 1 }) // Lundi
  const calendarEnd = _endOfWeek(monthEnd, { weekStartsOn: 1 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

/**
 * Retourne tous les jours d'une semaine
 */
export function getWeekDays(date: Date): Date[] {
  const weekStart = _startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = _endOfWeek(date, { weekStartsOn: 1 })

  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}

/**
 * Filtre les posts pour une date donnée
 */
export function getPostsForDate(posts: Post[], date: Date): Post[] {
  const targetDate = startOfDay(date)
  
  return posts.filter((post) => {
    if (!post.scheduled_at) return false
    
    const postDate = startOfDay(parseISO(post.scheduled_at))
    return isSameDay(postDate, targetDate)
  })
}

/**
 * Filtre les posts pour un mois donné
 */
export function getPostsForMonth(posts: Post[], date: Date): Post[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  
  return posts.filter((post) => {
    if (!post.scheduled_at) return false
    
    const postDate = parseISO(post.scheduled_at)
    return postDate >= monthStart && postDate <= monthEnd
  })
}

/**
 * Filtre les posts pour une semaine donnée
 */
export function getPostsForWeek(posts: Post[], date: Date): Post[] {
  const weekStart = _startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = _endOfWeek(date, { weekStartsOn: 1 })
  
  return posts.filter((post) => {
    if (!post.scheduled_at) return false
    
    const postDate = parseISO(post.scheduled_at)
    return postDate >= weekStart && postDate <= weekEnd
  })
}

/**
 * Navigation : mois suivant
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1)
}

/**
 * Navigation : mois précédent
 */
export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1)
}

/**
 * Navigation : semaine suivante
 */
export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1)
}

/**
 * Navigation : semaine précédente
 */
export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1)
}

/**
 * Retourne les noms des jours de la semaine
 */
export function getWeekDayNames(): string[] {
  return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
}
