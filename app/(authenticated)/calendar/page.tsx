import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/CalendarView'
import { Button } from '@/components/ui/button'
import { PenSquare } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendrier éditorial</h1>
          <p className="text-muted-foreground">
            Visualisez et gérez vos publications programmées
          </p>
        </div>
        <Link href="/posts/new">
          <Button>
            <PenSquare className="mr-2 h-4 w-4" />
            Créer un post
          </Button>
        </Link>
      </div>

      {/* Calendrier */}
      <CalendarView />
    </div>
  )
}
