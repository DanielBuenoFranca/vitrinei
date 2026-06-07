CREATE OR REPLACE FUNCTION public.generate_referral_link_24h(_referrer uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _active int;
  _token text;
  _id uuid;
  _hours int;
  _expires timestamptz;
BEGIN
  IF _referrer IS NULL THEN
    RETURN jsonb_build_object('error','Usuário inválido');
  END IF;

  SELECT COALESCE(invite_expiration_hours, 24) INTO _hours
    FROM referral_campaigns
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  IF _hours IS NULL OR _hours < 1 THEN _hours := 24; END IF;
  _expires := now() + make_interval(hours => _hours);

  SELECT COUNT(*) INTO _active FROM referrals
    WHERE referrer_id = _referrer
      AND status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at > now()
      AND consumed_at IS NULL;

  IF _active >= 3 THEN
    RETURN jsonb_build_object('error','Limite de 3 links ativos atingido. Aguarde expirar ou ser usado.');
  END IF;

  _token := encode(gen_random_bytes(12),'hex');

  INSERT INTO referrals (referrer_id, referral_code, link_token, status, expires_at, commission_amount)
  VALUES (_referrer, upper(substring(_token from 1 for 8)), _token, 'pending', _expires, 5)
  RETURNING id INTO _id;

  RETURN jsonb_build_object('success', true, 'id', _id, 'token', _token, 'expires_at', _expires, 'hours', _hours);
END;
$function$;