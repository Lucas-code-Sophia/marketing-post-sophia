# Note de suivi – Carmen Social Manager (marketing-post-sophia)

Document de référence pour savoir où on en est sur le projet. À mettre à jour à chaque grosse évolution.

---

## 1. Démarrage du projet

- **Problème** : la commande `next` n’était pas reconnue.
- **Action** : `npm install` dans `carmen-social-manager` pour installer les dépendances (Next.js, Supabase, etc.).
- **État** : OK – le projet peut être lancé avec `npm run dev`.

---

## 2. Configuration Supabase

- **Contexte** : connexion à la base Supabase pour l’app.
- **Action** :
  - Création de `.env.local` avec :
    - `NEXT_PUBLIC_SUPABASE_URL` = URL du projet Supabase
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé anonyme
  - Création / vérification du `.gitignore` pour ne pas committer `.env*.local`.
- **État** : OK – l’app utilise Supabase (auth, posts, etc.).
- **À faire côté déploiement** : définir les mêmes variables d’environnement (et éventuellement `SUPABASE_SERVICE_ROLE_KEY`, `SCHEDULER_API_KEY`) sur l’hébergement.

---

## 3. Publication automatique et n8n

- **Fonctionnement** :
  - Les posts sont créés / validés avec un statut `scheduled` et une date/heure `scheduled_at`.
  - Un workflow **n8n** appelle périodiquement l’API :  
    `POST /api/posts/check-scheduled` (avec header `x-api-key: SCHEDULER_API_KEY`).
  - L’API récupère les posts `scheduled` dont `scheduled_at` est passée, puis les publie via le webhook n8n (Facebook / Instagram).
- **Fréquence** : définie dans n8n (Schedule Trigger). Pas dans l’app.
- **État** : OK – tant que n8n appelle l’URL avec la bonne clé, les posts programmés sont publiés.

---

## 4. Créneaux de publication (10h–22h, toutes les 2 h)

- **Objectif** : limiter les exécutions n8n (pas toutes les minutes).
- **Règles** :
  - Publication possible uniquement aux **heures pleines** : **10h, 12h, 14h, 16h, 18h, 20h, 22h**.
  - n8n peut donc tourner **toutes les 2 heures** (ou à ces heures précises).
- **Modifs** :
  - `lib/schedule.ts` : constantes `SCHEDULE_HOURS`, `parseScheduleValue`, `buildScheduleValue`, `snapHourToSlot`.
  - `components/posts/SchedulePicker.tsx` : sélecteur date + heure (uniquement 10, 12, 14, 16, 18, 20, 22).
  - Pages **Nouveau post**, **Édition post**, **Validation** : utilisation de `SchedulePicker` et enregistrement de `scheduled_at` en ISO.
  - **README** : mise à jour pour indiquer « n8n toutes les 2 h » et créneaux 10h–22h.
- **État** : OK – côté app, tout est aligné sur ces créneaux.

---

## 5. Calendrier – Aperçu des posts (forme plateforme)

- **Problème** : en vue calendrier (mois/semaine), l’aperçu des posts avant clic était blanc / peu lisible.
- **Objectif** : voir tout de suite le contenu (texte, photo ou vidéo + description) dans une forme qui rappelle la plateforme (Instagram, Facebook, GMB).
- **Modifs** :
  - Nouveau composant `components/posts/PostPreviewCompact.tsx` : mini-cartes type IG / FB / GMB (header, média ou zone texte, caption).
  - `components/calendar/CalendarEvent.tsx` : en vue **mois** et **semaine**, utilisation de `PostPreviewCompact` (avec `compact={true}`).
  - Au **clic** sur un post : ouverture du **modal** existant avec l’aperçu détaillé (`PostPreview` + `PostPreviewModal`) – inchangé.
- **État** : OK – aperçu calendrier = forme plateforme ; clic = modal détaillé.

---

## 6. Calendrier – Titres des jours

