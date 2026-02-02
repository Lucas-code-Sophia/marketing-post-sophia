'use client'

import { parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import type { Post } from '@/types'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPlatformColor } from '@/lib/calendar/utils'

interface PostPreviewCompactProps {
  post: Post
  onClick?: () => void
  className?: string
  title?: string
}

/**
 * Aperçu compact d'un post dans le calendrier : même forme que la plateforme cible
 * (Instagram / Facebook / GMB) avec texte, photo ou vidéo + description visible.
 */
export function PostPreviewCompact({ post, onClick, className, title }: PostPreviewCompactProps) {
  const scheduledTime = post.scheduled_at
    ? format(parseISO(post.scheduled_at), 'HH:mm', { locale: fr })
    : null

  const common = { post, scheduledTime, onClick, className, title }

  if (post.platform === 'instagram') {
    return <MiniInstagramCard {...common} />
  }
  if (post.platform === 'facebook') {
    return <MiniFacebookCard {...common} />
  }
  if (post.platform === 'gmb') {
    return <MiniGMBCard {...common} />
  }
  return null
}

function getMedias(post: Post): { url: string; type: string }[] {
  if (!post.medias) return []
  if (Array.isArray(post.medias)) return post.medias as { url: string; type: string }[]
  if (typeof post.medias === 'string') {
    try {
      return JSON.parse(post.medias) as { url: string; type: string }[]
    } catch {
      return []
    }
  }
  return []
}

function MiniInstagramCard({
  post,
  scheduledTime,
  onClick,
  className,
  title,
}: {
  post: Post
  scheduledTime: string | null
  onClick?: () => void
  className?: string
  title?: string
}) {
  const medias = getMedias(post)
  const first = medias[0]
  const isVideo = first?.type === 'video'
  const isCarousel = post.post_type === 'carrousel' && medias.length > 1
  const hasMedia = first?.url

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'bg-white border border-gray-300 rounded-lg overflow-hidden cursor-pointer',
        'hover:shadow-md transition-shadow max-w-full',
        className
      )}
      title={title}
    >
      {/* Header IG */}
      <div className="flex items-center gap-1.5 px-1.5 py-1 border-b border-gray-200">
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex-shrink-0" />
        <span className="text-[10px] font-semibold truncate flex-1">carmen_immobilier</span>
        {scheduledTime && (
          <span className="text-[9px] text-gray-500 flex-shrink-0">{scheduledTime}</span>
        )}
      </div>
      {/* Media ou zone texte */}
      <div className="relative bg-gray-100 aspect-square">
        {hasMedia ? (
          <>
            {isVideo ? (
              <div className="relative w-full h-full bg-black">
                <video
                  src={first.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-6 h-6 text-white/90" fill="white" />
                </div>
              </div>
            ) : (
              <img
                src={first.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            {isCarousel && (
              <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 rounded">
                1/{medias.length}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-1.5">
            <p className="text-[10px] text-gray-500 text-center line-clamp-3">{post.caption || 'Texte'}</p>
          </div>
        )}
      </div>
      {/* Caption */}
      {post.caption && hasMedia && (
        <div className="px-1.5 py-1 border-t border-gray-100">
          <p className="text-[10px] text-gray-800 line-clamp-2">
            <span className="font-semibold">carmen_immobilier</span> {post.caption}
          </p>
        </div>
      )}
    </div>
  )
}

function MiniFacebookCard({
  post,
  scheduledTime,
  onClick,
  className,
  title,
}: {
  post: Post
  scheduledTime: string | null
  onClick?: () => void
  className?: string
  title?: string
}) {
  const medias = getMedias(post)
  const first = medias[0]
  const isVideo = first?.type === 'video'
  const hasMedia = first?.url

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer shadow-sm',
        'hover:shadow-md transition-shadow max-w-full',
        className
      )}
      title={title}
    >
      {/* Header FB */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-200">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          CI
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate">Carmen Immobilier</p>
          {scheduledTime && (
            <p className="text-[9px] text-gray-500">Programmé {scheduledTime}</p>
          )}
        </div>
      </div>
      {/* Caption (FB met le texte en premier) */}
      {post.caption && (
        <div className="px-2 py-1 border-b border-gray-100">
          <p className="text-[10px] text-gray-800 line-clamp-2 whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}
      {/* Media */}
      {hasMedia ? (
        <div className="relative bg-black aspect-video max-h-20">
          {isVideo ? (
            <div className="relative w-full h-full">
              <video
                src={first.url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="w-8 h-8 text-white/90" fill="white" />
              </div>
            </div>
          ) : (
            <img
              src={first.url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
        </div>
      ) : (
        !post.caption && (
          <div className="px-2 py-2 min-h-[2rem]">
            <p className="text-[10px] text-gray-400">Publication texte</p>
          </div>
        )
      )}
    </div>
  )
}

function MiniGMBCard({
  post,
  scheduledTime,
  onClick,
  className,
  title,
}: {
  post: Post
  scheduledTime: string | null
  onClick?: () => void
  className?: string
  title?: string
}) {
  const medias = getMedias(post)
  const first = medias[0]
  const hasMedia = first?.url

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'rounded-lg overflow-hidden cursor-pointer border border-gray-200',
        'hover:shadow-md transition-shadow max-w-full',
        getPlatformColor(post.platform),
        className
      )}
      title={title}
    >
      <div className="p-1.5 text-white">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-bold uppercase">GMB</span>
          {scheduledTime && <span className="text-[9px] opacity-90">{scheduledTime}</span>}
        </div>
        {hasMedia ? (
          <div className="relative aspect-video rounded overflow-hidden bg-black/20 mb-1">
            {first.type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  src={first.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <Play className="absolute inset-0 m-auto w-6 h-6 text-white/90" fill="white" />
              </div>
            ) : (
              <img
                src={first.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ) : null}
        {post.caption && (
          <p className="text-[10px] line-clamp-2 opacity-95">{post.caption}</p>
        )}
      </div>
    </div>
  )
}
