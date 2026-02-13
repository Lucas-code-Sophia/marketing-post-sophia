import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const tickets = [
  {
    id: 'receipt',
    title: 'Ticket de caisse classique',
    subtitle: 'Impression client – récapitulatif complet',
    preview: [
      'SOPHIA SOCIALS - RESTAURANT',
      '--------------------------------',
      'Table: 12   Serveur: LUCAS',
      'Date: 2026-02-06  20:14',
      '--------------------------------',
      '1x Burger Classic        12,00€',
      '1x Frites                4,00€',
      '1x Soda Cola             3,00€',
      '--------------------------------',
      'Sous-total               19,00€',
      'TVA (10%)                 1,90€',
      'Total                    20,90€',
      '--------------------------------',
      'Paiement: CB',
      'Merci et à bientôt !'
    ]
  },
  {
    id: 'kitchen',
    title: 'Ticket cuisine',
    subtitle: 'Impression plats – pour la cuisine',
    preview: [
      'CUISINE - COMMANDES',
      '--------------------------------',
      'Table: 12   Serveur: LUCAS',
      'Heure: 20:14',
      '--------------------------------',
      '2x Burger Classic',
      '  - Sans oignons',
      '  - Sauce à part',
      '1x Salade César',
      '--------------------------------',
      'Notes: Allergie noix'
    ]
  },
  {
    id: 'bar',
    title: 'Ticket bar',
    subtitle: 'Impression boissons – pour le bar',
    preview: [
      'BAR - BOISSONS',
      '--------------------------------',
      'Table: 12   Serveur: LUCAS',
      'Heure: 20:14',
      '--------------------------------',
      '2x Mojito',
      '1x Bière blonde 25cl',
      '1x Eau pétillante',
      '--------------------------------',
      'Priorité: normale'
    ]
  }
]

export default function PrintTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tickets d’impression</h1>
        <p className="text-muted-foreground">
          Espace temporaire pour visualiser les modèles de tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader>
              <CardTitle className="text-base">{ticket.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{ticket.subtitle}</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-white p-4 shadow-sm">
                <pre className="text-xs leading-5 font-mono whitespace-pre-wrap">
                  {ticket.preview.join('\n')}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
