import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate, getStatusColor, getStatusLabel, getPlatformIcon } from '@/lib/utils'
import { PublishButton } from '@/components/posts/PublishButton'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) {
    notFound()
  }

  // Récupérer le rôle de l'utilisateur
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single()

  const canPublish = userData?.role === 'manager' || userData?.role === 'admin'
  const canPublishNow = canPublish && post.status !== 'publishing'
  
  // Permissions pour modifier
  const isOwner = post.created_by === user?.id
  const isManagerOrAdmin = userData?.role === 'manager' || userData?.role === 'admin'
  const canEdit = post.status === 'published'
    ? false
    : (isOwner && (post.status === 'draft' || post.status === 'rejected')) || 
      (isManagerOrAdmin && post.status !== 'published')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Détail du post</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
          {getStatusLabel(post.status)}
        </span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getPlatformIcon(post.platform)}</span>
            <div>
              <CardTitle>{post.platform} - {post.post_type}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {post.scheduled_at
                  ? `Programmé le ${formatDate(post.scheduled_at)}`
                  : post.published_at
                    ? `Publié le ${formatDate(post.published_at)}`
                    : 'Date non disponible'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status info */}
          {post.status === 'rejected' && post.rejection_reason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800">Raison du rejet :</p>
              <p className="text-red-700">{post.rejection_reason}</p>
            </div>
          )}

          {post.status === 'scheduled' && post.scheduled_at && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800">Programmé pour :</p>
              <p className="text-blue-700">{formatDate(post.scheduled_at)}</p>
            </div>
          )}

          {post.status === 'published' && post.published_at && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">Publié le :</p>
              <p className="text-green-700">{formatDate(post.published_at)}</p>
              {post.external_post_id && (
                <p className="text-sm text-green-600 mt-1">
                  ID externe : {post.external_post_id}
                </p>
              )}
            </div>
          )}

          {post.status === 'failed' && post.error_message && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800">Erreur :</p>
              <p className="text-red-700">{post.error_message}</p>
            </div>
          )}

          {/* Caption */}
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap">{post.caption || 'Pas de description'}</p>
            </div>
          </div>

          {/* Link */}
          {post.link && (
            <div>
              <h3 className="font-medium mb-2">Lien</h3>
              <a 
                href={post.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {post.link}
              </a>
            </div>
          )}

          {/* Medias */}
          {post.medias && post.medias.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Médias ({post.medias.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {post.medias.map((media: any, index: number) => (
                  <div key={index} className="relative">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            {canPublishNow && (
              <PublishButton postId={post.id} />
            )}
            {canEdit && (
              <Link href={`/posts/${post.id}/edit`}>
                <Button>Modifier</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
