'use client'

import { parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import type { Post } from '@/types'
import { getPlatformColor } from '@/lib/calendar/utils'
import { getStatusLabel } from '@/lib/utils'
import { Play, Images } from 'lucide-react'
import { PostPreviewCompact } from '@/components/posts/PostPreviewCompact'
import { cn } from '@/lib/utils'

interface CalendarEventProps {
  post: Post
  compact?: boolean
  onClick?: (post: Post) => void
}

export function CalendarEvent({ post, compact = false, onClick }: CalendarEventProps) {
  const scheduledTime = post.scheduled_at
    ? format(parseISO(post.scheduled_at), 'HH:mm', { locale: fr })
    : null

  let mediasArray: { url: string; type: string }[] = []
  if (post.medias) {
    if (Array.isArray(post.medias)) mediasArray = post.medias as { url: string; type: string }[]
    else if (typeof post.medias === 'string') {
      try {
        mediasArray = JSON.parse(post.medias) as { url: string; type: string }[]
      } catch {
        mediasArray = []
      }
    }
  }
  const firstMedia = mediasArray.length > 0 ? mediasArray[0] : null
  const isVideo = firstMedia?.type === 'video'
  const isCarousel = post.post_type === 'carrousel' && mediasArray.length > 1
  const hasMedia = firstMedia?.url && firstMedia.url.trim() !== ''

  const handleClick = () => {
    if (onClick) {
      onClick(post)
    }
  }

  // Vue calendrier (mois) : aperçu en forme de la plateforme (texte / photo / vidéo + description)
  if (compact) {
    return (
      <PostPreviewCompact
        post={post}
        onClick={handleClick}
        className="border border-gray-200 shadow-sm"
        title={`${post.platform} - ${post.post_type} - ${getStatusLabel(post.status)}`}
      />
    )
  }

  // Vue semaine - plus grande avec image toujours visible
  return (
    <div
      onClick={handleClick}
      className="group relative rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-gray-200 bg-white"
    >
      {/* Image principale - toujours visible */}
      {hasMedia ? (
        <div className="relative aspect-square bg-gray-100">
          <img
            src={firstMedia.url}
            alt="Post"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Si l'image ne charge pas, afficher un placeholder
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center ${getPlatformColor(post.platform)} text-white p-4">
                    <div class="text-center">
                      <div class="text-sm font-medium uppercase mb-2">${post.platform}</div>
                      <div class="text-xs">Image non disponible</div>
                    </div>
                  </div>
                `
              }
            }}
          />
          {/* Badge plateforme - toujours visible */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`${getPlatformColor(post.platform)} text-white text-xs px-2 py-1 rounded font-medium uppercase shadow-lg`}>
              {post.platform}
            </span>
          </div>
          {/* Indicateurs - toujours visibles */}
          {isVideo && (
            <div className="absolute top-3 right-3 bg-black/80 text-white p-2 rounded-full z-10 shadow-lg">
              <Play className="w-4 h-4" fill="white" />
            </div>
          )}
            {isCarousel && (
              <div className="absolute top-3 right-3 bg-black/80 text-white p-2 rounded-full z-10 shadow-lg">
                <Images className="w-4 h-4" />
                <span className="absolute -bottom-1 -right-1 bg-white text-black text-[10px] px-1 rounded font-bold">
                  {mediasArray.length}
                </span>
              </div>
            )}
          {/* Overlay léger avec infos - toujours visible mais plus foncé au survol */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/75 group-hover:via-black/30 transition-all">
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              {scheduledTime && (
                <div className="text-sm font-bold bg-black/50 px-2 py-1 rounded inline-block mb-2 drop-shadow-lg">
                  {scheduledTime}
                </div>
              )}
              {post.caption && (
                <p className="text-sm line-clamp-2 mb-1 drop-shadow-lg font-medium">
                  {post.caption}
                </p>
              )}
              <div className="text-xs opacity-90 drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded inline-block">
                {getStatusLabel(post.status)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-4 ${getPlatformColor(post.platform)} text-white`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium uppercase">
              {post.platform}
            </span>
            <span className="text-xs opacity-75">
              {post.post_type}
            </span>
          </div>
          {scheduledTime && (
            <div className="text-sm font-medium mb-2">
              {scheduledTime}
            </div>
          )}
          {post.caption && (
            <p className="text-sm line-clamp-3 mb-2">
              {post.caption}
            </p>
          )}
          <div className="text-xs opacity-75">
            {getStatusLabel(post.status)}
          </div>
        </div>
      )}
    </div>
  )
}
