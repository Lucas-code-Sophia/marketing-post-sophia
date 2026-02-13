import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/supabase/profiles'
import { Sidebar } from '@/components/layout/sidebar'
import type { UserRole } from '@/types'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Garantit l'existence du profil dans public.users (FK posts.created_by)
  await ensureUserProfile(user)

  // Get user role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole: UserRole = userData?.role || 'user'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
