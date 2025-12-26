import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PenSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDate, getStatusColor, getStatusLabel, getPlatformIcon } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user info
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Get stats
  const { count: pendingCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_validation')

  const { count: scheduledCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')

  const { count: publishedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bonjour, {userData?.full_name} 👋</h1>
          <p className="text-muted-foreground">Voici un aperçu de votre activité</p>
        </div>
        <Link href="/posts/new">
          <Button>
            <PenSquare className="mr-2 h-4 w-4" />
            Créer un post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Programmés
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publiés
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent posts */}
      <Card>
        <CardHeader>
          <CardTitle>Posts récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Link 
                  key={post.id} 
                  href={`/posts/${post.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {post.caption || 'Sans titre'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                    {getStatusLabel(post.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucun post pour le moment. 
              <Link href="/posts/new" className="text-primary hover:underline ml-1">
                Créez votre premier post
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
