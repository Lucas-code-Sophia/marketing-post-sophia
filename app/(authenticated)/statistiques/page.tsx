'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Instagram, Facebook, TrendingUp, TrendingDown, Minus, Heart, MessageCircle, Bookmark, Share2, Eye, Users, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AccountStats {
  account_name: string
  current_followers: number
  current_follows: number
  current_media: number
  followers_change_7d: number | null
  followers_change_30d: number | null
  followers_change_90d: number | null
}

interface PostStats {
  id: string
  media_id: string
  media_type: string
  permalink: string
  caption: string | null
  timestamp: string
  likes: number | null
  comments: number | null
  impressions: number | null
  reach: number | null
  saved: number | null
  shares: number | null
  engagement: number | null
}

function VariationBadge({ value, period }: { value: number | null, period: string }) {
  if (value === null || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Minus className="h-3 w-3" />
        {period}
      </span>
    )
  }
  
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <TrendingUp className="h-3 w-3" />
        +{value} ({period})
      </span>
    )
  }
  
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600">
      <TrendingDown className="h-3 w-3" />
      {value} ({period})
    </span>
  )
}

function PostThumbnail({ post, onClick }: { post: PostStats, onClick: () => void }) {
  // Extraire l'image du post depuis l'URL Instagram ou utiliser un placeholder
  const thumbnailUrl = `https://instagram.com/p/${post.media_id}/media/?size=m`
  
  return (
    <div 
      className="relative aspect-square cursor-pointer group overflow-hidden rounded-md bg-gray-100"
      onClick={onClick}
    >
      {/* Placeholder avec icône */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <Instagram className="h-8 w-8 text-pink-300" />
      </div>
      
      {/* Overlay au hover avec stats */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
        <span className="flex items-center gap-1 text-sm font-medium">
          <Heart className="h-4 w-4 fill-white" />
          {post.likes || 0}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium">
          <MessageCircle className="h-4 w-4 fill-white" />
          {post.comments || 0}
        </span>
      </div>
      
      {/* Badge type de media */}
      {post.media_type === 'VIDEO' && (
        <div className="absolute top-2 right-2 bg-black/50 rounded px-1.5 py-0.5 text-xs text-white">
          Reel
        </div>
      )}
      {post.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-2 right-2 bg-black/50 rounded px-1.5 py-0.5 text-xs text-white">
          Carrousel
        </div>
      )}
    </div>
  )
}

function PostStatsModal({ post, open, onClose }: { post: PostStats | null, open: boolean, onClose: () => void }) {
  if (!post) return null
  
  const publishedDate = new Date(post.timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Stats du post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date et type */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Publié le {publishedDate}</span>
            <span className="capitalize">{post.media_type?.toLowerCase().replace('_', ' ')}</span>
          </div>
          
          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-gray-700 line-clamp-3 bg-gray-50 p-3 rounded-lg">
              {post.caption}
            </p>
          )}
          
          {/* Stats principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-lg font-bold">{post.likes?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{post.comments?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Commentaires</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
              <Bookmark className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-lg font-bold">{post.saved?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Enregistrements</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <Share2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-lg font-bold">{post.shares?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Partages</p>
              </div>
            </div>
          </div>
          
          {/* Stats de portée */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
              <Eye className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">{post.impressions?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-lg font-bold">{post.reach?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Portée</p>
              </div>
            </div>
          </div>
          
          {/* Engagement total */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center">
            <p className="text-2xl font-bold">{post.engagement?.toLocaleString() || '—'}</p>
            <p className="text-sm opacity-90">Engagement total</p>
          </div>
          
          {/* Lien vers Instagram */}
          {post.permalink && (
            <a 
              href={post.permalink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-center text-sm text-pink-600 hover:underline"
            >
              Voir sur Instagram →
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function StatistiquesPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null)
  const [posts, setPosts] = useState<PostStats[]>([])
  const [selectedPost, setSelectedPost] = useState<PostStats | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // Fetch account stats with variations
    const { data: statsData } = await supabase
      .from('instagram_stats_with_variations')
      .select('*')
      .single()
    
    if (statsData) {
      setAccountStats(statsData)
    }
    
    // Fetch post stats
    const { data: postsData } = await supabase
      .from('instagram_post_stats')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (postsData) {
      setPosts(postsData)
    }
    
    setLoading(false)
  }

  function openPostModal(post: PostStats) {
    setSelectedPost(post)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">
          Suivi des performances de vos comptes et de vos publications
        </p>
      </div>

      {/* Stats Instagram */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram {accountStats?.account_name && `— @${accountStats.account_name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Abonnés */}
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-bold">{accountStats.current_followers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mb-2">Abonnés</p>
                <div className="flex flex-wrap gap-2">
                  <VariationBadge value={accountStats.followers_change_7d} period="7j" />
                  <VariationBadge value={accountStats.followers_change_30d} period="30j" />
                  <VariationBadge value={accountStats.followers_change_90d} period="90j" />
                </div>
              </div>
              
              {/* Abonnements */}
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-bold">{accountStats.current_follows.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Abonnements</p>
              </div>
              
              {/* Publications */}
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-bold">{accountStats.current_media}</p>
                <p className="text-sm text-muted-foreground">Publications</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune donnée disponible</p>
              <p className="text-sm mt-1">Les stats seront récupérées automatiquement chaque jour</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Facebook (placeholder) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Abonnés / J'aime</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Portée</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Impressions</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des posts Instagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Performances des posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {posts.map((post) => (
                <PostThumbnail 
                  key={post.id} 
                  post={post} 
                  onClick={() => openPostModal(post)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Instagram className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Aucun post pour le moment</p>
              <p className="text-sm mt-1">
                Les stats des posts seront récupérées automatiquement chaque jour
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal des stats du post */}
      <PostStatsModal 
        post={selectedPost} 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  )
}
