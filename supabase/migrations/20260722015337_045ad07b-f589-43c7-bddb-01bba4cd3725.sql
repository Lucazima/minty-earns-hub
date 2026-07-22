
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'promoter');
CREATE TYPE public.commission_tier AS ENUM ('novato', 'prata', 'ouro', 'diamante');
CREATE TYPE public.promoter_status AS ENUM ('pending', 'active', 'suspended', 'banned');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.promoter_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tier public.commission_tier NOT NULL DEFAULT 'novato',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend commissions
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source_ref TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS edit_reason TEXT;

CREATE POLICY "Admins read commissions" ON public.commissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update commissions" ON public.commissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend withdrawals
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS processed_by UUID;

CREATE POLICY "Admins read withdrawals" ON public.withdrawals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update withdrawals" ON public.withdrawals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Referrals: admins read
CREATE POLICY "Admins read referrals" ON public.referrals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Partners
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  commission_rate NUMERIC NOT NULL DEFAULT 15,
  webhook_url TEXT NOT NULL DEFAULT '',
  api_key_hash TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partners" ON public.partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commission rates
CREATE TABLE public.commission_rates (
  tier public.commission_tier PRIMARY KEY,
  percent NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commission_rates TO authenticated;
GRANT ALL ON public.commission_rates TO service_role;
ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage rates" ON public.commission_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.commission_rates(tier, percent) VALUES
  ('novato', 10), ('prata', 12), ('ouro', 15), ('diamante', 20);

-- Platform settings
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.platform_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.platform_settings(key, value) VALUES ('min_withdrawal_amount', '50');

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = actor_id);

-- Update handle_new_user to snapshot email and set pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_name TEXT;
  v_code TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Promotor');
  v_code := lower(regexp_replace(v_name, '[^a-zA-Z0-9]', '', 'g')) || substr(replace(NEW.id::text,'-',''),1,5);
  INSERT INTO public.profiles (user_id, display_name, referral_code, email, status, tier)
  VALUES (NEW.id, v_name, v_code, NEW.email, 'active', 'novato');

  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'promoter') ON CONFLICT DO NOTHING;

  INSERT INTO public.referrals (promoter_id, referred_name, created_at) VALUES
    (NEW.id, 'Carla M.', now() - interval '2 hours'),
    (NEW.id, 'Pedro V.', now() - interval '2 days'),
    (NEW.id, 'Ana L.', now() - interval '5 days');

  INSERT INTO public.commissions (promoter_id, kind, title, detail, amount, occurred_at, status, source_ref) VALUES
    (NEW.id, 'commission', 'Comissão de Lucas T.', 'depositou R$ 300', 45.00, now() - interval '3 hours', 'approved', 'dep_001'),
    (NEW.id, 'signup', 'Nova indicação: Carla M.', 'se cadastrou pelo seu link', 15.00, now() - interval '2 hours', 'approved', 'sig_001'),
    (NEW.id, 'commission', 'Comissão de Rafa P.', 'depositou R$ 650', 98.40, now() - interval '8 hours', 'pending', 'dep_002'),
    (NEW.id, 'commission', 'Comissão de Bruno S.', 'depositou R$ 800', 120.00, now() - interval '1 day 4 hours', 'approved', 'dep_003'),
    (NEW.id, 'commission', 'Comissão de Ana L.', 'depositou R$ 500', 75.00, now() - interval '4 days', 'approved', 'dep_004'),
    (NEW.id, 'commission', 'Comissão diária apurada', '6 pessoas ativas', 210.60, now() - interval '5 days', 'approved', 'dep_005');
  RETURN NEW;
END; $function$;

-- Seed a demo partner
INSERT INTO public.partners(name, contact_email, contact_phone, commission_rate, status)
VALUES ('BetSul', 'ops@betsul.com', '+55 11 90000-0000', 15, 'active');
