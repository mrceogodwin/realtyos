-- Persisted, tenant-scoped public enquiry rate-limit buckets.
BEGIN;

CREATE TABLE public_enquiry_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX public_enquiry_rate_limits_expiry_idx
  ON public_enquiry_rate_limits (expires_at);

COMMIT;
