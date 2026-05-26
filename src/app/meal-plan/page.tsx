"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Save,
  Trash2,
  Search,
  Loader2,
  ChefHat,
  Flame,
  Check,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
}

interface MealSlot {
  day: string;
  mealType: string;
  recipeId: string | null;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🥨",
};

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function MealPlannerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meals, setMeals] = useState<Record<string, Record<string, string | null>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draggedRecipe, setDraggedRecipe] = useState<string | null>(null);
  const [isGeneratingList, setIsGeneratingList] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchRecipes();
  }, [user, router]);

  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [weekStart, user]);

  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes");
      const data = await response.json();
      if (response.ok) {
        // Fetch public + user's recipes
        const allRecipes = [
          ...(data.recipes || []),
          ...(data.publicRecipes || []),
        ];
        // Deduplicate by id
        const unique = allRecipes.filter(
          (r: Recipe, i: number, arr: Recipe[]) =>
            arr.findIndex((x) => x.id === r.id) === i
        );
        setRecipes(unique);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    }
  };

  const fetchMealPlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meal-plan?weekStart=${weekStart}`);
      const data = await response.json();
      if (response.ok && data.mealPlan) {
        setMeals(data.mealPlan.meals || {});
      } else {
        setMeals({});
      }
    } catch (error) {
      console.error("Failed to fetch meal plan:", error);
      setMeals({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, meals }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Meal plan saved!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error(data.error || "Failed to save");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear all meals for this week?")) return;
    setMeals({});
    try {
      await fetch(`/api/meal-plan?weekStart=${weekStart}`, { method: "DELETE" });
      setMessage("Meal plan cleared");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to clear meal plan:", error);
    }
  };

  const handleGenerateShoppingList = async () => {
    setIsGeneratingList(true);
    try {
      const response = await fetch("/api/meal-plan/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate list");
      }

      // Add items to shopping list
      const addResponse = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: data.items }),
      });

      if (!addResponse.ok) {
        const addData = await addResponse.json();
        throw new Error(addData.error || "Failed to add to shopping list");
      }

      setMessage("Shopping list generated! Redirecting...");
      setTimeout(() => router.push("/shopping-list"), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate list");
    } finally {
      setIsGeneratingList(false);
    }
  };

  const handleDragStart = (recipeId: string) => {
    setDraggedRecipe(recipeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: string, mealType: string) => {
    if (!draggedRecipe) return;
    setMeals((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [mealType]: draggedRecipe,
      },
    }));
    setDraggedRecipe(null);
  };

  const handleRemoveMeal = (day: string, mealType: string) => {
    setMeals((prev) => {
      const dayMeals = { ...(prev[day] || {}) };
      delete dayMeals[mealType];
      return { ...prev, [day]: dayMeals };
    });
  };

  const getRecipeById = (id: string | null) => {
    if (!id) return null;
    return recipes.find((r) => r.id === id);
  };

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const prevWeek = () => setWeekStart((ws) => addDays(ws, -7));
  const nextWeek = () => setWeekStart((ws) => addDays(ws, 7));

  const weekRange = `${new Date(weekStart).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${new Date(addDays(weekStart, 6)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-500" />
              Meal Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan your week and generate shopping lists automatically
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-orange-600" />
            </button>
            <span className="text-sm font-medium px-4 py-2 bg-white rounded-lg border border-orange-200">
              {weekRange}
            </span>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-orange-600" />
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={cn(
              "mb-6 p-4 rounded-xl flex items-center gap-3",
              message.includes("saved") || message.includes("generated")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            )}
          >
            {message.includes("saved") || message.includes("generated") ? (
              <Check className="h-5 w-5" />
            ) : (
              <Flame className="h-5 w-5" />
            )}
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar - Recipe Library */}
          <div className="space-y-4">
            <div className="card-gradient rounded-2xl p-4 border border-orange-100">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" />
                Your Recipes
              </h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-orange-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredRecipes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recipes found
                  </p>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      draggable
                      onDragStart={() => handleDragStart(recipe.id)}
                      className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-orange-100 cursor-grab hover:shadow-md hover:border-orange-300 transition-all active:cursor-grabbing"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Flame className="h-5 w-5 text-orange-300" />
                        )}
                      </div>
                      <span className="text-sm font-medium line-clamp-1">
                        {recipe.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Plan
              </button>
              <button
                onClick={handleGenerateShoppingList}
                disabled={isGeneratingList}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 disabled:opacity-50 transition-colors"
              >
                {isGeneratingList ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Generate Shopping List
              </button>
              <button
                onClick={handleClear}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear Week
              </button>
            </div>
          </div>

          {/* Main - Week Grid */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <div key={day} className="space-y-2">
                    {/* Day Header */}
                    <div className="text-center py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white">
                      <div className="text-xs font-medium uppercase opacity-80">
                        {day.slice(0, 3)}
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(addDays(weekStart, DAYS.indexOf(day))).getDate()}
                      </div>
                    </div>

                    {/* Meal Slots */}
                    {MEAL_TYPES.map((mealType) => {
                      const recipeId = meals[day]?.[mealType] || null;
                      const recipe = getRecipeById(recipeId);

                      return (
                        <div
                          key={`${day}-${mealType}`}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(day, mealType)}
                          className={cn(
                            "min-h-[80px] p-2 rounded-xl border-2 border-dashed transition-all",
                            recipe
                              ? "bg-white border-orange-300 shadow-sm"
                              : "bg-orange-50/50 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                          )}
                        >
                          <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1 flex items-center gap-1">
                            <span>{MEAL_ICONS[mealType]}</span>
                            {mealType}
                          </div>
                          {recipe ? (
                            <div className="relative group">
                              <div className="text-xs font-medium line-clamp-2 text-foreground">
                                {recipe.title}
                              </div>
                              <button
                                onClick={() => handleRemoveMeal(day, mealType)}
                                className="absolute -top-1 -right-1 p-0.5 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/60 text-center py-2">
                              Drop recipe
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
