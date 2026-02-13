'use client'

import { useEffect, useState } from 'react'
import { parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import type { Post } from '@/types'
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Share2,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostPreviewProps {
  post: Post
  className?: string
}

function getAccountDisplayName(post: Post): string {
  const accountName = (post.social_account as { account_name?: string } | undefined)?.account_name
  if (typeof accountName === 'string' && accountName.trim().length > 0) {
    return accountName.trim()
  }

  if (post.platform === 'instagram') return 'compte_instagram'
  if (post.platform === 'facebook') return 'Page Facebook'
  return 'Compte social'
}

function getInitials(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PG'
}

export function PostPreview({ post, className }: PostPreviewProps) {
  const scheduledDate = post.scheduled_at
    ? format(parseISO(post.scheduled_at), 'd MMMM yyyy à HH:mm', { locale: fr })
    : null
  const publishedDate = post.published_at
    ? format(parseISO(post.published_at), 'd MMMM yyyy à HH:mm', { locale: fr })
    : null
  const dateLabel =
    post.status === 'published' && publishedDate
      ? `Publié le ${publishedDate}`
      : scheduledDate
        ? `Programmé pour ${scheduledDate}`
        : null

  if (post.platform === 'instagram') {
    return <InstagramPreview post={post} dateLabel={dateLabel} className={className} />
  }

  if (post.platform === 'facebook') {
    return <FacebookPreview post={post} dateLabel={dateLabel} className={className} />
  }

  return null
}

function InstagramPreview({ post, dateLabel, className }: { post: Post; dateLabel: string | null; className?: string }) {
  const accountName = getAccountDisplayName(post)
  const medias = Array.isArray(post.medias) ? post.medias : []

  return (
    <div className={cn("bg-white border border-gray-300 rounded-lg overflow-hidden max-w-sm mx-auto", className)}>
      {/* Header Instagram */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white"></div>
          </div>
          <div>
            <p className="text-sm font-semibold">{accountName}</p>
            {dateLabel && (
              <p className="text-xs text-gray-500">{dateLabel}</p>
            )}
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </div>

      {/* Media */}
      <div className="relative bg-black">
        {medias.length > 0 ? (
          <MediaCarousel medias={medias} />
        ) : (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400">Pas de média</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6" />
            <MessageCircle className="w-6 h-6" />
            <Send className="w-6 h-6" />
          </div>
          <Bookmark className="w-6 h-6" />
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm whitespace-pre-wrap break-words">
            <span className="font-semibold">{accountName}</span>{' '}
            <span>{post.caption}</span>
          </div>
        )}

        {/* Link preview si présent */}
        {post.link && (
          <div className="border border-gray-200 rounded-lg overflow-hidden mt-2">
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-1">{new URL(post.link).hostname}</p>
              <p className="text-sm font-medium line-clamp-2">{post.link}</p>
            </div>
          </div>
        )}

        {/* User tags */}
        {post.user_tags && post.user_tags.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Mentions : {post.user_tags.map(tag => `@${tag.username}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

function FacebookPreview({ post, dateLabel, className }: { post: Post; dateLabel: string | null; className?: string }) {
  const accountName = getAccountDisplayName(post)
  const medias = Array.isArray(post.medias) ? post.medias : []
  const firstMedia = medias[0]

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden max-w-lg mx-auto shadow-sm", className)}>
      {/* Header Facebook */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {getInitials(accountName)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{accountName}</p>
          {dateLabel && (
            <p className="text-xs text-gray-500">{dateLabel}</p>
          )}
          </div>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="p-3 text-sm whitespace-pre-wrap">
          {post.caption}
        </div>
      )}

      {/* Media */}
      {firstMedia && <MediaCarousel medias={medias} mediaClassName="max-h-96" />}

      {/* Link preview */}
      {post.link && (
        <div className="border-t border-gray-200 p-3">
          <div className="flex gap-3">
            <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">{new URL(post.link).hostname}</p>
              <p className="text-sm font-medium line-clamp-2">{post.link}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-around text-gray-600 text-sm">
        <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded">
          <span>👍</span>
          <span>J'aime</span>
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded">
          <MessageCircle className="w-5 h-5" />
          <span>Commenter</span>
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded">
          <Share2 className="w-5 h-5" />
          <span>Partager</span>
        </button>
      </div>
    </div>
  )
}

function MediaCarousel({
  medias,
  mediaClassName,
}: {
  medias: { url: string; type: 'image' | 'video' }[]
  mediaClassName?: string
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const hasMany = medias.length > 1
  const current = medias[currentIndex]
  const isVideo = current?.type === 'video'

  useEffect(() => {
    setCurrentIndex(0)
  }, [medias.length, medias[0]?.url])

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % medias.length)
  }

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + medias.length) % medias.length)
  }

  if (!current) return null

  return (
    <div className="relative">
      {isVideo ? (
        <div className="relative bg-black">
          <video
            src={current.url}
            className={cn('w-full aspect-square object-cover', mediaClassName)}
            controls
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Play className="w-16 h-16 text-white/80" />
          </div>
        </div>
      ) : (
        <img
          src={current.url}
          alt={`Media ${currentIndex + 1}`}
          className={cn('w-full aspect-square object-cover', mediaClassName)}
        />
      )}

      {hasMany && (
        <>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1}/{medias.length}
          </div>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label="Média précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label="Média suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {medias.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition',
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                )}
                aria-label={`Aller au média ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
