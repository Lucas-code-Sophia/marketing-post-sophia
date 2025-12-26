import { createClient } from '@supabase/supabase-js'
import type { Post, SocialAccount } from '@/types'
import { getWebhookConfig } from './builders'

/**
 * Crée un client Supabase admin avec service role key
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL n\'est pas définie dans les variables d\'environnement')
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY n\'est pas définie dans les variables d\'environnement. Veuillez l\'ajouter dans votre fichier .env.local')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Appelle un webhook n8n avec retry
 */
async function callWebhook(
  url: string,
  body: Record<string, any>,
  retries = 2
): Promise<{ success: boolean; data?: any; error?: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Créer un AbortController pour le timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Webhook returned ${response.status}: ${errorText}`
        )
      }

      const data = await response.json().catch(() => ({}))
      return { success: true, data }
    } catch (error: any) {
      const isLastAttempt = attempt === retries
      const errorMessage =
        error.name === 'AbortError'
          ? 'Timeout: le webhook n8n n\'a pas répondu dans les 30 secondes'
          : error.message || 'Erreur inconnue lors de l\'appel au webhook'

      if (isLastAttempt) {
        return { success: false, error: errorMessage }
      }

      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return { success: false, error: 'Échec après tous les essais' }
}

/**
 * Publie un post via le webhook n8n approprié
 */
export async function publishPost(postId: string): Promise<{
  success: boolean
  externalPostId?: string
  error?: string
}> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Récupérer le post
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return {
        success: false,
        error: `Post non trouvé: ${postError?.message || 'Post introuvable'}`,
      }
    }

    // 2. Récupérer le compte social associé
    if (!post.social_account_id) {
      return {
        success: false,
        error: 'Aucun compte social associé à ce post',
      }
    }

    const { data: socialAccount, error: accountError } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('id', post.social_account_id)
      .single()

    if (accountError || !socialAccount) {
      return {
        success: false,
        error: `Compte social non trouvé: ${accountError?.message || 'Compte introuvable'}`,
      }
    }

    // 3. Vérifier que le post est prêt à être publié
    if (post.status !== 'scheduled' && post.status !== 'pending_validation') {
      return {
        success: false,
        error: `Le post n'est pas prêt à être publié (status: ${post.status})`,
      }
    }

    // 4. Mettre à jour le status à "publishing"
    await supabaseAdmin
      .from('posts')
      .update({
        status: 'publishing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    // 5. Construire la configuration du webhook
    const { url, body } = getWebhookConfig(post as Post, socialAccount as SocialAccount)

    // 6. Appeler le webhook n8n
    const result = await callWebhook(url, body)

    if (!result.success) {
      // Mettre à jour le status à "failed" avec l'erreur
      await supabaseAdmin
        .from('posts')
        .update({
          status: 'failed',
          error_message: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

      return {
        success: false,
        error: result.error,
      }
    }

    // 7. Succès : mettre à jour le post avec les infos de publication
    const externalPostId =
      result.data?.id || result.data?.post_id || result.data?.external_id || null

    await supabaseAdmin
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        external_post_id: externalPostId,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    return {
      success: true,
      externalPostId: externalPostId || undefined,
    }
  } catch (error: any) {
    // En cas d'erreur inattendue, essayer de mettre à jour le post
    try {
      const supabaseAdmin = getSupabaseAdmin()
      await supabaseAdmin
        .from('posts')
        .update({
          status: 'failed',
          error_message: error.message || 'Erreur inconnue',
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
    } catch (updateError) {
      // Ignorer les erreurs de mise à jour si la connexion DB échoue
      console.error('Erreur lors de la mise à jour du statut:', updateError)
    }

    return {
      success: false,
      error: error.message || 'Erreur inconnue lors de la publication',
    }
  }
}
