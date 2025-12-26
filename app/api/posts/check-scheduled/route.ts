import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishPost } from '@/lib/webhooks/n8n'

/**
 * POST /api/posts/check-scheduled
 * Vérifie et publie automatiquement les posts programmés dont la date est passée
 * Cet endpoint doit être appelé périodiquement par n8n (cron job)
 * 
 * Sécurité : Utilise une clé API dans les headers pour éviter les appels non autorisés
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier la clé API (pour la sécurité)
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.SCHEDULER_API_KEY

    if (!expectedApiKey) {
      console.error('SCHEDULER_API_KEY n\'est pas définie dans les variables d\'environnement')
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 500 }
      )
    }

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    // Créer un client Supabase admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Récupérer tous les posts programmés dont la date est passée
    const now = new Date().toISOString()
    
    const { data: scheduledPosts, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, scheduled_at, status')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .is('published_at', null) // Ne pas republier les posts déjà publiés

    if (fetchError) {
      console.error('Erreur lors de la récupération des posts programmés:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des posts', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun post à publier',
        count: 0,
        published: [],
        failed: [],
      })
    }

    // Publier chaque post
    const results = {
      published: [] as string[],
      failed: [] as Array<{ postId: string; error: string }>,
    }

    for (const post of scheduledPosts) {
      try {
        const result = await publishPost(post.id)
        
        if (result.success) {
          results.published.push(post.id)
        } else {
          results.failed.push({
            postId: post.id,
            error: result.error || 'Erreur inconnue',
          })
        }
      } catch (error: any) {
        results.failed.push({
          postId: post.id,
          error: error.message || 'Erreur lors de la publication',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.published.length} post(s) publié(s), ${results.failed.length} échec(s)`,
      count: scheduledPosts.length,
      published: results.published,
      failed: results.failed,
    })
  } catch (error: any) {
    console.error('Erreur lors de la vérification des posts programmés:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/posts/check-scheduled
 * Endpoint de test pour vérifier les posts programmés (sans les publier)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier la clé API
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.SCHEDULER_API_KEY

    if (!expectedApiKey) {
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 500 }
      )
    }

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const now = new Date().toISOString()
    
    const { data: scheduledPosts, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, scheduled_at, status, caption, platform')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .is('published_at', null)
      .order('scheduled_at', { ascending: true })

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération', details: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: scheduledPosts?.length || 0,
      posts: scheduledPosts || [],
      now,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

