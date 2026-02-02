'use client'

import { parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import type { Post } from '@/types'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Share2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostPreviewProps {
  post: Post
  className?: string
}

export function PostPreview({ post, className }: PostPreviewProps) {
  const scheduledDate = post.scheduled_at 
    ? format(parseISO(post.scheduled_at), 'd MMMM yyyy à HH:mm', { locale: fr })
    : null

  if (post.platform === 'instagram') {
    return <InstagramPreview post={post} scheduledDate={scheduledDate} className={className} />
  }

  if (post.platform === 'facebook') {
    return <FacebookPreview post={post} scheduledDate={scheduledDate} className={className} />
  }

  return null
}

function InstagramPreview({ post, scheduledDate, className }: { post: Post; scheduledDate: string | null; className?: string }) {
  const firstMedia = post.medias?.[0]
  const isVideo = firstMedia?.type === 'video'
  const isCarousel = post.post_type === 'carrousel' && post.medias && post.medias.length > 1

  return (
    <div className={cn("bg-white border border-gray-300 rounded-lg overflow-hidden max-w-sm mx-auto", className)}>
      {/* Header Instagram */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white"></div>
          </div>
          <div>
            <p className="text-sm font-semibold">carmen_immobilier</p>
            {scheduledDate && (
              <p className="text-xs text-gray-500">Programmé pour {scheduledDate}</p>
            )}
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </div>

      {/* Media */}
      <div className="relative bg-black">
        {isCarousel ? (
          <div className="relative">
            <img
              src={firstMedia?.url}
              alt="Post"
              className="w-full aspect-square object-cover"
            />
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              1/{post.medias?.length}
            </div>
          </div>
        ) : firstMedia ? (
          isVideo ? (
            <div className="relative">
              <video
                src={firstMedia.url}
                className="w-full aspect-square object-cover"
                controls
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="w-16 h-16 text-white/80" />
              </div>
            </div>
          ) : (
            <img
              src={firstMedia.url}
              alt="Post"
              className="w-full aspect-square object-cover"
            />
          )
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
          <div className="text-sm">
            <span className="font-semibold">carmen_immobilier</span>{' '}
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

function FacebookPreview({ post, scheduledDate, className }: { post: Post; scheduledDate: string | null; className?: string }) {
  const firstMedia = post.medias?.[0]
  const isVideo = firstMedia?.type === 'video'

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden max-w-lg mx-auto shadow-sm", className)}>
      {/* Header Facebook */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            CI
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Carmen Immobilier</p>
            {scheduledDate && (
              <p className="text-xs text-gray-500">Programmé pour {scheduledDate}</p>
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
      {firstMedia && (
        <div className="relative bg-black">
          {isVideo ? (
            <video
              src={firstMedia.url}
              className="w-full max-h-96 object-cover"
              controls
            />
          ) : (
            <img
              src={firstMedia.url}
              alt="Post"
              className="w-full max-h-96 object-cover"
            />
          )}
        </div>
      )}

      {/* Carousel */}
      {post.post_type === 'carrousel' && post.medias && post.medias.length > 1 && (
        <div className="grid grid-cols-2 gap-1 p-1">
          {post.medias.slice(0, 4).map((media, index) => (
            <div key={index} className="relative aspect-square">
              {media.type === 'video' ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={media.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

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

