# Note de suivi – SOPHIA Socials (marketing-post-sophia)

Document de référence pour savoir où on en est sur le projet. À mettre à jour à chaque grosse évolution.

---

## 1. Démarrage du projet

- **Problème** : la commande `next` n'était pas reconnue.
- **Action** : `npm install` dans `sophia-socials-manager` pour installer les dépendances (Next.js, Supabase, etc.).
- **État** : ✅ OK – le projet peut être lancé avec `npm run dev`.

---

## 2. Configuration Supabase

- **Contexte** : connexion à la base Supabase pour l'app.
- **Action** :
  - Création de `.env.local` avec :
    - `NEXT_PUBLIC_SUPABASE_URL` = URL du projet Supabase
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé anonyme
  - Création / vérification du `.gitignore` pour ne pas committer `.env*.local`.
- **État** : ✅ OK – l'app utilise Supabase (auth, posts, etc.).
- **À faire côté déploiement** : définir les mêmes variables d'environnement (et éventuellement `SUPABASE_SERVICE_ROLE_KEY`, `SCHEDULER_API_KEY`) sur l'hébergement.

---

## 3. Publication automatique et n8n

- **Fonctionnement** :
  - Les posts sont créés / validés avec un statut `scheduled` et une date/heure `scheduled_at`.
  - Un workflow **n8n** appelle périodiquement l'API :  
    `POST /api/posts/check-scheduled` (avec header `x-api-key: SCHEDULER_API_KEY`).
  - L'API récupère les posts `scheduled` dont `scheduled_at` est passée, puis les publie via le webhook n8n (Facebook / Instagram).
- **Fréquence** : définie dans n8n (Schedule Trigger). Pas dans l'app.
- **État** : ✅ OK – tant que n8n appelle l'URL avec la bonne clé, les posts programmés sont publiés.

---

## 4. Créneaux de publication (10h–22h, toutes les 2 h)

- **Objectif** : limiter les exécutions n8n (pas toutes les minutes).
- **Règles** :
  - Publication possible uniquement aux **heures pleines** : **10h, 12h, 14h, 16h, 18h, 20h, 22h**.
  - n8n peut donc tourner **toutes les 2 heures** (ou à ces heures précises).
- **État** : ✅ OK – côté app, tout est aligné sur ces créneaux.

---

## 5. Calendrier – Aperçu des posts

- **État** : ✅ OK – aperçu calendrier = forme plateforme ; clic = modal détaillé.
- Vue mois et semaine avec mini-cartes IG/FB/GMB.
- Titres des jours en localStorage (pour partage entre users, il faudrait une table Supabase).

---

## 6. Git et dépôt GitHub

- **Repo** : `https://github.com/Lucas-code-Sophia/marketing-post-sophia.git`
- **État** : ✅ OK – push fonctionnel.

---

# 🆕 NOUVELLES FONCTIONNALITÉS (Février 2026)

---

## 7. Statistiques Instagram (`/statistiques`)

### État actuel
- ✅ Page créée avec affichage des stats du compte
- ✅ Affichage des variations (7j, 30j, 90j)
- ✅ Grille des posts style Instagram
- ✅ Popup avec stats détaillées au clic sur un post
- ✅ Tables Supabase créées (`instagram_account_stats`, `instagram_post_stats`)
- ✅ Vue SQL `instagram_stats_with_variations`

### ⚠️ Ce qu'il reste à faire

| Tâche | Détail |
|-------|--------|
| **Importer le workflow n8n stats compte** | Fichier : `docs/n8n/n8n-instagram-stats-daily.json` → importer dans n8n |
| **Importer le workflow n8n stats posts** | Fichier : `docs/n8n/n8n-instagram-posts-stats.json` → importer dans n8n |
| **Configurer les credentials n8n** | 1. HTTP Query Auth avec `access_token` = ton token Graph API<br>2. Supabase avec URL + service_role key |
| **Exécuter les workflows une 1ère fois** | Pour peupler les tables avec les données initiales |
| **Activer les workflows** | Ils tourneront automatiquement chaque jour (8h et 9h) |

### Infos techniques
- **ID Instagram Business** : `17841405211466761` (sophia.capferret)
- **UUID social_account** : `2c6ce840-8e03-4ddb-926d-97cd215dbac0`
- **Token Graph API** : à récupérer dans Meta Business Suite (expiration à surveiller)

---

## 8. Templates (`/templates`)

### État actuel
- ✅ Page créée avec upload de visuels
- ✅ Catégories : Story, Post, Promo, Menu, Événement, Autre
- ✅ Filtrage par catégorie
- ✅ Action "Poster en Story Instagram" avec programmation
- ✅ Table Supabase `templates` créée

### ⚠️ Ce qu'il reste à faire

| Tâche | Détail |
|-------|--------|
| **Tester l'upload** | Vérifier que le bucket `medias` accepte les uploads dans le dossier `templates/` |
| **Ajouter des templates** | Uploader tes premiers visuels pour le restau |

### Fonctionnel
Cette fonctionnalité est **prête à l'emploi** côté app. Il suffit d'uploader des templates.

---

## 9. Avis Google My Business (`/avis`)

