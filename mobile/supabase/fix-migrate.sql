CREATE OR REPLACE FUNCTION public.migrate_with_code(
  p_code text,
  p_email text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $fn$
DECLARE
  v_bubble_id text;
  v_user_id uuid;
  v_shifts_count integer;
BEGIN
  SELECT mc.bubble_user_id INTO v_bubble_id
  FROM public.migration_codes mc
  WHERE mc.code = upper(p_code) AND mc.claimed = false;

  IF v_bubble_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid or already used migration code');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(p_email);

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_user_id;
  ELSE
    v_user_id := extensions.gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current, reauthentication_token,
      phone, phone_change, phone_change_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      lower(p_email),
      crypt(p_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"email_verified":true}'::jsonb,
      false, 'authenticated', 'authenticated', false, false,
      '', '', '',
      '', '', '',
      NULL, '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email), 'email_verified', true),
      'email', v_user_id::text,
      now(), now(), now()
    );
  END IF;

  UPDATE public.migration_codes
  SET claimed = true, claimed_by = v_user_id, claimed_at = now()
  WHERE code = upper(p_code);

  UPDATE public.bubble_users
  SET supabase_user_id = v_user_id
  WHERE bubble_id = v_bubble_id;

  INSERT INTO public.shifts (user_id, date, job, location, subjob, shift, reg_hours, ot_hours, reg_rate, ot_rate, total_pay, notes, created_at)
  SELECT v_user_id, bs.date,
         COALESCE(bs.job, 'LABOUR'), COALESCE(bs.location, 'UNKNOWN'), bs.subjob,
         COALESCE(bs.shift, 'DAY'), COALESCE(bs.reg_hours, 8), COALESCE(bs.ot_hours, 0),
         COALESCE(bs.reg_rate, 0), COALESCE(bs.ot_rate, 0), COALESCE(bs.total_pay, 0),
         bs.notes, COALESCE(bs.created_at, now())
  FROM public.bubble_shifts bs
  WHERE bs.bubble_user_id = v_bubble_id;

  GET DIAGNOSTICS v_shifts_count = ROW_COUNT;

  INSERT INTO public.profiles (id, name, union_local, board)
  SELECT v_user_id, bu.name, bu.union_local,
         CASE
           WHEN bu.board ILIKE '%B%' THEN 'B'
           WHEN bu.board ILIKE '%C%' THEN 'C'
           WHEN bu.board ILIKE '%T%' THEN 'T'
           WHEN bu.board ILIKE '%00%' THEN '00'
           WHEN bu.board ILIKE '%R%' THEN 'R'
           ELSE 'A'
         END
  FROM public.bubble_users bu WHERE bu.bubble_id = v_bubble_id
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    union_local = EXCLUDED.union_local,
    board = EXCLUDED.board;

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'shifts_transferred', v_shifts_count,
    'email', lower(p_email)
  );
END;
$fn$;
