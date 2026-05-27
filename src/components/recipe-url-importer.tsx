"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, X, Loader2, Check, AlertTriangle, ExternalLink } from "lucide-react";

interface ImportedRecipe {
  title: string;
  description: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  macros?: { calories: number; protein: number; carbs: number; fat: number };
}

interface RecipeUrlImporterProps {
  onClose: () => void;
}

export function RecipeUrlImporter({ onClose }: RecipeUrlImporterProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"input" | "fetching" | "preview" | "saving">("input");
  const [recipe, setRecipe] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!url.trim()) return;
    setStep("fetching");
    setError("");

    try {
      const response = await fetch("/api/ai/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import recipe");
      }

      setRecipe(data.recipe);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to fetch recipe");
      setStep("input");
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    setStep("saving");

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions,
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients,
          macros: recipe.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save recipe");
      }

      router.push(`/recipes/${data.recipe.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save recipe");
      setStep("preview");
    }
  };

  const updateIngredient = (index: number, field: string, value: string | number) => {
    if (!recipe) return;
    const updated = { ...recipe };
    updated.ingredients = updated.ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    );
    setRecipe(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg text-white">
              <Link2 className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-lg">Import from URL</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "input" && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Paste a recipe URL from any website. AI will extract the title, ingredients, and instructions.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/recipe..."
                    className="flex-1 px-4 py-3 border border-orange-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  />
                  <button
                    onClick={handleFetch}
                    disabled={!url.trim()}
                    className="px-4 py-3 btn-gradient text-white rounded-xl font-medium disabled:opacity-50 flex-shrink-0"
                  >
                    Fetch
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Supported sites:</p>
                <p className="text-xs text-blue-600">
                  AllRecipes, Food Network, Bon Appétit, NYT Cooking, BBC Good Food, and any recipe blog.
                </p>
              </div>
            </div>
          )}

          {step === "fetching" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="font-medium text-foreground">Fetching recipe...</p>
              <p className="text-sm text-muted-foreground mt-1">Extracting ingredients and instructions</p>
            </div>
          )}

          {step === "preview" && recipe && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={recipe.title}
                  onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={recipe.description}
                  onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Meta */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Prep (min)</label>
                  <input
                    type="number"
                    value={recipe.prepTime}
                    onChange={(e) => setRecipe({ ...recipe, prepTime: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cook (min)</label>
                  <input
                    type="number"
                    value={recipe.cookTime}
                    onChange={(e) => setRecipe({ ...recipe, cookTime: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Servings</label>
                  <input
                    type="number"
                    value={recipe.servings}
                    onChange={(e) => setRecipe({ ...recipe, servings: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                  <select
                    value={recipe.difficulty}
                    onChange={(e) => setRecipe({ ...recipe, difficulty: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Ingredients ({recipe.ingredients.length})
                </label>
                <div className="space-y-2">
                  {recipe.ingredients.map((ing, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(index, "name", e.target.value)}
                        placeholder="Ingredient"
                        className="flex-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="number"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(index, "amount", parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="w-20 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                        placeholder="unit"
                        className="w-24 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Instructions</label>
                <textarea
                  value={recipe.instructions}
                  onChange={(e) => setRecipe({ ...recipe, instructions: e.target.value })}
                  rows={6}
                  className="w-full mt-1 px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          )}

          {step === "saving" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="font-medium text-foreground">Saving recipe...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && recipe && (
          <div className="p-4 border-t border-orange-100 bg-white flex gap-3">
            <button
              onClick={() => setStep("input")}
              className="px-4 py-2.5 border border-orange-200 text-muted-foreground rounded-xl font-medium text-sm hover:bg-orange-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-medium"
            >
              <Check className="h-4 w-4" />
              Save to My Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
