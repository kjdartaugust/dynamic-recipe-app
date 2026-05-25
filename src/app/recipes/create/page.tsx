import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CreateRecipeForm from "./form";

export default async function CreateRecipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CreateRecipeForm userId={user.id} />;
}
