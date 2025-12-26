'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PublishButtonProps {
  postId: string
}

export function PublishButton({ postId }: PublishButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handlePublish() {
    if (!confirm('Êtes-vous sûr de vouloir publier ce post maintenant ?')) {
      return
    }

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
        onClick={handlePublish}
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
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
