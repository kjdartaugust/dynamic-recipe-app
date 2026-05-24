"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Loader2, X, Check } from "lucide-react";

interface RecipeModifierProps {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    instructions: string;
    ingredients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
}

export function RecipeModifier({ recipe }: RecipeModifierProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [modifier, setModifier] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedRecipe, setModifiedRecipe] = useState<any>(null);

  const handleModify = async () => {
    if (!modifier.trim()) return;

    setIsModifying(true);

    try {
      const recipeString = `
Title: ${recipe.title}
Description: ${recipe.description || "N/A"}
Ingredients:
${recipe.ingredients.map((i) => `- ${i.amount} ${i.unit} ${i.name}`).join("\n")}
Instructions:
${recipe.instructions}
      `.trim();

      const response = await fetch("/api/ai/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: recipeString,
          modifiers: modifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to modify recipe");
      }

      setModifiedRecipe(data.recipe);
    } catch (error) {
      console.error("Modify error:", error);
      alert(error instanceof Error ? error.message : "Failed to modify recipe");
    } finally {
      setIsModifying(false);
    }
  };

  const handleSaveModified = async () => {
    if (!modifiedRecipe) return;

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: modifiedRecipe.title,
          description: modifiedRecipe.description,
          instructions: modifiedRecipe.instructions,
          ingredients: modifiedRecipe.ingredients,
          macros: modifiedRecipe.macros,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save recipe");
      }

      const data = await response.json();
      router.push(`/recipes/${data.id}`);
    } catch (error) {
      alert("Failed to save modified recipe");
    }
  };

  const suggestions = [
    "Make it vegan",
    "Double the portions",
    "Make it gluten-free",
    "Reduce calories",
    "Make it spicy",
    "Simplify for beginners",
  ];

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
      >
        <Wand2 className="h-4 w-4" />
        Modify with AI
      </button>

      {isOpen && (
        <div className="mt-4 p-4 border border-border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI Recipe Modifier</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                setModifiedRecipe(null);
              }}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!modifiedRecipe ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  How would you like to modify this recipe?
                </label>
                <input
                  type="text"
                  value={modifier}
                  onChange={(e) => setModifier(e.target.value)}
                  placeholder="e.g., Make it vegan, double portions..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setModifier(s)}
                    className="px-3 py-1 text-sm border border-border rounded-full hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={handleModify}
                disabled={isModifying || !modifier.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isModifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Modifying...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Modify Recipe
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <h4 className="font-semibold text-lg">{modifiedRecipe.title}</h4>
                {modifiedRecipe.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {modifiedRecipe.description}
                  </p>
                )}
              </div>

              <div>
                <h5 className="font-medium mb-2">Modified Ingredients</h5>
                <ul className="space-y-1">
                  {modifiedRecipe.ingredients.map((ing: any, i: number) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary" />
                      {ing.amount} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              {modifiedRecipe.macros && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(modifiedRecipe.macros).map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="font-semibold">{value as number}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveModified}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Save as New Recipe
                </button>
                <button
                  onClick={() => setModifiedRecipe(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
