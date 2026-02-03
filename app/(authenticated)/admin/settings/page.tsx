'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Instagram, Lock } from 'lucide-react'

const SETTINGS_KEY_IG_USER_TOKEN = 'ig_user_token'

export default function SettingsPage() {
  const supabase = createClient()
  const [igToken, setIgToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    setMessage(null)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', SETTINGS_KEY_IG_USER_TOKEN)
        .maybeSingle()

      if (error) throw error
      setIgToken(data?.value ?? '')
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key: SETTINGS_KEY_IG_USER_TOKEN, value: igToken.trim() || null },
          { onConflict: 'key' }
        )

      if (error) throw error
      setMessage({ type: 'success', text: 'Token enregistré.' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="text-muted-foreground">
          Tokens et paramètres pour les appels API (Instagram, etc.)
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Token Page Access
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Token Page Access (long-lived) pour les appels à l’API Instagram Graph. Il est stocké en base et utilisé côté serveur pour les statistiques.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ig_token">Token</Label>
              <Input
                id="ig_token"
                type="password"
                placeholder="EAAxxxx…"
                value={igToken}
                onChange={(e) => setIgToken(e.target.value)}
                autoComplete="off"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Visible et modifiable uniquement par les admins.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
