import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Utiliser des valeurs par défaut pour permettre le build même sans variables d'env
  // Les vraies valeurs seront chargées au runtime côté client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.placeholder'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
