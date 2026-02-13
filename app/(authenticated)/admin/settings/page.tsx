'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Instagram, Lock, MapPin } from 'lucide-react'

const SETTINGS_KEY_IG_USER_TOKEN = 'ig_user_token'
const SETTINGS_KEY_GMB_ACCOUNT_NAME = 'gmb_account_name'
const SETTINGS_KEY_GMB_ACCOUNT_ID = 'gmb_account_id'
const SETTINGS_KEY_GMB_LOCATION_ID = 'gmb_location_id'
const SETTINGS_KEY_GMB_ACCESS_TOKEN = 'gmb_access_token'

export default function SettingsPage() {
  const supabase = createClient()

  const [igToken, setIgToken] = useState('')

  const [gmbAccountName, setGmbAccountName] = useState('')
  const [gmbAccountId, setGmbAccountId] = useState('')
  const [gmbLocationId, setGmbLocationId] = useState('')
  const [gmbAccessToken, setGmbAccessToken] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingIg, setSavingIg] = useState(false)
  const [savingGmb, setSavingGmb] = useState(false)

  const [igMessage, setIgMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gmbMessage, setGmbMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    setIgMessage(null)
    setGmbMessage(null)

    try {
      const keys = [
        SETTINGS_KEY_IG_USER_TOKEN,
        SETTINGS_KEY_GMB_ACCOUNT_NAME,
        SETTINGS_KEY_GMB_ACCOUNT_ID,
        SETTINGS_KEY_GMB_LOCATION_ID,
        SETTINGS_KEY_GMB_ACCESS_TOKEN,
      ]

      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('key,value')
        .in('key', keys)

      if (settingsError) throw settingsError

      const settingsMap = new Map((settingsData ?? []).map((row) => [row.key as string, row.value as string | null]))
      setIgToken(settingsMap.get(SETTINGS_KEY_IG_USER_TOKEN) ?? '')

      setGmbAccountName(settingsMap.get(SETTINGS_KEY_GMB_ACCOUNT_NAME) ?? '')
      setGmbAccountId(settingsMap.get(SETTINGS_KEY_GMB_ACCOUNT_ID) ?? '')
      setGmbLocationId(settingsMap.get(SETTINGS_KEY_GMB_LOCATION_ID) ?? '')
      setGmbAccessToken(settingsMap.get(SETTINGS_KEY_GMB_ACCESS_TOKEN) ?? '')

      // Fallback depuis social_accounts si les settings sont vides
      const { data: gmbAccounts, error: gmbError } = await supabase
        .from('social_accounts')
        .select('account_name,account_id,access_token')
        .eq('platform', 'gmb')
        .order('created_at', { ascending: false })
        .limit(1)

      if (gmbError) throw gmbError

      const gmb = gmbAccounts?.[0]
      if (gmb) {
        setGmbAccountName((prev) => prev || gmb.account_name || '')
        // Dans social_accounts.account_id on stocke le location_id GMB utilisé pour les posts.
        setGmbLocationId((prev) => prev || gmb.account_id || '')
        setGmbAccessToken((prev) => prev || gmb.access_token || '')
      }
    } catch (err: unknown) {
      const text = (err as Error).message
      setIgMessage({ type: 'error', text })
      setGmbMessage({ type: 'error', text })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveInstagram(e: React.FormEvent) {
    e.preventDefault()
    setSavingIg(true)
    setIgMessage(null)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key: SETTINGS_KEY_IG_USER_TOKEN, value: igToken.trim() || null },
          { onConflict: 'key' }
        )

      if (error) throw error
      setIgMessage({ type: 'success', text: 'Token Instagram enregistré.' })
    } catch (err: unknown) {
      setIgMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setSavingIg(false)
    }
  }

  async function handleSaveGmb(e: React.FormEvent) {
    e.preventDefault()
    setSavingGmb(true)
    setGmbMessage(null)

    try {
      const locationId = gmbLocationId.trim()
      const accessToken = gmbAccessToken.trim()
      const accountName = gmbAccountName.trim() || 'Google Business Profile'

      if (!locationId) {
        throw new Error('Le Location ID GMB est requis.')
      }
      if (!accessToken) {
        throw new Error('Le token d’accès GMB est requis.')
      }

      const nowIso = new Date().toISOString()

      const settingsRows = [
        { key: SETTINGS_KEY_GMB_ACCOUNT_NAME, value: accountName },
        { key: SETTINGS_KEY_GMB_ACCOUNT_ID, value: gmbAccountId.trim() || null },
        { key: SETTINGS_KEY_GMB_LOCATION_ID, value: locationId },
        { key: SETTINGS_KEY_GMB_ACCESS_TOKEN, value: accessToken },
      ]

      const { error: settingsError } = await supabase
        .from('settings')
        .upsert(settingsRows, { onConflict: 'key' })

      if (settingsError) throw settingsError

      const { data: existingAccounts, error: existingError } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', 'gmb')
        .order('created_at', { ascending: true })
        .limit(1)

      if (existingError) throw existingError

      if (existingAccounts && existingAccounts.length > 0) {
        const { error: updateError } = await supabase
          .from('social_accounts')
          .update({
            account_name: accountName,
            account_id: locationId,
            access_token: accessToken,
            token_expires_at: null,
            updated_at: nowIso,
          })
          .eq('id', existingAccounts[0].id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('social_accounts')
          .insert({
            platform: 'gmb',
            account_name: accountName,
            account_id: locationId,
            access_token: accessToken,
            token_expires_at: null,
          })

        if (insertError) throw insertError
      }

      setGmbMessage({
        type: 'success',
        text: 'Connexion GMB enregistrée. Le compte est prêt dans "Comptes sociaux".',
      })
    } catch (err: unknown) {
      setGmbMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setSavingGmb(false)
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="text-muted-foreground">
          Tokens et paramètres API pour Instagram et Google Business Profile.
        </p>
      </div>

      <form onSubmit={handleSaveInstagram}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Token Page Access Instagram
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Token Page Access (long-lived) utilisé pour les appels Instagram Graph (stats).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {igMessage && (
              <div
                className={`rounded-lg border p-4 ${
                  igMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {igMessage.text}
              </div>
            )}
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
            <Button type="submit" disabled={savingIg}>
              {savingIg ? (
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

      <form onSubmit={handleSaveGmb}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Connexion Google Business Profile (GMB)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enregistre le token + l’identifiant de location, puis crée/met à jour automatiquement un compte `gmb` dans
              `social_accounts`.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {gmbMessage && (
              <div
                className={`rounded-lg border p-4 ${
                  gmbMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {gmbMessage.text}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="gmb_account_name">Nom du compte</Label>
                <Input
                  id="gmb_account_name"
                  placeholder="Ex: Sophia Cap Ferret"
                  value={gmbAccountName}
                  onChange={(e) => setGmbAccountName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gmb_account_id">Google Account ID (optionnel)</Label>
                <Input
                  id="gmb_account_id"
                  placeholder="Ex: 12345678901234567890"
                  value={gmbAccountId}
                  onChange={(e) => setGmbAccountId(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gmb_location_id">Google Location ID (obligatoire)</Label>
                <Input
                  id="gmb_location_id"
                  placeholder="Ex: 98765432109876543210"
                  value={gmbLocationId}
                  onChange={(e) => setGmbLocationId(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="gmb_access_token">Access Token GMB (obligatoire)</Label>
                <Input
                  id="gmb_access_token"
                  type="password"
                  placeholder="ya29.a0AfH6SMA..."
                  value={gmbAccessToken}
                  onChange={(e) => setGmbAccessToken(e.target.value)}
                  autoComplete="off"
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Ce token sera utilisé pour la sync des avis et les futurs posts GMB.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={savingGmb}>
              {savingGmb ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Connecter / Mettre à jour GMB
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
