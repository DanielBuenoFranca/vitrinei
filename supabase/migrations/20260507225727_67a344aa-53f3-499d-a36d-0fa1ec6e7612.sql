
CREATE OR REPLACE FUNCTION public.release_referral_phase(_referral_id uuid, _phase text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referral RECORD;
  _snapshot jsonb;
  _reward_buyer numeric;
  _reward_seller numeric;
  _reward_mixed_total numeric;
  _amount_to_release numeric := 0;
  _referrer_wallet_id uuid;
  _new_total numeric;
  _phase_label text;
BEGIN
  SELECT * INTO _referral FROM public.referrals WHERE id = _referral_id FOR UPDATE;
  IF _referral IS NULL THEN
    RETURN jsonb_build_object('error', 'Indicação não encontrada');
  END IF;

  -- Cadastros de origem importação não geram bonificação
  IF _referral.source = 'import' THEN
    RETURN jsonb_build_object('error', 'Cadastro de importação não entra no fluxo de bonificação');
  END IF;

  _snapshot := _referral.reward_snapshot;
  IF _snapshot IS NULL THEN
    RETURN jsonb_build_object('error', 'Snapshot de recompensa não encontrado');
  END IF;

  _reward_buyer := (_snapshot->>'reward_buyer')::numeric;
  _reward_seller := (_snapshot->>'reward_seller')::numeric;
  _reward_mixed_total := (_snapshot->>'reward_mixed_total')::numeric;

  IF _referral.referred_role = 'mixed' THEN
    IF _phase = 'buyer' AND NOT _referral.buyer_released THEN
      _amount_to_release := _reward_buyer;
      _phase_label := 'Fase 1/2 (Compra)';
    ELSIF _phase = 'seller' AND NOT _referral.seller_released THEN
      _amount_to_release := _reward_seller;
      _phase_label := 'Fase 2/2 (Venda)';
    ELSE
      RETURN jsonb_build_object('error', 'Fase já liberada ou inválida');
    END IF;
  ELSIF _referral.referred_role IN ('client', 'buyer') THEN
    IF _phase = 'buyer' AND NOT _referral.buyer_released THEN
      _amount_to_release := _reward_buyer;
      _phase_label := 'Completo';
    ELSE
      RETURN jsonb_build_object('error', 'Já liberado');
    END IF;
  ELSIF _referral.referred_role IN ('provider', 'seller') THEN
    IF _phase = 'seller' AND NOT _referral.seller_released THEN
      _amount_to_release := _reward_seller;
      _phase_label := 'Completo';
    ELSE
      RETURN jsonb_build_object('error', 'Já liberado');
    END IF;
  END IF;

  _new_total := _referral.total_paid + _amount_to_release;
  IF _new_total > _reward_mixed_total THEN
    _amount_to_release := _reward_mixed_total - _referral.total_paid;
    IF _amount_to_release <= 0 THEN
      RETURN jsonb_build_object('error', 'Limite de recompensa atingido');
    END IF;
  END IF;

  SELECT id INTO _referrer_wallet_id FROM public.wallets WHERE user_id = _referral.referrer_id;
  IF _referrer_wallet_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Carteira do indicador não encontrada');
  END IF;

  UPDATE public.wallets
    SET balance = balance + _amount_to_release,
        pending_balance = GREATEST(pending_balance - _amount_to_release, 0),
        total_earned = total_earned + _amount_to_release,
        updated_at = now()
    WHERE user_id = _referral.referrer_id;

  INSERT INTO public.wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (
      _referral.referrer_id, _referrer_wallet_id, _amount_to_release,
      'referral_cashback',
      '[Indicação] ' || COALESCE(_referral.referred_name, 'Usuário') || ' - ' || _phase_label
    );

  UPDATE public.referrals SET
    buyer_released = CASE WHEN _phase = 'buyer' THEN true ELSE buyer_released END,
    seller_released = CASE WHEN _phase = 'seller' THEN true ELSE seller_released END,
    total_paid = _referral.total_paid + _amount_to_release,
    status = CASE
      WHEN _referral.referred_role = 'mixed' AND
           (CASE WHEN _phase = 'buyer' THEN true ELSE buyer_released END) AND
           (CASE WHEN _phase = 'seller' THEN true ELSE seller_released END)
        THEN 'activated'
      WHEN _referral.referred_role != 'mixed' THEN 'activated'
      ELSE 'partial'
    END,
    activated_at = CASE
      WHEN _referral.referred_role = 'mixed' AND
           (CASE WHEN _phase = 'buyer' THEN true ELSE buyer_released END) AND
           (CASE WHEN _phase = 'seller' THEN true ELSE seller_released END)
        THEN now()
      WHEN _referral.referred_role != 'mixed' THEN now()
      ELSE activated_at
    END
  WHERE id = _referral_id;

  IF _referral.referred_role = 'mixed' AND NOT _referral.bonus_released THEN
    DECLARE
      _updated_ref RECORD;
      _bonus numeric;
    BEGIN
      SELECT * INTO _updated_ref FROM public.referrals WHERE id = _referral_id;
      IF _updated_ref.buyer_released AND _updated_ref.seller_released THEN
        _bonus := _reward_mixed_total - _updated_ref.total_paid;
        IF _bonus > 0 THEN
          UPDATE public.wallets
            SET balance = balance + _bonus,
                pending_balance = GREATEST(pending_balance - _bonus, 0),
                total_earned = total_earned + _bonus,
                updated_at = now()
            WHERE user_id = _referral.referrer_id;
          INSERT INTO public.wallet_transactions (user_id, wallet_id, amount, type, description)
            VALUES (
              _referral.referrer_id, _referrer_wallet_id, _bonus,
              'referral_bonus',
              '[Indicação] ' || COALESCE(_referral.referred_name, 'Usuário') || ' - Bônus Misto'
            );
          UPDATE public.referrals SET
            bonus_released = true,
            total_paid = _updated_ref.total_paid + _bonus
          WHERE id = _referral_id;
        END IF;
      END IF;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'amount_released', _amount_to_release,
    'phase', _phase_label
  );
END;
$$;
