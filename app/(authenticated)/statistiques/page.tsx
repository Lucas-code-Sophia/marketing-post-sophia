'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  Instagram,
  Facebook,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Eye,
  Users,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface InstagramAccountInfo {
  id: string
  account_name: string
  account_id: string
}

interface AccountStatsRow {
  social_account_id: string
  date: string
  followers_count: number
  follows_count: number
  media_count: number
}

interface PostStats {
  id: string
  media_id: string
  media_type: string
  permalink: string
  media_url?: string | null
  thumbnail_url?: string | null
  caption: string | null
  timestamp: string
  likes: number | null
  comments: number | null
  views: number | null
  impressions: number | null
  reach: number | null
  saved: number | null
  shares: number | null
  engagement: number | null
}

interface PostStatsHistory {
  media_id: string
  fetched_at: string
  likes: number | null
  comments: number | null
  views: number | null
  reach: number | null
  saved: number | null
  shares: number | null
  engagement: number | null
}

type EngagementSort = 'recent' | 'engagement_desc' | 'engagement_asc'
type EngagementFilter = 'all' | 'high' | 'medium' | 'low'
type HistoryRange = '7d' | '30d' | '90d' | 'all'
type AccountRange = '7d' | '30d' | '90d' | 'all'

const DAY_MS = 24 * 60 * 60 * 1000
const ACCOUNT_RANGE_DAYS: Record<Exclude<AccountRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function findRowOnOrBefore(rows: AccountStatsRow[], targetMs: number): AccountStatsRow | null {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const rowMs = parseDateOnly(rows[i].date).getTime()
    if (rowMs <= targetMs) return rows[i]
  }
  return null
}

function toSignedText(value: number | null, digits = 0): string {
  if (value === null) return '—'
  const rounded = Number(value.toFixed(digits))
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function getViewsValue(post: PostStats): number | null {
  if (post.views !== null && post.views !== undefined) return toNumber(post.views)
  if (post.impressions !== null && post.impressions !== undefined) return toNumber(post.impressions)
  return null
}

function getHistoryViewsValue(snapshot: PostStatsHistory | null): number | null {
  if (!snapshot) return null
  if (snapshot.views !== null && snapshot.views !== undefined) return toNumber(snapshot.views)
  return null
}

function getInstagramPreviewUrl(permalink: string | null): string | null {
  if (!permalink) return null

  try {
    const url = new URL(permalink)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const [kind, shortcode] = parts
    if (!['p', 'reel', 'tv'].includes(kind)) return null

    return `https://www.instagram.com/${kind}/${shortcode}/media/?size=l`
  } catch {
    return null
  }
}

function getPostPreviewUrl(post: PostStats): string | null {
  const thumbnail = post.thumbnail_url?.trim()
  const media = post.media_url?.trim()

  if (thumbnail) return thumbnail
  if (media) return media

  return getInstagramPreviewUrl(post.permalink)
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
  const [imageError, setImageError] = useState(false)
  const previewUrl = getPostPreviewUrl(post)
  const canShowImage = Boolean(previewUrl) && !imageError
  
  return (
    <div 
      className="relative aspect-square cursor-pointer group overflow-hidden rounded-md bg-gray-100"
      onClick={onClick}
    >
      {canShowImage ? (
        <img
          src={previewUrl!}
          alt="Aperçu du post Instagram"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
          <Instagram className="h-8 w-8 text-pink-300" />
        </div>
      )}
      
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

function MetricDelta({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="rounded-md border bg-gray-50 px-3 py-2 text-xs text-gray-500">
        {label}: —
      </div>
    )
  }

  if (value > 0) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
        {label}: +{value.toLocaleString()}
      </div>
    )
  }

  if (value < 0) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {label}: {value.toLocaleString()}
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-gray-50 px-3 py-2 text-xs text-gray-500">
      {label}: 0
    </div>
  )
}

function EngagementSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        Pas assez d'historique pour afficher l'évolution.
      </div>
    )
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = max === min ? 50 : 100 - ((value - min) / (max - min)) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="rounded-md border bg-white p-3">
      <svg viewBox="0 0 100 100" className="h-28 w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          points={points}
          className="text-pink-500"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Plus ancien</span>
        <span>Plus récent</span>
      </div>
    </div>
  )
}

function FollowersSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        Pas assez d&apos;historique pour afficher la tendance abonnés.
      </div>
    )
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = max === min ? 50 : 100 - ((value - min) / (max - min)) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="rounded-md border bg-white p-3">
      <svg viewBox="0 0 100 100" className="h-28 w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          points={points}
          className="text-emerald-500"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Début période</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  )
}

