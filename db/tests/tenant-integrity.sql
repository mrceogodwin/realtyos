DO $$
DECLARE
  tenant_a UUID := gen_random_uuid();
  tenant_b UUID := gen_random_uuid();
  user_a UUID := gen_random_uuid();
  user_b UUID := gen_random_uuid();
  user_c UUID := gen_random_uuid();
  property_a UUID := gen_random_uuid();
  lead_a UUID := gen_random_uuid();
  rate_key TEXT := md5(random()::text || clock_timestamp()::text);
  rate_count INTEGER;
BEGIN
  INSERT INTO tenants (id, name, slug) VALUES
    (tenant_a, 'Integrity Test A', 'integrity-test-a-' || replace(tenant_a::text, '-', '')),
    (tenant_b, 'Integrity Test B', 'integrity-test-b-' || replace(tenant_b::text, '-', ''));

  INSERT INTO user_profiles (id, email, email_verified) VALUES
    (user_a, 'integrity-a-' || tenant_a::text || '@example.invalid', true),
    (user_b, 'integrity-b-' || tenant_b::text || '@example.invalid', true),
    (user_c, 'integrity-c-' || tenant_a::text || '@example.invalid', true);

  INSERT INTO tenant_memberships (tenant_id, user_id, role, status) VALUES
    (tenant_a, user_a, 'owner', 'active'),
    (tenant_b, user_b, 'owner', 'active'),
    (tenant_a, user_c, 'owner', 'active');

  INSERT INTO properties (id, tenant_id, title, slug, price, assigned_agent_id, created_by)
  VALUES (property_a, tenant_a, 'Tenant A property', 'tenant-a-property', 1000000, user_a, user_a);

  INSERT INTO leads (id, tenant_id, property_id, full_name)
  VALUES (lead_a, tenant_a, property_a, 'Tenant A lead');

  -- A tenant B lead must not reference tenant A's property.
  BEGIN
    INSERT INTO leads (tenant_id, property_id, full_name)
    VALUES (tenant_b, property_a, 'Cross-tenant lead');
    RAISE EXCEPTION 'Tenant isolation failure: cross-tenant lead/property reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- A tenant B viewing must not reference tenant A's property.
  BEGIN
    INSERT INTO property_viewings (tenant_id, property_id, visitor_name, scheduled_at)
    VALUES (tenant_b, property_a, 'Cross-tenant visitor', now() + interval '1 day');
    RAISE EXCEPTION 'Tenant isolation failure: cross-tenant viewing/property reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- A property cannot be assigned to a user who is not a member of its tenant.
  BEGIN
    INSERT INTO properties (tenant_id, title, slug, price, assigned_agent_id, created_by)
    VALUES (tenant_a, 'Invalid assignment', 'invalid-assignment', 1000000, user_b, user_a);
    RAISE EXCEPTION 'Tenant isolation failure: foreign workspace agent assignment was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- Secondary property media references must retain the same tenant scope.
  BEGIN
    INSERT INTO property_media (tenant_id, property_id, storage_key)
    VALUES (tenant_b, property_a, 'integrity-test/invalid.jpg');
    RAISE EXCEPTION 'Tenant isolation failure: cross-tenant media reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;


  -- A lead cannot be assigned to an agent from another tenant.
  BEGIN
    INSERT INTO leads (tenant_id, assigned_agent_id, full_name)
    VALUES (tenant_a, user_b, 'Invalid agent assignment');
    RAISE EXCEPTION 'Tenant isolation failure: foreign workspace lead agent was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- A viewing cannot link a lead from another tenant.
  BEGIN
    INSERT INTO property_viewings (tenant_id, property_id, lead_id, visitor_name, scheduled_at)
    VALUES (tenant_b, property_a, lead_a, 'Cross-tenant lead visitor', now() + interval '1 day');
    RAISE EXCEPTION 'Tenant isolation failure: cross-tenant viewing/lead reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- A viewing cannot be assigned to an agent outside its tenant.
  BEGIN
    INSERT INTO property_viewings (tenant_id, property_id, agent_id, visitor_name, scheduled_at)
    VALUES (tenant_a, property_a, user_b, 'Foreign agent viewing', now() + interval '1 day');
    RAISE EXCEPTION 'Tenant isolation failure: foreign workspace viewing agent was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- Creator references must also be members of the record's tenant.
  BEGIN
    INSERT INTO properties (tenant_id, title, slug, price, created_by)
    VALUES (tenant_a, 'Foreign creator', 'foreign-creator', 1000000, user_b);
    RAISE EXCEPTION 'Tenant isolation failure: foreign workspace property creator was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- Saved-property records cannot claim another tenant's property.
  BEGIN
    INSERT INTO saved_properties (tenant_id, user_id, property_id)
    VALUES (tenant_b, user_b, property_a);
    RAISE EXCEPTION 'Tenant isolation failure: cross-tenant saved property was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;


  -- A workspace with two owners may demote one, but never its final active owner.
  UPDATE tenant_memberships
     SET role = 'agent'
   WHERE tenant_id = tenant_a AND user_id = user_a;

  BEGIN
    UPDATE tenant_memberships
       SET status = 'suspended'
     WHERE tenant_id = tenant_a AND user_id = user_c;
    RAISE EXCEPTION 'Owner protection failure: final active owner was suspended';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Public enquiry rate-limit buckets increment atomically for the same key.
  INSERT INTO public_enquiry_rate_limits (bucket_key, window_started_at, request_count, expires_at)
  VALUES (rate_key, now(), 1, now() + interval '10 minutes');

  INSERT INTO public_enquiry_rate_limits (bucket_key, window_started_at, request_count, expires_at)
  VALUES (rate_key, now(), 1, now() + interval '10 minutes')
  ON CONFLICT (bucket_key) DO UPDATE
    SET request_count = public_enquiry_rate_limits.request_count + 1,
        expires_at = now() + interval '10 minutes';

  SELECT request_count INTO rate_count
    FROM public_enquiry_rate_limits WHERE bucket_key = rate_key;
  IF rate_count <> 2 THEN
    RAISE EXCEPTION 'Rate limit failure: expected atomic count 2, got %', rate_count;
  END IF;
  DELETE FROM public_enquiry_rate_limits WHERE bucket_key = rate_key;

  RAISE NOTICE 'Tenant integrity checks passed for isolated workspaces % and %', tenant_a, tenant_b;
END $$;
