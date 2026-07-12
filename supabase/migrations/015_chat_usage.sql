-- ============================================================
-- 015: Durable chat usage accounting
-- Run this by hand in the Supabase SQL Editor.
-- ============================================================
--
-- /api/chat had no auth and no rate limit. The 3-message guest cap lived
-- entirely in the browser (recipe-chatbot.tsx), so the endpoint was in
-- practice a free, unauthenticated, general-purpose LLM proxy billed to our
-- Groq account. These get scanned for.
--
-- src/lib/rate-limit.ts can't fix this on its own: it's an in-memory Map, so
-- on serverless every instance keeps its own counter and the limit is
-- per-instance, not per-user. A guest cap has to be durable and shared, so
-- it lives in Postgres.

CREATE TABLE IF NOT EXISTS public.chat_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 'user:<uuid>' for signed-in users, 'ip:<sha256>' for guests.
    -- Guest IPs are hashed with CHAT_IP_SALT — we rate-limit by network
    -- identity without storing anyone's raw IP address.
    identity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_usage_identity_created_at_idx
    ON public.chat_usage (identity, created_at DESC);

ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (which bypasses RLS) may read or write.
-- A user must never be able to delete their own rows to reset their quota.
REVOKE ALL ON public.chat_usage FROM anon, authenticated;

COMMENT ON TABLE public.chat_usage IS 'Durable per-identity chat message accounting. Enforces the guest trial cap and the signed-in abuse ceiling across serverless instances.';
