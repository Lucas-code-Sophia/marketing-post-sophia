'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PostPreview } from './PostPreview'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import type { Post } from '@/types'

interface PostPreviewModalProps {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit?: boolean
}

export function PostPreviewModal({ post, open, onOpenChange, canEdit = false }: PostPreviewModalProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  if (!post) return null

  const handleEdit = () => {
    router.push(`/posts/${post.id}/edit`)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setIsEditing(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aperçu du post - {post.platform}</DialogTitle>
          <DialogDescription>
            Voici à quoi ressemblera votre post sur {post.platform === 'instagram' ? 'Instagram' : 'Facebook'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Aperçu */}
          <div className="flex justify-center">
            <PostPreview post={post} />
          </div>

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Type de post</p>
              <p className="text-sm text-gray-600 capitalize">{post.post_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Statut</p>
              <p className="text-sm text-gray-600">{post.status}</p>
            </div>
            {post.scheduled_at && (
              <div>
                <p className="text-sm font-medium text-gray-700">Date programmée</p>
                <p className="text-sm text-gray-600">
                  {new Date(post.scheduled_at).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
            {post.medias && (
              <div>
                <p className="text-sm font-medium text-gray-700">Nombre de médias</p>
                <p className="text-sm text-gray-600">{post.medias.length}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {canEdit && (
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Modifier le post
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

