'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PublishButtonProps {
  postId: string
}

export function PublishButton({ postId }: PublishButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  async function handlePublishConfirm() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la publication')
      }

      // Rafraîchir la page pour voir le nouveau statut
      setConfirmOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publication...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Publier maintenant
          </>
        )}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={(open) => !loading && setConfirmOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmer la publication
            </DialogTitle>
            <DialogDescription>
              Ce post va être envoyé immédiatement vers la plateforme sélectionnée.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-amber-50/70 p-3 text-sm text-amber-900">
            Vérifie le contenu avant confirmation. Cette action peut être irréversible selon la plateforme.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handlePublishConfirm}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Oui, publier
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
