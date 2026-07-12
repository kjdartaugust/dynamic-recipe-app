import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createAdminClient,
  isAdminClientConfigured,
  detectServiceRoleKeyRole,
} from "@/lib/supabase-admin";

interface CronRun {
  job: string;
  ran_at: string;
  ok: boolean;
  sent: number;
  detail: string | null;
}

// Gated replacement for the old public /api/debug/env, which leaked the
// Gemini key prefix, its length, and an inventory of every secret env var
// name to anyone on the internet.
//
// This reports only *whether* each key is set. Never return key material,
// prefixes, or lengths — a prefix plus a length is a real head start for
// an attacker.
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    groqApiKey: !!process.env.GROQ_API_KEY,
    openRouterApiKey: !!process.env.OPENROUTER_API_KEY,
    resendApiKey: !!process.env.RESEND_API_KEY,
    fromEmail: !!process.env.FROM_EMAIL,
    vapidPublicKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
    cronSecret: !!process.env.CRON_SECRET,
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
  };

  // This endpoint must keep working when the service-role key is missing —
  // that is precisely the failure it exists to diagnose. So report `env`
  // first and degrade the rest, rather than constructing the admin client
  // up front and throwing before we can tell anyone what's wrong.
  if (!isAdminClientConfigured()) {
    return NextResponse.json({
      env,
      crons: [],
      recentRuns: [],
      degraded:
        "SUPABASE_SERVICE_ROLE_KEY is not set for this environment. Add it in " +
        "Vercel → Settings → Environment Variables (tick Preview as well as " +
        "Production), then redeploy — env vars are baked in at build time.",
    });
  }

  const role = detectServiceRoleKeyRole();
  if (role !== null && role !== "service_role") {
    return NextResponse.json({
      env,
      crons: [],
      recentRuns: [],
      degraded:
        `SUPABASE_SERVICE_ROLE_KEY holds a "${role}" key, not the service_role key. ` +
        `That is why every tab reports "permission denied". In Supabase → Settings → ` +
        `API, copy the key labelled service_role (secret, behind a Reveal button), ` +
        `then redeploy.`,
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cron_runs")
    .select("job, ran_at, ok, sent, detail")
    .order("ran_at", { ascending: false })
    .limit(20);

  // Don't swallow this: if the query fails (e.g. migration 013 was never
  // run), reporting "never run" would look identical to a healthy app whose
  // crons simply haven't fired yet.
  if (error) {
    console.error("[ADMIN HEALTH] cron_runs query failed:", error);
    return NextResponse.json({
      env,
      crons: [],
      recentRuns: [],
      degraded: `Could not read cron history: ${error.message}`,
    });
  }

  const runs: CronRun[] = data ?? [];

  // Latest run per job — rows come back newest-first, so the first hit wins.
  const latest = new Map<string, CronRun>();
  for (const run of runs) {
    if (!latest.has(run.job)) latest.set(run.job, run);
  }

  return NextResponse.json({
    env,
    crons: ["notifications/email", "notifications/push"].map((job) => ({
      job,
      lastRun: latest.get(job) ?? null,
    })),
    recentRuns: runs ?? [],
  });
}
