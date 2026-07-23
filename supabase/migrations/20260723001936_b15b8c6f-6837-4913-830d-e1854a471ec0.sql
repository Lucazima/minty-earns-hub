
-- Split "Own commissions" ALL into SELECT only
DROP POLICY IF EXISTS "Own commissions" ON public.commissions;
CREATE POLICY "Own commissions read" ON public.commissions
  FOR SELECT TO authenticated
  USING (auth.uid() = promoter_id);

-- Split "Own referrals" ALL into SELECT only
DROP POLICY IF EXISTS "Own referrals" ON public.referrals;
CREATE POLICY "Own referrals read" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = promoter_id);

-- Explicit admin-only DELETE policy on withdrawals (fail-closed remains for others)
DROP POLICY IF EXISTS "Admins delete withdrawals" ON public.withdrawals;
CREATE POLICY "Admins delete withdrawals" ON public.withdrawals
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from client roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
