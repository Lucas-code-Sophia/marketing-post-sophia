import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getPlatformIcon } from '@/lib/utils'

export default async function SocialAccountsPage() {
  const supabase = createClient()
  
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comptes sociaux</h1>
        <p className="text-muted-foreground">
          Gérez les comptes Facebook et Instagram connectés
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes connectés</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                    <div>
                      <p className="font-medium">{account.account_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {account.account_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Ajouté le {formatDate(account.created_at)}
                    </p>
                    {account.token_expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Token expire: {formatDate(account.token_expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Aucun compte social connecté
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
