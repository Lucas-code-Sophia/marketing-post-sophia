'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SchedulePicker } from '@/components/posts/SchedulePicker'
import type { SocialAccount, PlatformType, PostType, MediaItem } from '@/types'

const POST_TYPES: Record<PlatformType, PostType[]> = {
  facebook: ['text', 'image', 'carrousel', 'video', 'link'],
  instagram: ['image', 'carrousel', 'reel', 'story'],
  gmb: ['image', 'text'],
}

export default function NewPostPage() {
  const router = useRouter()
  const supabase = await createClient()
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  
  // Form state
  const [platform, setPlatform] = useState<PlatformType | ''>('')
  const [postType, setPostType] = useState<PostType | ''>('')
  const [caption, setCaption] = useState('')
  const [link, setLink] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [socialAccountId, setSocialAccountId] = useState('')
  const [medias, setMedias] = useState<MediaItem[]>([])

  useEffect(() => {
    fetchSocialAccounts()
  }, [])

  async function fetchSocialAccounts() {
    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .order('account_name')
    
    if (data) setSocialAccounts(data)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('medias')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('medias')
          .getPublicUrl(filePath)

        const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
        
        setMedias(prev => [...prev, { url: publicUrl, type: mediaType }])

        // Also save to media table
        await supabase.from('media').insert({
          file_path: filePath,
          public_url: publicUrl,
          file_type: mediaType,
          file_size: file.size,
          uploaded_by: user.id,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  function removeMedia(index: number) {
    setMedias(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      // Determine initial status based on role
      let status = 'draft'
      if (scheduledAt) {
        status = userData?.role === 'user' ? 'pending_validation' : 'scheduled'
      }

      const { error: insertError } = await supabase.from('posts').insert({
        platform,
        post_type: postType,
        caption,
        link: postType === 'link' ? link : null,
        medias,
        status,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        social_account_id: socialAccountId || null,
        created_by: user.id,
      })

      if (insertError) throw insertError

      router.push('/posts')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const filteredAccounts = socialAccounts.filter(
    acc => !platform || acc.platform === platform
  )

  const availablePostTypes = platform ? POST_TYPES[platform] : []

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Créer un post</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Platform selection */}
            <div className="space-y-2">
              <Label>Plateforme</Label>
              <div className="flex gap-2">
                {(['facebook', 'instagram'] as PlatformType[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={platform === p ? 'default' : 'outline'}
                    onClick={() => {
                      setPlatform(p)
                      setPostType('')
                      setSocialAccountId('')
                    }}
                  >
                    {p === 'facebook' ? '📘 Facebook' : '📸 Instagram'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Post type selection */}
            {platform && (
              <div className="space-y-2">
                <Label>Type de post</Label>
                <div className="flex flex-wrap gap-2">
                  {availablePostTypes.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={postType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Social account selection */}
            {platform && (
              <div className="space-y-2">
                <Label htmlFor="socialAccount">Compte</Label>
                <select
                  id="socialAccount"
                  value={socialAccountId}
                  onChange={(e) => setSocialAccountId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Sélectionner un compte</option>
                  {filteredAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Media upload */}
            {postType && postType !== 'text' && postType !== 'link' && (
              <div className="space-y-2">
                <Label>Médias</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    accept="image/*,video/*"
                    multiple={postType === 'carrousel'}
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Cliquez pour uploader
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {/* Media previews */}
                {medias.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {medias.map((media, index) => (
                      <div key={index} className="relative">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={`Media ${index + 1}`}
                            className="h-20 w-20 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="h-20 w-20 object-cover rounded"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">
                Description
                {platform === 'instagram' && (
                  <span className="text-muted-foreground ml-2">
                    ({caption.length}/2200)
                  </span>
                )}
              </Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Écrivez votre description..."
                rows={4}
                maxLength={platform === 'instagram' ? 2200 : undefined}
              />
            </div>

            {/* Link (for link posts) */}
            {postType === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="link">Lien</Label>
                <Input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            {/* Schedule */}
            <SchedulePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              hint="Créneaux : 10h, 12h, 14h, 16h, 18h, 20h, 22h. Laissez vide pour brouillon."
            />

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading || !platform || !postType}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : scheduledAt ? (
                  'Soumettre'
                ) : (
                  'Enregistrer en brouillon'
                )}
              </Button>
              <Link href="/posts">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
