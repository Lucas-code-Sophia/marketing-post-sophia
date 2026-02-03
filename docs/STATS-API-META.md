# Données récupérables – Instagram & Facebook (Meta)

Avec des tokens en **permissions complètes**, voici ce que tu peux récupérer via les APIs Meta. Ce doc sert de référence pour la page Statistiques.

---

## 1. Instagram (Instagram Graph API)

**Prérequis** : compte Instagram **Business** ou **Créator** relié à une Page Facebook.

### Compte (IG User / profil)

| Donnée | Champ API / métrique | Description |
|--------|----------------------|-------------|
| Abonnés | `followers_count` | Nombre de followers |
| Abonnements | `follows_count` | Nombre de comptes suivis |
| Publications | `media_count` | Nombre de médias |

**Endpoint** : `GET /{ig-user-id}?fields=followers_count,follows_count,media_count`

### Insights compte (agrégés)

Disponibles via `GET /{ig-user-id}/insights` avec `metric` et période (`day`, `week`, `days_28`).

| Métrique | Description |
|----------|-------------|
| `impressions` | Nombre de fois où le contenu du compte a été affiché |
| `reach` | Comptes uniques ayant vu le contenu |
| `profile_views` | Visites du profil |
| `website_clicks` | Clics sur le lien du site (si renseigné) |
| `email_contacts` | Clics sur "Contact par e-mail" |
| `phone_call_clicks` | Clics sur "Appeler" |
| `get_directions_clicks` | Clics sur "Itinéraire" |
| `follower_count` | Évolution des followers (selon période) |

**Note (2024–2025)** : Meta déprécie certaines métriques (ex. anciennes `impressions` vidéo). Les nouvelles métriques type `views` remplacent les métriques vidéo spécifiques. Vérifier la doc officielle pour la version d’API utilisée.

### Insights par publication (média)

Disponibles via `GET /{ig-media-id}/insights` (après publication).

| Métrique | Description | Types de contenu |
|----------|-------------|-------------------|
| `impressions` | Fois où le média a été affiché | Feed, Reels, Story |
| `reach` | Comptes uniques ayant vu le média | Feed, Reels, Story |
| `engagement` | Likes + commentaires + sauvegardes + partages | Feed, Reels |
| `saved` | Nombre de sauvegardes | Feed, Reels |
| `likes` | Likes (souvent inclus dans engagement) | Feed, Reels |
| `comments` | Commentaires | Feed, Reels |
| `plays` / `views` | Lectures / vues (vidéo, Reels) | Reels, vidéo |
| `shares` | Partages | Feed, Reels |
| `accounts_engaged` | Comptes ayant interagi | Selon version API |
| `accounts_reached` | Comptes ayant vu le contenu | Selon version API |

**Limites** :
- Délai des données : jusqu’à 48 h.
- Stories : métriques disponibles ~24 h.
- Pas d’insights pour les albums (carrousels) de la même façon que pour un média simple dans certaines versions – à vérifier selon ton besoin.

### Permissions Instagram utiles

- `instagram_basic` (profil, médias)
- `instagram_manage_insights` (insights compte et médias)
- `pages_show_list` / `pages_read_engagement` (accès via Page Facebook liée)

---

## 2. Facebook (Facebook Graph API – Page)

**Prérequis** : Page Facebook + token avec droits sur la Page.

### Page (compte)

| Donnée | Champ / endpoint | Description |
|--------|------------------|-------------|
| J’aime (fans) | `fan_count` sur `/{page-id}?fields=fan_count` | Nombre de likes de la Page |
| Abonnés | `followers_count` | Abonnés de la Page |
| Visites | Via `/insights` | Visites de la Page |

### Insights Page (agrégés)

Endpoint : `GET /{page-id}/insights` avec `metric=...` et période.

| Métrique (exemples) | Description |
|---------------------|-------------|
| `page_impressions` | Impressions de la Page |
| `page_impressions_unique` | Impressions uniques (portée) |
| `page_engaged_users` | Utilisateurs ayant interagi avec la Page |
| `page_fans` | Évolution des fans (J’aime) |
| `page_views_total` | Vues totales de la Page |
| `page_fan_adds` | Nouveaux fans sur la période |
| `page_fan_removes` | Fans en moins |

**Limites** :
- Souvent besoin d’au moins 100 J’aime sur la Page pour certaines métriques.
- Données mises à jour environ toutes les 24 h.
- Données disponibles sur les 2 dernières années max, avec fenêtre max (ex. 90 jours) selon les paramètres.

### Insights par publication (post Facebook)

Endpoint : `GET /{post-id}/insights` avec les métriques demandées.

| Métrique (exemples) | Description |
|---------------------|-------------|
| `post_impressions` | Impressions du post |
| `post_impressions_unique` | Portée (comptes uniques) |
| `post_engaged_users` | Utilisateurs ayant interagi |
| `post_clicks` | Clics sur le post |
| `post_reactions_by_type_total` | Réactions (like, love, etc.) |
| `post_video_views_organic` | Vues vidéo (organiques) |
| `post_video_complete_views_organic_30s` | Vues complètes 30 s (vidéo) |

### Permissions Facebook (Page) utiles

- `pages_show_list`
- `pages_read_engagement`
- `pages_read_user_content`
- `read_insights` (pour les insights Page et post)

---

## 3. Lien avec ton app (Carmen Social Manager)

- **Comptes** : tu as déjà `social_accounts` (Facebook/Instagram) avec des tokens. Pour les stats, il faut que les tokens aient les permissions ci‑dessus (dont `instagram_manage_insights` et `read_insights` pour la Page).
- **Posts** : tu stockes `posts` avec `external_post_id` après publication. C’est cet ID qu’on utilisera pour appeler `GET /{external_post_id}/insights` (Instagram ou Facebook selon la plateforme).
- **Flux** :
  1. Récupérer stats **compte** (IG user / Page) périodiquement ou à l’affichage de la page Statistiques.
  2. Pour chaque post publié ayant un `external_post_id`, appeler les **insights post** et stocker ou afficher les métriques.

---

## 4. Résumé : ce que tu peux “récupérer” avec full permission

- **Instagram**  
  - Compte : abonnés, abonnements, nombre de posts.  
  - Insights compte : impressions, portée, vues profil, clics site/appel/email, évolution followers.  
  - Par post : impressions, portée, engagement, saved, likes, comments, plays/views, shares (selon type de média et version d’API).

- **Facebook**  
  - Page : J’aime (fans), abonnés, visites.  
  - Insights Page : impressions, portée, utilisateurs engagés, évolution des fans.  
  - Par post : impressions, portée, utilisateurs engagés, clics, réactions, vues vidéo (organiques).

Avec des tokens en **full permission** (comme tu prévois), tu auras accès à tout ce que Meta expose via ces endpoints pour les comptes et les posts liés à ton app.

---

*Références : [Instagram Insights](https://developers.facebook.com/docs/instagram-platform/api-reference/ig-user/insights/), [IG Media Insights](https://developers.facebook.com/docs/instagram-platform/api-reference/ig-media/insights/), [Page Insights](https://developers.facebook.com/docs/graph-api/reference/page/insights/), [Post Insights](https://developers.facebook.com/docs/graph-api/reference/post/insights/).*
