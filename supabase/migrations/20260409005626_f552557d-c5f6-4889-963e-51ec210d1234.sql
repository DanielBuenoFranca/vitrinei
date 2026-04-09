
-- Wallets: allow admin insert and delete
CREATE POLICY "Admins can insert wallets"
  ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wallets"
  ON public.wallets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Wallet transactions: allow admin delete
CREATE POLICY "Admins can delete wallet_transactions"
  ON public.wallet_transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Subscriptions: allow admin delete
CREATE POLICY "Admins can delete subscriptions"
  ON public.subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Referrals: allow admin delete and update
CREATE POLICY "Admins can delete referrals"
  ON public.referrals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referrals"
  ON public.referrals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
