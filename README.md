# Carmen Social Media Manager

Application interne pour gérer les publications sur les réseaux sociaux (Facebook, Instagram) pour le réseau d'agences Carmen Immobilier.

## Stack technique

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend/Auth**: Supabase
- **Automatisation**: n8n (webhooks)

## Installation

### 1. Cloner et installer les dépendances

```bash
cd carmen-social-manager
npm install
```

### 2. Configuration des variables d'environnement

Copier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Puis remplir les valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SCHEDULER_API_KEY=your-secret-api-key-for-scheduler
N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.com
```

**Note importante** : `SCHEDULER_API_KEY` est une clé secrète que vous devez générer (par exemple avec `openssl rand -hex 32`) et utiliser dans votre workflow n8n pour sécuriser l'endpoint de publication automatique.

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
/app
  /(authenticated)     # Pages protégées (requièrent connexion)
    /dashboard         # Tableau de bord
    /posts             # Liste et création de posts
    /validation        # Validation des posts (manager/admin)
    /admin             # Administration (admin only)
  /login               # Page de connexion

/components
  /ui                  # Composants UI (Button, Card, Input...)
  /layout              # Composants layout (Sidebar)
  /posts               # Composants liés aux posts

/lib
  /supabase            # Clients Supabase (client, server, middleware)
  utils.ts             # Fonctions utilitaires

/hooks                 # Custom React hooks
/types                 # Types TypeScript
```

## Rôles utilisateur

| Rôle | Permissions |
|------|-------------|
| `admin` | Tout voir, créer des comptes, gérer les comptes sociaux |
| `manager` | Voir tous les posts, valider/rejeter les posts des users |
| `user` | Créer des posts (soumis à validation), voir ses propres posts |

## Workflow de publication

1. **User** crée un post → status = `pending_validation`
2. **Manager** valide → status = `scheduled` avec date de publication
3. **Manager** rejette → status = `rejected` avec raison
4. **n8n Scheduler** publie automatiquement quand `scheduled_at <= NOW()` (créneaux : heures pleines de 10h à 22h uniquement)

Les **Manager** et **Admin** peuvent créer des posts directement en status `scheduled`.

### Publication automatique avec n8n

Pour que les posts programmés soient publiés automatiquement, vous devez configurer un workflow n8n :

Les posts ne peuvent être programmés qu'à des **heures pleines** (10h, 11h, …, 22h). Le workflow n8n peut donc tourner **toutes les 2 heures** pour limiter les itérations.

1. **Créer un nouveau workflow n8n**
2. **Ajouter un nœud "Schedule Trigger"** :
   - Intervalle : **Toutes les 2 heures** (ex. 10h, 12h, 14h, 16h, 18h, 20h, 22h)
3. **Ajouter un nœud "HTTP Request"** :
   - Method : `POST`
   - URL : `https://votre-domaine.com/api/posts/check-scheduled`
   - Headers :
     - `Content-Type`: `application/json`
     - `x-api-key`: `votre-SCHEDULER_API_KEY`
4. **Activer le workflow**

L'endpoint `/api/posts/check-scheduled` va :
- Chercher tous les posts avec `status = 'scheduled'` et `scheduled_at <= maintenant`
- Publier automatiquement chaque post trouvé
- Retourner un résumé des publications réussies et échouées

Les posts ne peuvent être programmés qu'aux **heures pleines entre 10h et 22h** ; le workflow n8n peut donc s'exécuter toutes les 2 heures sans rater de créneau.

**Test de l'endpoint** : Vous pouvez tester avec une requête GET (même headers) pour voir quels posts seraient publiés sans les publier réellement.

## Base de données

Les tables Supabase doivent être créées au préalable :
- `users` - Profils utilisateurs avec rôles
- `social_accounts` - Comptes FB/IG connectés
- `posts` - Publications
- `media` - Fichiers uploadés
- `agencies` - Agences Carmen

## Développement

### Ajouter un composant shadcn/ui

Les composants sont déjà dans `/components/ui`. Pour en ajouter d'autres, créer manuellement le fichier en suivant la documentation shadcn/ui.

### Variables CSS

Les couleurs et le thème sont définis dans `/app/globals.css` avec des variables CSS.

## Production

```bash
npm run build
npm start
```

## Support

Pour toute question, contacter l'équipe technique Carmen.