### État actuel
- ✅ Page créée avec affichage des avis
- ✅ Stats : note moyenne, distribution étoiles, répondus/en attente
- ✅ Filtrage tous / en attente
- ✅ Modal pour rédiger une réponse
- ✅ Tables Supabase créées (`gmb_reviews`)
- ✅ Vue SQL `gmb_reviews_summary`
- ✅ Workflow n8n créé (`n8n-gmb-reviews-sync.json`)

### ⚠️ Ce qu'il reste à faire (plus complexe)

| Tâche | Détail | Difficulté |
|-------|--------|------------|
| **Créer un projet Google Cloud** | https://console.cloud.google.com → Nouveau projet | 🟢 Facile |
| **Activer l'API Business Profile** | APIs & Services → Activer "Google Business Profile API" | 🟢 Facile |
| **Créer des credentials OAuth2** | Type "Application Web", ajouter les URIs de redirection n8n | 🟡 Moyen |
| **Récupérer account_id et location_id** | Via l'API ou dans l'interface GMB | 🟡 Moyen |
| **Configurer le workflow n8n** | Remplacer les placeholders dans `n8n-gmb-reviews-sync.json` | 🟡 Moyen |
| **Ajouter un compte GMB dans social_accounts** | INSERT avec platform = 'gmb' | 🟢 Facile |
| **Poster les réponses via API (optionnel)** | Actuellement les réponses sont stockées localement | 🔴 Avancé |

### Comment obtenir les credentials GMB

1. **Google Cloud Console** : https://console.cloud.google.com
2. **Nouveau projet** → Nom : "SOPHIA Socials"
3. **APIs & Services** → **Bibliothèque** → Chercher "Business Profile API" → **Activer**
4. **APIs & Services** → **Credentials** → **Créer des identifiants** → **ID client OAuth**
   - Type : Application Web
   - Origines autorisées : `https://ton-instance-n8n.com`
   - URIs de redirection : `https://ton-instance-n8n.com/rest/oauth2-credential/callback`
5. **Télécharger le JSON** des credentials
6. Dans **n8n** : Créer un credential OAuth2 avec client_id et client_secret

### Récupérer account_id et location_id

```bash
# 1. Lister les comptes
GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts

# 2. Lister les locations d'un compte
GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{account_id}/locations
```

---

## 10. Facebook (placeholder)

### État actuel
- ⏳ Section Facebook présente sur `/statistiques` mais non connectée
- Les workflows de publication Facebook existent déjà (`n8n-facebook.json`)

### À faire plus tard
- Créer une table `facebook_page_stats` similaire à Instagram
- Créer un workflow n8n pour récupérer les stats
- Connecter sur la page `/statistiques`

---

# 📁 Récap des fichiers n8n

| Fichier | Rôle | Schedule | À configurer |
|---------|------|----------|--------------|
| `n8n-instagram-stats-daily.json` | Stats compte IG (followers, etc.) | 8h | HTTP Query Auth + Supabase |
| `n8n-instagram-posts-stats.json` | Stats des publications IG | 9h | HTTP Query Auth + Supabase |
| `n8n-gmb-reviews-sync.json` | Sync avis Google | 7h | OAuth2 GMB + Supabase + account_id/location_id |
| `n8n-instagram.json` | Publication IG | - | Déjà configuré ? |
| `n8n-facebook.json` | Publication FB | - | Déjà configuré ? |

---

# 📁 Récap des tables Supabase ajoutées

| Table | Rôle |
|-------|------|
| `instagram_account_stats` | Stats quotidiennes du compte IG |
| `instagram_post_stats` | Stats de chaque publication IG |
| `gmb_reviews` | Avis Google synchronisés |
| `templates` | Visuels réutilisables |

| Vue | Rôle |
|-----|------|
| `instagram_stats_with_variations` | Stats IG + variations 7j/30j/90j |
| `gmb_reviews_summary` | Résumé des avis (moyenne, distribution) |

---

# ✅ Checklist pour que tout fonctionne

## Immédiat (prêt à utiliser)
- [x] Posts : création, édition, programmation
- [x] Calendrier : vue mois/semaine avec aperçus
- [x] Templates : upload et utilisation

## À configurer (n8n)
- [ ] Importer `n8n-instagram-stats-daily.json`
- [ ] Importer `n8n-instagram-posts-stats.json`
- [ ] Configurer credential HTTP Query Auth (token Graph)
- [ ] Configurer credential Supabase
- [ ] Exécuter une première fois les workflows
- [ ] Activer les workflows

## Plus tard (GMB)
- [ ] Créer projet Google Cloud
- [ ] Activer Business Profile API
- [ ] Créer credentials OAuth2
- [ ] Récupérer account_id et location_id
- [ ] Ajouter compte GMB dans social_accounts
- [ ] Importer et configurer `n8n-gmb-reviews-sync.json`

---

# 🔑 Variables importantes

| Variable | Valeur | Où l'utiliser |
|----------|--------|---------------|
| Instagram Business ID | `17841405211466761` | Workflows n8n Instagram |
| UUID compte Instagram | `2c6ce840-8e03-4ddb-926d-97cd215dbac0` | Workflows n8n Instagram |
| Token Graph API | (à récupérer) | n8n credential HTTP Query Auth |
| Supabase URL | (dans .env.local) | n8n credential Supabase |
| Supabase service_role | (à récupérer) | n8n credential Supabase |

---

*Dernière mise à jour : 5 février 2026*
