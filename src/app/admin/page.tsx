import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminDashboard } from "./dashboard";

// Server-side gate. The /api/admin/* routes each re-check requireAdmin(), so
// this is defence in depth rather than the only thing standing in the way —
// a page-level check alone would leave the APIs open.
export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) notFound();

  return <AdminDashboard />;
}