function PostStatsModal({
  post,
  posts,
  history,
  historyLoading,
  open,
  onClose,
}: {
  post: PostStats | null
  posts: PostStats[]
  history: PostStatsHistory[]
  historyLoading: boolean
  open: boolean
  onClose: () => void
}) {
  const [historyRange, setHistoryRange] = useState<HistoryRange>('30d')
  if (!post) return null
  
  const publishedDate = new Date(post.timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const previewUrl = getPostPreviewUrl(post)
  const views = getViewsValue(post)

  const orderedPosts = [...posts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const postIndex = orderedPosts.findIndex((item) => item.media_id === post.media_id)
  const previousPost = postIndex > 0 ? orderedPosts[postIndex - 1] : null
  const fallbackEvolutionSample =
    postIndex >= 0 ? orderedPosts.slice(Math.max(0, postIndex - 7), postIndex + 1) : []
  const fallbackEngagementSeries = fallbackEvolutionSample.map((item) => toNumber(item.engagement))

  const orderedHistory = [...history].sort(
    (a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
  )
  const now = Date.now()
  const rangeMsByType: Record<Exclude<HistoryRange, 'all'>, number> = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  const historyInRange =
    historyRange === 'all'
      ? orderedHistory
      : orderedHistory.filter(
          (item) => now - new Date(item.fetched_at).getTime() <= rangeMsByType[historyRange]
        )

  const hasHistory = historyInRange.length > 0
  const latestHistory = hasHistory ? historyInRange[historyInRange.length - 1] : null
  const previousHistory = historyInRange.length > 1 ? historyInRange[historyInRange.length - 2] : null

  const fallbackEngagementDelta = previousPost
    ? toNumber(post.engagement) - toNumber(previousPost.engagement)
    : null
  const fallbackReachDelta = previousPost ? toNumber(post.reach) - toNumber(previousPost.reach) : null
  const fallbackViewsDelta = previousPost
    ? toNumber(getViewsValue(post)) - toNumber(getViewsValue(previousPost))
    : null

  const engagementDelta = previousHistory
    ? toNumber(latestHistory?.engagement) - toNumber(previousHistory.engagement)
    : fallbackEngagementDelta
  const reachDelta = previousHistory
    ? toNumber(latestHistory?.reach) - toNumber(previousHistory.reach)
    : fallbackReachDelta
  const viewsDelta = previousHistory
    ? toNumber(getHistoryViewsValue(latestHistory)) - toNumber(getHistoryViewsValue(previousHistory))
    : fallbackViewsDelta

  const engagementSeries = hasHistory
    ? historyInRange.map((item) => toNumber(item.engagement))
    : fallbackEngagementSeries

  const displayLikes = latestHistory?.likes ?? post.likes
  const displayComments = latestHistory?.comments ?? post.comments
  const displaySaved = latestHistory?.saved ?? post.saved
  const displayShares = latestHistory?.shares ?? post.shares
  const displayReach = latestHistory?.reach ?? post.reach
  const displayEngagement = latestHistory?.engagement ?? post.engagement
  const displayViews = hasHistory ? getHistoryViewsValue(latestHistory) : views
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Stats du post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Aperçu visuel */}
          <div className="overflow-hidden rounded-lg border bg-gray-50">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Aperçu du post"
                className="max-h-[420px] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
                <ImageIcon className="h-10 w-10 text-pink-300" />
              </div>
            )}
          </div>

          {/* Date et type */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Publié le {publishedDate}</span>
            <span className="capitalize">{post.media_type?.toLowerCase().replace('_', ' ')}</span>
          </div>
          
          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
              {post.caption}
            </p>
          )}
          
          {/* Stats principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-lg font-bold">{displayLikes?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{displayComments?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Commentaires</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
              <Bookmark className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-lg font-bold">{displaySaved?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Enregistrements</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <Share2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-lg font-bold">{displayShares?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Partages</p>
              </div>
            </div>
          </div>
          
          {/* Stats de portée */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
              <Eye className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">{displayViews?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Vues</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-lg font-bold">{displayReach?.toLocaleString() || '—'}</p>
                <p className="text-xs text-muted-foreground">Portée</p>
              </div>
            </div>
          </div>
          
          {/* Engagement total */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center">
            <p className="text-2xl font-bold">{displayEngagement?.toLocaleString() || '—'}</p>
            <p className="text-sm opacity-90">Engagement total</p>
          </div>

          {/* Evolution */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-pink-500" />
              <p className="text-sm font-semibold">
                {hasHistory ? 'Évolution (vs snapshot précédent)' : 'Évolution (vs post précédent)'}
              </p>
              </div>
              <select
                value={historyRange}
                onChange={(e) => setHistoryRange(e.target.value as HistoryRange)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="7d">7 jours</option>
                <option value="30d">30 jours</option>
                <option value="90d">90 jours</option>
                <option value="all">Tout</option>
              </select>
            </div>
            {historyLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement de l'historique...
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <MetricDelta label="Engagement" value={engagementDelta} />
              <MetricDelta label="Portée" value={reachDelta} />
              <MetricDelta label="Vues" value={viewsDelta} />
            </div>
            <EngagementSparkline values={engagementSeries} />
            {hasHistory && (
              <p className="text-xs text-muted-foreground">
                {historyInRange.length} snapshots sur la période ({historyRange === 'all' ? 'tout' : historyRange}).
              </p>
            )}
          </div>
          
          {/* Lien vers Instagram */}
          {post.permalink && (
            <a 
              href={post.permalink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-sm text-pink-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
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
  const [instagramAccount, setInstagramAccount] = useState<InstagramAccountInfo | null>(null)
  const [accountHistory, setAccountHistory] = useState<AccountStatsRow[]>([])
  const [accountRange, setAccountRange] = useState<AccountRange>('30d')
  const [posts, setPosts] = useState<PostStats[]>([])
  const [selectedPost, setSelectedPost] = useState<PostStats | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyByMediaId, setHistoryByMediaId] = useState<Record<string, PostStatsHistory[]>>({})
  const [engagementSort, setEngagementSort] = useState<EngagementSort>('recent')
  const [engagementFilter, setEngagementFilter] = useState<EngagementFilter>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    // Compte Instagram principal
    const { data: accountData, error: accountError } = await supabase
      .from('social_accounts')
      .select('id,account_name,account_id')
      .eq('platform', 'instagram')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (accountError) {
      console.error('Erreur chargement compte Instagram:', accountError)
    }
    setInstagramAccount((accountData as InstagramAccountInfo | null) || null)

    // Historique journalier du compte (followers/follows/media_count)
    let accountStatsQuery = supabase
      .from('instagram_account_stats')
      .select('social_account_id,date,followers_count,follows_count,media_count')
      .order('date', { ascending: true })

    if (accountData?.id) {
      accountStatsQuery = accountStatsQuery.eq('social_account_id', accountData.id)
    }

    const { data: accountStatsData, error: accountStatsError } = await accountStatsQuery

    if (accountStatsError) {
      console.error('Erreur chargement historique compte Instagram:', accountStatsError)
      setAccountHistory([])
    } else {
      setAccountHistory((accountStatsData as AccountStatsRow[] | null) || [])
    }
    
    // Fetch post stats
    const { data: postsData, error: postsError } = await supabase
      .from('instagram_post_stats')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (postsError) {
      console.error('Erreur chargement stats posts Instagram:', postsError)
    }

    if (postsData) {
      setPosts(postsData)
    } else {
      setPosts([])
    }
    
    setLoading(false)
  }

  function openPostModal(post: PostStats) {
    setSelectedPost(post)
    setModalOpen(true)
  }

  useEffect(() => {
    if (!modalOpen || !selectedPost?.media_id) return

    const mediaId = selectedPost.media_id
    if (historyByMediaId[mediaId]) return

    let cancelled = false
    const fetchHistory = async () => {
      setHistoryLoading(true)
      try {
        const { data } = await supabase
          .from('instagram_post_stats_history')
          .select('media_id,fetched_at,likes,comments,views,reach,saved,shares,engagement')
          .eq('media_id', mediaId)
          .order('fetched_at', { ascending: true })

        if (cancelled) return
        setHistoryByMediaId((prev) => ({
          ...prev,
          [mediaId]: (data as PostStatsHistory[] | null) || [],
        }))
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    fetchHistory()

    return () => {
      cancelled = true
    }
  }, [modalOpen, selectedPost?.media_id, historyByMediaId])

  const accountInsights = useMemo(() => {
    if (accountHistory.length === 0) return null

    const rows = [...accountHistory]
      .map((row) => ({
        ...row,
        followers_count: toNumber(row.followers_count),
        follows_count: toNumber(row.follows_count),
        media_count: toNumber(row.media_count),
      }))
      .sort((a, b) => parseDateOnly(a.date).getTime() - parseDateOnly(b.date).getTime())

    const latest = rows[rows.length - 1]
    const latestMs = parseDateOnly(latest.date).getTime()

    const rowsInRange =
      accountRange === 'all'
        ? rows
        : rows.filter(
            (row) =>
              latestMs - parseDateOnly(row.date).getTime() <= ACCOUNT_RANGE_DAYS[accountRange] * DAY_MS
          )
    const periodRows = rowsInRange.length > 0 ? rowsInRange : [latest]
    const periodStart = periodRows[0]
    const periodStartMs = parseDateOnly(periodStart.date).getTime()
    const daysTracked = Math.max(1, Math.round((latestMs - periodStartMs) / DAY_MS))

    const followersDeltaPeriod = latest.followers_count - periodStart.followers_count
    const followsDeltaPeriod = latest.follows_count - periodStart.follows_count
    const mediaDeltaPeriod = latest.media_count - periodStart.media_count
    const avgFollowersPerDay = followersDeltaPeriod / daysTracked

    const monthAgoRow = findRowOnOrBefore(rows, latestMs - 30 * DAY_MS)
    const followersVsLastMonth = monthAgoRow
      ? latest.followers_count - monthAgoRow.followers_count
      : null

    const getDeltaForDays = (days: number): number | null => {
      const reference = findRowOnOrBefore(rows, latestMs - days * DAY_MS)
      if (!reference) return null
      return latest.followers_count - reference.followers_count
    }

    const delta7 = getDeltaForDays(7)
    const delta30 = getDeltaForDays(30)
    const delta90 = getDeltaForDays(90)

    const latestPost = posts.length > 0 ? posts[0] : null
    let followersSinceLastPost: number | null = null
    let daysSinceLastPost: number | null = null

    if (latestPost) {
      const latestPostMs = new Date(latestPost.timestamp).getTime()
      const baselineRow = findRowOnOrBefore(rows, latestPostMs)
      if (baselineRow) {
        const baselineMs = parseDateOnly(baselineRow.date).getTime()
        followersSinceLastPost = latest.followers_count - baselineRow.followers_count
        daysSinceLastPost = Math.max(0, Math.round((latestMs - baselineMs) / DAY_MS))
      }
    }

    const postsInRange = posts.filter(
      (post) => new Date(post.timestamp).getTime() >= periodStartMs
    ).length
    const followersPerPost = postsInRange > 0 ? followersDeltaPeriod / postsInRange : null

    const periodLabel =
      accountRange === 'all'
        ? 'tout l’historique'
        : accountRange === '7d'
          ? '7 jours'
          : accountRange === '30d'
            ? '30 jours'
            : '90 jours'

    return {
      currentFollowers: latest.followers_count,
      currentFollows: latest.follows_count,
      currentMedia: latest.media_count,
      latestDate: latest.date,
      periodLabel,
      periodStartDate: periodStart.date,
      followersDeltaPeriod,
      followsDeltaPeriod,
      mediaDeltaPeriod,
      daysTracked,
      avgFollowersPerDay,
      followersVsLastMonth,
      followersSinceLastPost,
      daysSinceLastPost,
      postsInRange,
      followersPerPost,
      delta7,
      delta30,
      delta90,
      followersSeries: periodRows.map((row) => row.followers_count),
    }
  }, [accountHistory, accountRange, posts])

  const displayedPosts = useMemo(() => {
    const list = [...posts]

    const filtered = list.filter((post) => {
      const score = toNumber(post.engagement)

      if (engagementFilter === 'high') return score >= 100
      if (engagementFilter === 'medium') return score >= 30 && score < 100
      if (engagementFilter === 'low') return score < 30
      return true
    })

    if (engagementSort === 'engagement_desc') {
      filtered.sort((a, b) => toNumber(b.engagement) - toNumber(a.engagement))
    } else if (engagementSort === 'engagement_asc') {
      filtered.sort((a, b) => toNumber(a.engagement) - toNumber(b.engagement))
    } else {
      filtered.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    }

    return filtered
  }, [posts, engagementFilter, engagementSort])

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
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Instagram {instagramAccount?.account_name && `— @${instagramAccount.account_name}`}
            </CardTitle>
            {accountInsights && (
              <span className="text-xs text-muted-foreground">
                Dernier snapshot: {parseDateOnly(accountInsights.latestDate).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={accountRange === '7d' ? 'default' : 'outline'}
              onClick={() => setAccountRange('7d')}
            >
              7 jours
            </Button>
            <Button
              size="sm"
              variant={accountRange === '30d' ? 'default' : 'outline'}
              onClick={() => setAccountRange('30d')}
            >
              30 jours
            </Button>
            <Button
              size="sm"
              variant={accountRange === '90d' ? 'default' : 'outline'}
              onClick={() => setAccountRange('90d')}
            >
              90 jours
            </Button>
            <Button
              size="sm"
              variant={accountRange === 'all' ? 'default' : 'outline'}
              onClick={() => setAccountRange('all')}
            >
              Tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accountInsights ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-3xl font-bold">
                    {accountInsights.currentFollowers.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-muted-foreground">Abonnés</p>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      accountInsights.followersDeltaPeriod >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {toSignedText(accountInsights.followersDeltaPeriod)} sur {accountInsights.periodLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VariationBadge value={accountInsights.delta7} period="7j" />
                    <VariationBadge value={accountInsights.delta30} period="30j" />
                    <VariationBadge value={accountInsights.delta90} period="90j" />
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-3xl font-bold">{toSignedText(accountInsights.avgFollowersPerDay, 1)}</p>
                  <p className="text-sm text-muted-foreground">Croissance moyenne / jour</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {accountInsights.daysTracked} jours observés
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {toSignedText(accountInsights.followersPerPost, 1)} abonné/post
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-3xl font-bold">{toSignedText(accountInsights.followersVsLastMonth)}</p>
                  <p className="text-sm text-muted-foreground">Comparé au mois dernier</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Objectif: valider la traction mensuelle
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-3xl font-bold">{toSignedText(accountInsights.followersSinceLastPost)}</p>
                  <p className="text-sm text-muted-foreground">Depuis la dernière publication</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {accountInsights.daysSinceLastPost !== null
                      ? `${accountInsights.daysSinceLastPost} jour(s) de recul`
                      : 'Pas de publication détectée'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-3 rounded-lg border p-4 lg:col-span-2">
                  <p className="text-sm font-semibold">
                    Évolution abonnés ({accountInsights.periodLabel})
                  </p>
                  <FollowersSparkline values={accountInsights.followersSeries} />
                  <p className="text-xs text-muted-foreground">
                    Du {parseDateOnly(accountInsights.periodStartDate).toLocaleDateString('fr-FR')} au{' '}
                    {parseDateOnly(accountInsights.latestDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm font-semibold">Insights rapides</p>
                  <p className="text-sm text-muted-foreground">
                    {accountInsights.currentFollows.toLocaleString('fr-FR')} abonnements pour{' '}
                    {accountInsights.currentMedia.toLocaleString('fr-FR')} publications.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {toSignedText(accountInsights.followersDeltaPeriod)} abonnés gagnés sur{' '}
                    {accountInsights.periodLabel}.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {accountInsights.postsInRange} publication(s) sur la période.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {toSignedText(accountInsights.followsDeltaPeriod)} abonnements et{' '}
                    {toSignedText(accountInsights.mediaDeltaPeriod)} nouveaux contenus.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune donnée compte disponible</p>
              <p className="text-sm mt-1">
                Vérifie le workflow n8n &quot;Instagram Stats Daily&quot; et la table
                `instagram_account_stats`.
              </p>
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
          <div className="flex flex-col gap-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performances des posts
            </CardTitle>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={engagementFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setEngagementFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant={engagementFilter === 'high' ? 'default' : 'outline'}
                  onClick={() => setEngagementFilter('high')}
                >
                  Top (100+)
                </Button>
                <Button
                  size="sm"
                  variant={engagementFilter === 'medium' ? 'default' : 'outline'}
                  onClick={() => setEngagementFilter('medium')}
                >
                  Moyen (30-99)
                </Button>
                <Button
                  size="sm"
                  variant={engagementFilter === 'low' ? 'default' : 'outline'}
                  onClick={() => setEngagementFilter('low')}
                >
                  Faible (&lt;30)
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Trier:</span>
                <select
                  value={engagementSort}
                  onChange={(e) => setEngagementSort(e.target.value as EngagementSort)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="recent">Plus récents</option>
                  <option value="engagement_desc">Engagement décroissant</option>
                  <option value="engagement_asc">Engagement croissant</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {displayedPosts.map((post) => (
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
                Essaie un autre filtre d'engagement ou attends la prochaine synchronisation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal des stats du post */}
      <PostStatsModal 
        post={selectedPost} 
        posts={posts}
        history={selectedPost ? historyByMediaId[selectedPost.media_id] || [] : []}
        historyLoading={historyLoading}
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  )
}
