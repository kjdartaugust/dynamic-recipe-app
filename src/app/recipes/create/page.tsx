import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import CreateRecipeForm from "./form";

export default async function CreateRecipePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("[CREATE-SERVER] cookies present:", allCookies.length, "names:", allCookies.map(c => c.name).join(","));

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("[CREATE-SERVER] getUser result:", user ? `user=${user.email}` : "null", error ? `error=${error.message}` : "no error");

  if (!user) {
    console.log("[CREATE-SERVER] redirecting to /login");
    redirect("/login");
  }

  return <CreateRecipeForm userId={user.id} />;
}
