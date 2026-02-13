import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SocialAccountsList } from '@/components/admin/SocialAccountsList'

export default async function SocialAccountsPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comptes sociaux</h1>
        <p className="text-muted-foreground">
          Gérez les comptes Facebook, Instagram et Google Business Profile connectés.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes connectés</CardTitle>
        </CardHeader>
        <CardContent>
          <SocialAccountsList accounts={accounts ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
