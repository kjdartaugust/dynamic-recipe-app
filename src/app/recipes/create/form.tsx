"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { IngredientScanner } from "@/components/ingredient-scanner";
import { ImageUpload } from "@/components/image-upload";
import { ArrowLeft, Plus, Trash2, ChefHat, Clock, Users, Flame } from "lucide-react";

const supabase = createClient();

interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
}

interface Category {
  id: string;
  name: string;
}

export default function CreateRecipeForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: "", amount: "", unit: "" },
  ]);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (data) setCategories(data);
    }
    loadCategories();
  }, []);

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
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: userId,
          title,
          description: description || null,
          instructions,
          image_url: imageUrl || null,
          category_id: categoryId || null,
          prep_time: prepTime ? parseInt(prepTime) : null,
          cook_time: cookTime ? parseInt(cookTime) : null,
          servings: servings ? parseInt(servings) : null,
          difficulty: difficulty || null,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

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
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold gradient-text">Create Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image Upload */}
        <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recipe Photo</h2>
          <ImageUpload onImageUploaded={setImageUrl} />
        </div>

        {/* Basic Info */}
        <div className="p-6 bg-white rounded-xl border border-orange-100 space-y-6">
          <h2 className="text-xl font-semibold gradient-text">Basic Information</h2>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Recipe Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grandma's Apple Pie"
              className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe..."
              rows={3}
              className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-foreground">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="difficulty" className="text-sm font-medium text-foreground">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="prepTime" className="text-sm font-medium flex items-center gap-1 text-foreground">
                <Clock className="h-3.5 w-3.5 text-orange-400" /> Prep Time (min)
              </label>
              <input
                id="prepTime"
                type="number"
                min="0"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cookTime" className="text-sm font-medium flex items-center gap-1 text-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-400" /> Cook Time (min)
              </label>
              <input
                id="cookTime"
                type="number"
                min="0"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30"
                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="servings" className="text-sm font-medium flex items-center gap-1 text-foreground">
                <Users className="h-3.5 w-3.5 text-orange-400" /> Servings
              </label>
              <input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="4"
                className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* AI Ingredient Scanner */}
        <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 space-y-4">
          <h2 className="text-xl font-semibold gradient-text">AI Ingredient Scanner</h2>
          <IngredientScanner onIngredientsScanned={handleIngredientsScanned} />
        </div>

        {/* Ingredients */}
        <div className="p-6 bg-white rounded-xl border border-orange-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold gradient-text">Ingredients</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Ingredient
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex gap-3 items-start p-4 bg-orange-50/50 rounded-xl border border-orange-100"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) =>
                      updateIngredient(index, "name", e.target.value)
                    }
                    className="px-4 py-2 border border-orange-200 rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={ingredient.amount}
                    onChange={(e) =>
                      updateIngredient(index, "amount", e.target.value)
                    }
                    className="px-4 py-2 border border-orange-200 rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Unit (g, ml, cup, etc.)"
                    value={ingredient.unit}
                    onChange={(e) =>
                      updateIngredient(index, "unit", e.target.value)
                    }
                    className="px-4 py-2 border border-orange-200 rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                </div>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
        <div className="p-6 bg-white rounded-xl border border-orange-100 space-y-4">
          <label htmlFor="instructions" className="text-sm font-medium text-foreground block">
            Instructions *
          </label>
          <textarea
            id="instructions"
            required
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step instructions..."
            rows={10}
            className="w-full px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3 btn-gradient text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChefHat className="h-5 w-5" />
            {isSubmitting ? "Creating..." : "Create Recipe"}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-3 border border-orange-200 rounded-xl font-medium hover:bg-orange-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
