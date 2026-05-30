import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { RecipeWithIngredients, Tag } from "@/lib/types";
import { RecipeModifier } from "@/components/recipe-modifier";
import { TagDisplay } from "@/components/tag-display";
import { AddToShoppingList } from "@/components/add-to-shopping-list";
import { RecipeRatings } from "@/components/recipe-ratings";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { RecipeInstructions } from "@/components/recipe-instructions";
import { RecipeCacheWrapper } from "@/components/recipe-cache-wrapper";
import { ArrowLeft, Clock, Flame, Dumbbell, Wheat as WheatIcon, Droplets, Tag as TagIcon, Star } from "lucide-react";
import { RecipeImage } from "@/components/recipe-image";
import { AddToCollectionButton } from "@/components/add-to-collection";

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

async function getRecipeTags(recipeId: string): Promise<Tag[]> {
  const supabase = await createClient();
  const { data: recipeTags, error } = await supabase
    .from("recipe_tags")
    .select("tags(id, name, slug)")
    .eq("recipe_id", recipeId);

  if (error || !recipeTags) return [];
  return recipeTags.map((rt: any) => rt.tags);
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

  const tags = await getRecipeTags(id);
  const macros = recipe.macros || {};

  // Check if current user is the owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === recipe.user_id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Auto-cache recipe for offline view */}
      <RecipeCacheWrapper recipe={{
        id: recipe.id,
        title: recipe.title,
        description: recipe.description || "",
        instructions: recipe.instructions || "",
        ingredients: recipe.ingredients || [],
        prep_time: recipe.prep_time || 0,
        cook_time: recipe.cook_time || 0,
        servings: recipe.servings || 1,
        difficulty: recipe.difficulty || "Easy",
        image_url: recipe.image_url || undefined,
      }} />

      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="space-y-6">
        <div className="aspect-video rounded-2xl overflow-hidden gradient-bg-hero relative">
          <RecipeImage
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full"
          />
        </div>

        {recipe.description && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Tags & Visibility */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {tags.length > 0 && (
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-orange-400" />
              <TagDisplay tags={tags} size="md" clickable />
            </div>
          )}
          <VisibilityToggle
            recipeId={recipe.id}
            initialIsPublic={recipe.is_public || false}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* AI Recipe Modifier - only for authenticated users */}
      {user && (
        <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
          <RecipeModifier
            recipe={{
              id: recipe.id,
              title: recipe.title,
              description: recipe.description,
              instructions: recipe.instructions,
              ingredients: recipe.ingredients || [],
            }}
          />
        </div>
      )}

      {/* Macros */}
      {Object.keys(macros).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MacroCard
            icon={Flame}
            label="Calories"
            value={macros.calories}
            unit="kcal"
            color="from-orange-500 to-red-500"
          />
          <MacroCard
            icon={Dumbbell}
            label="Protein"
            value={macros.protein}
            unit="g"
            color="from-red-500 to-pink-500"
          />
          <MacroCard
            icon={WheatIcon}
            label="Carbs"
            value={macros.carbs}
            unit="g"
            color="from-amber-500 to-orange-500"
          />
          <MacroCard
            icon={Droplets}
            label="Fat"
            value={macros.fat}
            unit="g"
            color="from-yellow-500 to-amber-500"
          />
        </div>
      )}

      {/* Ingredients with Add to Shopping List */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-text">Ingredients</h2>
            <AddToShoppingList
              recipeId={recipe.id}
              recipeTitle={recipe.title}
              ingredients={recipe.ingredients}
            />
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recipe.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50/50 to-transparent rounded-xl border border-orange-100 hover:border-orange-300 transition-colors"
              >
                <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0" />
                <span className="font-medium text-foreground">{ingredient.name}</span>
                <span className="text-muted-foreground ml-auto text-sm">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <RecipeInstructions instructions={recipe.instructions} />

      {/* Ratings & Reviews */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          Ratings & Reviews
        </h2>
        <RecipeRatings recipeId={recipe.id} />
      </div>
    </div>
  );
}

function MacroCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value?: number;
  unit: string;
  color: string;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-orange-100 warm-shadow hover:warm-shadow-lg transition-shadow">
      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-lg">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
    </div>
  );
}
