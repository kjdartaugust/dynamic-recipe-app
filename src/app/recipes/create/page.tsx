"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { IngredientScanner } from "@/components/ingredient-scanner";
import { ArrowLeft, Plus, Trash2, ChefHat } from "lucide-react";

const supabase = createClient();

interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
}

export default function CreateRecipePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: "", amount: "", unit: "" },
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleIngredientsScanned = (scanned: Array<{ name: string; amount: number; unit: string }>) => {
    const newIngredients = scanned.map((ing) => ({
      name: ing.name,
      amount: String(ing.amount),
      unit: ing.unit,
    }));
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in to create a recipe");
        return;
      }

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          instructions,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create ingredients
      const validIngredients = ingredients.filter(
        (ing) => ing.name && ing.amount && ing.unit
      );

      if (validIngredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from("ingredients")
          .insert(
            validIngredients.map((ing) => ({
              recipe_id: recipe.id,
              name: ing.name,
              amount: parseFloat(ing.amount),
              unit: ing.unit,
            }))
          );

        if (ingredientsError) throw ingredientsError;
      }

      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">Create Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Recipe Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grandma's Apple Pie"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* AI Ingredient Scanner */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">AI Ingredient Scanner</h2>
          <IngredientScanner onIngredientsScanned={handleIngredientsScanned} />
        </div>

        {/* Ingredients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ingredients</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Ingredient
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex gap-3 items-start p-3 border border-border rounded-lg"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) =>
                      updateIngredient(index, "name", e.target.value)
                    }
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={ingredient.amount}
                    onChange={(e) =>
                      updateIngredient(index, "amount", e.target.value)
                    }
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Unit (g, ml, cup, etc.)"
                    value={ingredient.unit}
                    onChange={(e) =>
                      updateIngredient(index, "unit", e.target.value)
                    }
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <label htmlFor="instructions" className="text-sm font-medium">
            Instructions *
          </label>
          <textarea
            id="instructions"
            required
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step instructions..."
            rows={10}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChefHat className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Recipe"}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
