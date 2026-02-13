import type { User } from '@supabase/supabase-js'
import { createAdminClient } from './admin'

function buildFullName(user: User): string {
  const fullName = user.user_metadata?.full_name
  if (typeof fullName === 'string' && fullName.trim().length > 0) {
    return fullName.trim()
  }

  if (user.email) {
    return user.email.split('@')[0]
  }

  return 'Utilisateur'
}

/**
 * S'assure qu'un profil existe dans public.users pour l'utilisateur auth courant.
 * Important pour respecter les FK (posts.created_by -> users.id).
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const admin = createAdminClient()

  const { data: existingUser, error: selectError } = await admin
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Impossible de vérifier le profil utilisateur: ${selectError.message}`)
  }

  const email = user.email || ''
  const fullName = buildFullName(user)

  if (existingUser) {
    const { error: updateError } = await admin
      .from('users')
      .update({
        email,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Impossible de mettre à jour le profil utilisateur: ${updateError.message}`)
    }

    return
  }

  const { error: insertError } = await admin
    .from('users')
    .insert({
      id: user.id,
      email,
      full_name: fullName,
      role: 'user',
    })

  if (insertError) {
    throw new Error(`Impossible de créer le profil utilisateur: ${insertError.message}`)
  }
}
