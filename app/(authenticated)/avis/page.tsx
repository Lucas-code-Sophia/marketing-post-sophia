'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Star, 
  MessageSquare, 
  Loader2, 
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Review {
  id: string
  review_id: string
  reviewer_name: string
  reviewer_photo_url: string | null
  star_rating: number
  comment: string | null
  review_reply: string | null
  review_reply_at: string | null
  created_at: string
}

interface ReviewsSummary {
  total_reviews: number
  average_rating: number
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
  replied_count: number
  pending_reply: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

function RatingBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-muted-foreground">{count}</span>
    </div>
  )
}

export default function AvisPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewsSummary | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  
  // Reply modal
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // Fetch summary
    const { data: summaryData } = await supabase
      .from('gmb_reviews_summary')
      .select('*')
      .single()
    
    if (summaryData) setSummary(summaryData)
    
    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('gmb_reviews')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (reviewsData) setReviews(reviewsData)
    
    setLoading(false)
  }

  function openReplyModal(review: Review) {
    setSelectedReview(review)
    setReplyText(review.review_reply || '')
    setReplyModalOpen(true)
  }

  async function handleReply() {
    if (!selectedReview || !replyText.trim()) return
    
    setReplying(true)
    
    // Pour l'instant, on sauvegarde juste en local
    // Plus tard, on intégrera l'API GMB pour poster la réponse
    const { error } = await supabase
      .from('gmb_reviews')
      .update({ 
        review_reply: replyText,
        review_reply_at: new Date().toISOString()
      })
      .eq('id', selectedReview.id)
    
    if (!error) {
      setReplyModalOpen(false)
      fetchData()
    }
    
    setReplying(false)
  }

  const filteredReviews = filter === 'pending' 
    ? reviews.filter(r => !r.review_reply)
    : reviews

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Avis Google
        </h1>
        <p className="text-muted-foreground">
          Suivez et répondez aux avis de votre établissement
        </p>
      </div>

      {/* Stats Summary */}
      {summary && summary.total_reviews > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Note moyenne */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{summary.average_rating}</div>
                <div>
                  <StarRating rating={Math.round(summary.average_rating)} />
                  <p className="text-sm text-muted-foreground mt-1">
                    {summary.total_reviews} avis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <RatingBar label="5★" count={summary.five_star} total={summary.total_reviews} color="bg-green-500" />
              <RatingBar label="4★" count={summary.four_star} total={summary.total_reviews} color="bg-green-400" />
              <RatingBar label="3★" count={summary.three_star} total={summary.total_reviews} color="bg-yellow-400" />
              <RatingBar label="2★" count={summary.two_star} total={summary.total_reviews} color="bg-orange-400" />
              <RatingBar label="1★" count={summary.one_star} total={summary.total_reviews} color="bg-red-500" />
            </CardContent>
          </Card>

          {/* Réponses */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{summary.replied_count}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Répondus</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-500">
                    <Clock className="h-5 w-5" />
                    <span className="text-2xl font-bold">{summary.pending_reply}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium">Aucun avis synchronisé</p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Configurez l'intégration Google My Business dans les réglages<br />
              pour synchroniser automatiquement vos avis
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      {reviews.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tous ({reviews.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            <Clock className="h-4 w-4 mr-1" />
            En attente ({reviews.filter(r => !r.review_reply).length})
          </Button>
        </div>
      )}

      {/* Liste des avis */}
      {filteredReviews.length > 0 && (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {review.reviewer_photo_url ? (
                      <img 
                        src={review.reviewer_photo_url} 
                        alt={review.reviewer_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {review.reviewer_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{review.reviewer_name || 'Anonyme'}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.star_rating} />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status badge */}
                      {review.review_reply ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Répondu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          En attente
                        </span>
                      )}
                    </div>
                    
                    {/* Comment */}
                    {review.comment && (
                      <p className="mt-3 text-gray-700">{review.comment}</p>
                    )}
                    
                    {/* Reply */}
                    {review.review_reply && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Votre réponse :
                        </p>
                        <p className="text-sm text-blue-800">{review.review_reply}</p>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReplyModal(review)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {review.review_reply ? 'Modifier la réponse' : 'Répondre'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Reply */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à l'avis</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              {/* Review recap */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{selectedReview.reviewer_name}</span>
                  <StarRating rating={selectedReview.star_rating} />
                </div>
                {selectedReview.comment && (
                  <p className="text-sm text-gray-700">{selectedReview.comment}</p>
                )}
              </div>
              
              {/* Reply textarea */}
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Écrivez votre réponse..."
                rows={4}
              />
              
              <p className="text-xs text-muted-foreground">
                Note : Pour l'instant, la réponse est enregistrée localement. 
                L'intégration avec l'API Google My Business permettra de publier 
                directement les réponses.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleReply} disabled={!replyText.trim() || replying}>
              {replying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer la réponse'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
