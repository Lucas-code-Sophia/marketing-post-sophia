import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PenSquare, Eye } from 'lucide-react'
import { formatDate, getStatusColor, getStatusLabel, getPlatformIcon } from '@/lib/utils'

export default async function PostsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single()

  // Get posts based on role
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  // Users only see their own posts
  if (userData?.role === 'user') {
    query = query.eq('created_by', user?.id)
  }

  const { data: posts } = await query

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {userData?.role === 'user' ? 'Mes posts' : 'Tous les posts'}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos publications sur les réseaux sociaux
          </p>
        </div>
        <Link href="/posts/new">
          <Button>
            <PenSquare className="mr-2 h-4 w-4" />
            Créer un post
          </Button>
        </Link>
      </div>

      {/* Posts list */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {post.caption || 'Sans titre'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.post_type}</span>
                        <span>•</span>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      {post.status === 'rejected' && post.rejection_reason && (
                        <p className="text-sm text-red-500 mt-1">
                          Rejeté : {post.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {getStatusLabel(post.status)}
                    </span>
                    <Link href={`/posts/${post.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
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
