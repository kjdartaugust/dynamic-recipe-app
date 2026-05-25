import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import CreateRecipeForm from "./form";

export default async function CreateRecipePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("[CREATE-SERVER] cookies present:", allCookies.length, "names:", allCookies.map(c => c.name).join(","));

  const supabase = await createClient();
  // Use getSession: reads from cookies (no network call). Proxy already refreshed stale tokens.
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[CREATE-SERVER] getSession result:", session ? `user=${session.user.email}` : "null");

  if (!session?.user) {
    console.log("[CREATE-SERVER] redirecting to /login");
    redirect("/login");
  }

  return <CreateRecipeForm userId={session.user.id} />;
}

  return <CreateRecipeForm userId={session.user.id} />;
}
