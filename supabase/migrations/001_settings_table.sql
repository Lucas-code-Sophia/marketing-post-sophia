-- Table des réglages (tokens API, etc.) — accès réservé aux admins
-- À exécuter dans le SQL Editor Supabase

-- Table
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Commentaire
COMMENT ON TABLE public.settings IS 'Réglages applicatifs (ex: token Instagram) ; lecture/écriture admin uniquement.';

-- RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire
CREATE POLICY "settings_select_admin"
  ON public.settings FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Seuls les admins peuvent insérer
CREATE POLICY "settings_insert_admin"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Seuls les admins peuvent mettre à jour
CREATE POLICY "settings_update_admin"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Mise à jour automatique de updated_at
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
