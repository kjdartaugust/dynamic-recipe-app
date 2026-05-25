import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CreateRecipeForm from "./form";

export default async function CreateRecipePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <CreateRecipeForm userId={session.user.id} />;
}
