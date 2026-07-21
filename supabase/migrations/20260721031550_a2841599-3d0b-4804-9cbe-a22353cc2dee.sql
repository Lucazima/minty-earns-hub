
-- PROFILES
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Promotor',
  referral_code TEXT NOT NULL UNIQUE,
  pix_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REFERRALS
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX referrals_promoter_idx ON public.referrals(promoter_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own referrals" ON public.referrals FOR ALL TO authenticated USING (auth.uid() = promoter_id) WITH CHECK (auth.uid() = promoter_id);

-- COMMISSIONS
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('commission','signup')),
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX commissions_promoter_idx ON public.commissions(promoter_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own commissions" ON public.commissions FOR ALL TO authenticated USING (auth.uid() = promoter_id) WITH CHECK (auth.uid() = promoter_id);

-- WITHDRAWALS
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  pix_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX withdrawals_promoter_idx ON public.withdrawals(promoter_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = promoter_id);
CREATE POLICY "Own withdrawals insert" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = promoter_id AND status = 'pending');

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- new-user handler: create profile + seed a bit of demo data so the dashboard isn't blank
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT;
  v_code TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Promotor');
  v_code := lower(regexp_replace(v_name, '[^a-zA-Z0-9]', '', 'g')) || substr(replace(NEW.id::text,'-',''),1,5);
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (NEW.id, v_name, v_code);

  -- seed demo activity
  INSERT INTO public.referrals (promoter_id, referred_name, created_at) VALUES
    (NEW.id, 'Carla M.', now() - interval '2 hours'),
    (NEW.id, 'Pedro V.', now() - interval '2 days'),
    (NEW.id, 'Ana L.', now() - interval '5 days');

  INSERT INTO public.commissions (promoter_id, kind, title, detail, amount, occurred_at) VALUES
    (NEW.id, 'commission', 'Comissão de Lucas T.', 'depositou R$ 300', 45.00, now() - interval '3 hours'),
    (NEW.id, 'signup', 'Nova indicação: Carla M.', 'se cadastrou pelo seu link', 15.00, now() - interval '2 hours'),
    (NEW.id, 'commission', 'Comissão de Rafa P.', 'depositou R$ 650', 98.40, now() - interval '8 hours'),
    (NEW.id, 'commission', 'Comissão de Bruno S.', 'depositou R$ 800', 120.00, now() - interval '1 day 4 hours'),
    (NEW.id, 'commission', 'Comissão de Ana L.', 'depositou R$ 500', 75.00, now() - interval '4 days'),
    (NEW.id, 'commission', 'Comissão diária apurada', '6 pessoas ativas', 210.60, now() - interval '5 days');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
