'use client'

import { parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import type { Post } from '@/types'
import { getPlatformColor, getPlatformTextColor } from '@/lib/calendar/utils'
import { getStatusLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CalendarEventProps {
  post: Post
  compact?: boolean
}

export function CalendarEvent({ post, compact = false }: CalendarEventProps) {
  const router = useRouter()
  
  const scheduledTime = post.scheduled_at 
    ? format(parseISO(post.scheduled_at), 'HH:mm', { locale: fr })
    : null

  const handleClick = () => {
    router.push(`/posts/${post.id}`)
  }

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={`
          ${getPlatformColor(post.platform)}
          text-white text-xs p-1 rounded cursor-pointer hover:opacity-80
          truncate border
        `}
        title={`${post.platform} - ${post.post_type} - ${getStatusLabel(post.status)}`}
      >
        {scheduledTime && <span className="font-medium">{scheduledTime}</span>}
        <span className="ml-1 truncate">
          {post.caption ? post.caption.substring(0, 20) : post.post_type}
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={`
        ${getPlatformColor(post.platform)}
        text-white p-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity
        border shadow-sm
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase">
              {post.platform}
            </span>
            <span className="text-xs opacity-75">
              {post.post_type}
            </span>
          </div>
          {scheduledTime && (
            <div className="text-xs font-medium mb-1">
              {scheduledTime}
            </div>
          )}
          {post.caption && (
            <p className="text-xs line-clamp-2">
              {post.caption}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs opacity-75">
          {getStatusLabel(post.status)}
        </span>
      </div>
    </div>
  )
}
