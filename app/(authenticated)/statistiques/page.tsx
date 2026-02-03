import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Instagram, Facebook, TrendingUp, Info } from 'lucide-react'

export default function StatistiquesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">
          Suivi des performances de vos comptes et de vos publications
        </p>
      </div>

      {/* Info : à venir */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Page en construction</p>
            <p className="text-sm text-blue-800 mt-1">
              Les statistiques Instagram et Facebook seront connectées ici. On définira ensemble
              comment récupérer les données (APIs Meta / Facebook Developer, ou autres solutions).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Structure prévue : Instagram */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Abonnés</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Portée</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Impressions</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Interactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structure prévue : Facebook */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Abonnés / J’aime</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Portée</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Impressions</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-sm text-muted-foreground">Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structure prévue : Performances par post */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Performances des posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 rounded-lg border border-dashed bg-gray-50/50">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Statistiques par publication</p>
              <p className="text-sm mt-1">
                Likes, commentaires, partages par post (à connecter via API)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