- **Objectif** : pouvoir ajouter un **titre** à chaque jour (ex. thème du jour, campagne).
- **Comportement** :
  - Clic sur le **numéro du jour** → champ « Titre du jour » en dessous.
  - Saisie du titre → **Entrée** ou **clic ailleurs** = enregistrement ; **Échap** = annulation.
  - Si un titre existe, il s’affiche sous le numéro ; sinon, rien (affichage propre).
- **Modifs** :
  - `hooks/useDayTitles.ts` : lecture/écriture des titres en **localStorage** (clé `carmen_calendar_day_titles`).
  - `components/calendar/CalendarMonth.tsx` et `CalendarWeek.tsx` : numéro cliquable + input titre + affichage du titre.
- **État** : OK – titres par jour en vue mois et semaine.
- **Note** : stockage local (navigateur). Pour partage entre utilisateurs / appareils, il faudrait une table Supabase (ex. `calendar_day_titles`) et adapter le hook.

---

## 7. Vue semaine = même aperçu que vue mois

- **Objectif** : en vue **semaine**, avoir le même type d’aperçu que en vue **mois** (cartes forme plateforme).
- **Modif** : dans `CalendarWeek.tsx`, passage de `compact={true}` aux `CalendarEvent`.
- **État** : OK – mois et semaine utilisent le même aperçu compact.

---

## 8. Git et dépôt GitHub

- **Repo cible** : `https://github.com/Lucas-code-Sophia/marketing-post-sophia.git`
- **Actions réalisées** :
  - `git remote set-url origin https://github.com/Lucas-code-Sophia/marketing-post-sophia.git`
  - `git add -A`
  - `git commit -m "Calendrier, créneaux 10h-22h, aperçus plateforme, titres jours"`
  - `git branch -M main`
  - `git push -u origin main` → **refusé** : permission denied pour l’utilisateur **testcarmenlucas-ux** sur le repo Lucas-code-Sophia.
- **État** : commit fait en local ; push à refaire une fois les droits OK (soit connexion avec le compte **Lucas-code-Sophia**, soit ajout de **testcarmenlucas-ux** en collaborateur sur le repo).

---

## Récap des fichiers importants modifiés / ajoutés

| Fichier | Rôle |
|--------|------|
| `.env.local` | Config Supabase (ne pas committer). |
| `lib/schedule.ts` | Créneaux 10h–22h toutes les 2 h, helpers date/heure. |
| `components/posts/SchedulePicker.tsx` | Sélecteur date + heure (créneaux autorisés). |
| `components/posts/PostPreviewCompact.tsx` | Aperçu calendrier en forme IG/FB/GMB. |
| `hooks/useDayTitles.ts` | Titres des jours (localStorage). |
| `components/calendar/CalendarEvent.tsx` | Utilise PostPreviewCompact en mois/semaine. |
| `components/calendar/CalendarMonth.tsx` | Numéro du jour cliquable + titre. |
| `components/calendar/CalendarWeek.tsx` | Idem + aperçu compact comme en mois. |
| `app/(authenticated)/posts/new/page.tsx` | SchedulePicker + enregistrement ISO. |
| `app/(authenticated)/posts/[id]/edit/page.tsx` | Idem. |
| `app/(authenticated)/validation/page.tsx` | Idem. |
| `README.md` | n8n toutes les 2 h, créneaux 10h–22h. |

---

## Prochaines étapes possibles

1. **Push GitHub** : régler les droits (compte ou collaborateurs) puis `git push -u origin main`.
2. **Variables d’env en prod** : `SCHEDULER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` si pas encore fait.
3. **Workflow n8n** : Schedule Trigger toutes les 2 h (ou aux heures 10, 12, 14, 16, 18, 20, 22) vers `POST /api/posts/check-scheduled`.
4. **Titres des jours partagés** (optionnel) : table Supabase + adaptation de `useDayTitles`.

-- Table des réglages (tokens API, etc.) — accès réservé aux admins
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.settings IS 'Réglages applicatifs (ex: token Instagram) ; lecture/écriture admin uniquement.';

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_admin"
  ON public.settings FOR SELECT TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "settings_insert_admin"
  ON public.settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "settings_update_admin"
  ON public.settings FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION public.settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON public.settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.settings_updated_at();

---

*Dernière mise à jour : février 2025*
