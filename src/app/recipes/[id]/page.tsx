import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { RecipeWithIngredients } from "@/lib/types";
import { RecipeModifier } from "@/components/recipe-modifier";
import { VoiceCookingAssistant } from "@/components/voice-cooking-assistant";
import { ArrowLeft, Clock, Flame, Dumbbell, Wheat as WheatIcon, Droplets } from "lucide-react";

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getRecipe(id: string): Promise<RecipeWithIngredients | null> {
  const supabase = await createClient();
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(`
      *,
      ingredients (*),
      profiles (username, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error || !recipe) {
    return null;
  }

  return recipe;
}

export async function generateMetadata({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  return {
    title: recipe ? `${recipe.title} | Dynamic Recipe App` : "Recipe Not Found",
    description: recipe?.description || "View recipe details",
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  const macros = recipe.macros || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Flame className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">{recipe.title}</h1>
          {recipe.profiles && (
            <p className="text-muted-foreground">
              By {recipe.profiles.username}
            </p>
          )}
          {recipe.description && (
            <p className="text-lg text-muted-foreground">{recipe.description}</p>
          )}
        </div>
      </div>

      {/* AI Recipe Modifier */}
      <RecipeModifier
        recipe={{
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions,
          ingredients: recipe.ingredients || [],
        }}
      />

      {/* Macros */}
      {Object.keys(macros).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MacroCard
            icon={Flame}
            label="Calories"
            value={macros.calories}
            unit="kcal"
          />
          <MacroCard
            icon={Dumbbell}
            label="Protein"
            value={macros.protein}
            unit="g"
          />
          <MacroCard
            icon={WheatIcon}
            label="Carbs"
            value={macros.carbs}
            unit="g"
          />
          <MacroCard
            icon={Droplets}
            label="Fat"
            value={macros.fat}
            unit="g"
          />
        </div>
      )}

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Ingredients</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-muted-foreground ml-auto">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions with Voice Control */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Instructions</h2>
        <VoiceCookingAssistant instructions={recipe.instructions} />
      </div>
    </div>
  );
}

function MacroCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  value?: number;
  unit: string;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">
          {value} {unit}
        </p>
      </div>
    </div>
  );
}
