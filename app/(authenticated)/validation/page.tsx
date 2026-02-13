'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, X, Loader2 } from 'lucide-react'
import { formatDate, getPlatformIcon } from '@/lib/utils'
import { SchedulePicker } from '@/components/posts/SchedulePicker'
import type { Post } from '@/types'

export default function ValidationPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingPost, setRejectingPost] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [schedulingPost, setSchedulingPost] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'pending_validation')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
    
    if (error) {
      setError(error.message)
      setPosts([])
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  async function handleApprove(postId: string) {
    if (!scheduledAt) return

    setActionLoading(postId)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_at: new Date(scheduledAt).toISOString(),
        validated_by: user?.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    setSchedulingPost(null)
    setScheduledAt('')
    await fetchPosts()
    setActionLoading(null)
  }

  async function handleReject(postId: string) {
    if (!rejectionReason.trim()) return

    setActionLoading(postId)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('posts')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        validated_by: user?.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    setRejectingPost(null)
    setRejectionReason('')
    await fetchPosts()
    setActionLoading(null)
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
      <div>
        <h1 className="text-2xl font-bold">Validation</h1>
        <p className="text-muted-foreground">
          Validez ou rejetez les posts en attente
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">
            Erreur de chargement: {error}
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun post en attente de validation 🎉
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div>
                      <CardTitle className="text-lg">{post.post_type}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const referenceDate =
                            post.scheduled_at || post.validated_at || post.published_at
                          return referenceDate
                            ? `Référence: ${formatDate(referenceDate)}`
                            : 'Date non disponible'
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Caption */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{post.caption || 'Pas de description'}</p>
                </div>

                {/* Medias */}
                {post.medias && post.medias.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.medias.map((media, index) => (
                      <div key={index}>
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={`Media ${index + 1}`}
                            className="h-24 w-24 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="h-24 w-24 object-cover rounded"
                            controls
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Scheduling modal */}
                {schedulingPost === post.id && (
                  <div className="p-4 border rounded-lg bg-blue-50 space-y-3">
                    <SchedulePicker
                      label="Date et heure de publication"
                      value={scheduledAt}
                      onChange={setScheduledAt}
                      hint="Créneaux : 10h, 12h, 14h, 16h, 18h, 20h, 22h."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(post.id)}
                        disabled={!scheduledAt || actionLoading === post.id}
                      >
                        {actionLoading === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirmer'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSchedulingPost(null)
                          setScheduledAt('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rejection modal */}
                {rejectingPost === post.id && (
                  <div className="p-4 border rounded-lg bg-red-50 space-y-3">
                    <Label>Raison du rejet</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Expliquez pourquoi ce post est rejeté..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(post.id)}
                        disabled={!rejectionReason.trim() || actionLoading === post.id}
                      >
                        {actionLoading === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirmer le rejet'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingPost(null)
                          setRejectionReason('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!schedulingPost && !rejectingPost && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSchedulingPost(post.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Valider
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setRejectingPost(post.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
