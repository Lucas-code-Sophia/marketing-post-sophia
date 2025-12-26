import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishPost } from '@/lib/webhooks/n8n'

/**
 * POST /api/posts/publish
 * Publie un post via le webhook n8n approprié
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (manager ou admin uniquement)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes. Seuls les managers et admins peuvent publier.' },
        { status: 403 }
      )
    }

    // Récupérer le postId depuis le body
    const body = await request.json()
    const { postId } = body

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { error: 'postId requis et doit être une chaîne de caractères' },
        { status: 400 }
      )
    }

    // Publier le post
    const result = await publishPost(postId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la publication' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      externalPostId: result.externalPostId,
      message: 'Post publié avec succès',
    })
  } catch (error: any) {
    console.error('Erreur lors de la publication:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de la publication' },
      { status: 500 }
    )
  }
}
