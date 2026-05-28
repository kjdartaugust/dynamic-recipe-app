"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import {
  Refrigerator,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ChefHat,
  Clock,
  Users,
  Sparkles,
  Camera,
  Wand2,
  ArrowRight,
  Flame,
  Leaf,
  Thermometer,
  Scan,
} from "lucide-react";
import { FridgeScanner } from "@/components/fridge-scanner";
import { RecipeImage } from "@/components/recipe-image";

interface FridgeItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  expiry_date: string | null;
  category: string;
  created_at: string;
}

interface RecipeSuggestion {
  title: string;
  description: string;
  usesIngredients: string[];
  allIngredients: Array<{ name: string; amount: number; unit: string }>;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  tags: string[];
  imageUrl: string;
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  return Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getExpiryColor(days: number | null): string {
  if (days === null) return "text-muted-foreground";
  if (days < 0) return "text-red-600 bg-red-50 border-red-200";
  if (days <= 2) return "text-orange-600 bg-orange-50 border-orange-200";
  if (days <= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-green-600 bg-green-50 border-green-200";
}

function getExpiryLabel(days: number | null): string {
  if (days === null) return "No expiry";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  return `${days}d left`;
}

export default function KitchenHubPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"inventory" | "suggestions">("inventory");
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isGeneratingFull, setIsGeneratingFull] = useState<RecipeSuggestion | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // Add item form
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("piece");
  const [expiryDate, setExpiryDate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchItems();
  }, [user, isLoading, router]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/fridge");
      const data = await response.json();
      if (response.ok) {
        setItems(data.items);
        // Immediately update navigation badge
        const countRes = await fetch("/api/fridge/expiring-count");
        const countData = await countRes.json();
        if (typeof countData.count === "number") {
          window.dispatchEvent(
            new CustomEvent("fridge-updated", { detail: { count: countData.count } })
          );
        }
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  const generateSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestionsError("");
    try {
      const response = await fetch("/api/fridge/suggestions");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `AI service error: ${response.status}`);
      }
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setActiveTab("suggestions");
      } else {
        throw new Error("No suggestions returned");
      }
    } catch (error: any) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestionsError(error.message || "Failed to generate recipe suggestions. Please try again.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsAdding(true);
    try {
      const response = await fetch("/api/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: amount ? parseFloat(amount) : null,
          unit: unit || "piece",
          expiry_date: expiryDate || null,
          category: "other",
        }),
      });
      if (response.ok) {
        setName(""); setAmount(""); setUnit("piece"); setExpiryDate("");
        setShowAddForm(false);
        await fetchItems();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await fetch(`/api/fridge?id=${id}`, { method: "DELETE" });
      await fetchItems();
    } finally {
      setIsDeleting(null);
    }
  };

  const handleScannedItems = async (scannedItems: Array<{ name: string; amount: number | null; unit: string; expiry_date: string | null }>) => {
    let added = 0;
    for (const item of scannedItems) {
      try {
        const response = await fetch("/api/fridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            expiry_date: item.expiry_date,
            category: "other",
          }),
        });
        if (response.ok) added++;
      } catch (error) {
        console.error("Failed to add scanned item:", item.name, error);
      }
    }
    await fetchItems();
    setShowScanner(false);
  };

  const handleCreateRecipe = async (suggestion: RecipeSuggestion) => {
    setIsGeneratingFull(suggestion);
    try {
      const response = await fetch("/api/ai/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: suggestion.allIngredients }),
      });
      const data = await response.json();
      if (response.ok && data.recipe) {
        const params = new URLSearchParams();
        params.set("rescue", JSON.stringify(data.recipe));
        router.push(`/recipes/create?${params.toString()}`);
      }
    } finally {
      setIsGeneratingFull(null);
    }
  };

  if (!user) return null;

  const expiringItems = items.filter((item) => {
    const days = getDaysUntilExpiry(item.expiry_date);
    return days !== null && days <= 3;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg mb-4">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">My Kitchen</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Track what you have, discover what to cook, and never waste food again
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-4 border border-orange-100 text-center">
            <div className="text-2xl font-bold text-orange-600">{items.length}</div>
            <div className="text-xs text-muted-foreground">Items tracked</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-100 text-center">
            <div className={`text-2xl font-bold ${expiringItems.length > 0 ? "text-red-600" : "text-green-600"}`}>
              {expiringItems.length}
            </div>
            <div className="text-xs text-muted-foreground">Expiring soon</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{suggestions.length}</div>
            <div className="text-xs text-muted-foreground">AI suggestions</div>
          </div>
        </div>

        {/* Action Bar */}
        {expiringItems.length > 0 && (
          <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-800">
                  {expiringItems.length} item{expiringItems.length > 1 ? "s" : ""} expiring soon!
                </p>
                <p className="text-sm text-orange-600">
                  {expiringItems.slice(0, 3).map((i) => i.name).join(", ")}
                </p>
              </div>
              <button
                onClick={generateSuggestions}
                disabled={isLoadingSuggestions}
                className="inline-flex items-center gap-2 px-4 py-2 btn-gradient text-white rounded-xl font-medium text-sm disabled:opacity-50 flex-shrink-0"
              >
                {isLoadingSuggestions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Find Recipes
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              activeTab === "inventory"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                : "bg-white text-muted-foreground border border-orange-100 hover:bg-orange-50"
            }`}
          >
            <Refrigerator className="h-4 w-4" />
            My Inventory ({items.length})
          </button>
          <button
            onClick={() => { if (suggestions.length === 0) generateSuggestions(); else setActiveTab("suggestions"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              activeTab === "suggestions"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                : "bg-white text-muted-foreground border border-orange-100 hover:bg-orange-50"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Recipe Ideas
            {suggestions.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {suggestions.length}
              </span>
            )}
          </button>
        </div>

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Add / Scan Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-3 border-2 border-dashed border-orange-200 rounded-xl text-orange-600 font-medium hover:bg-orange-50 hover:border-orange-300 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {showAddForm ? "Cancel" : "Add Item"}
              </button>
              <button
                onClick={() => setShowScanner(true)}
                className="py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-medium hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
              >
                <Scan className="h-5 w-5" />
                Scan Fridge
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="card-gradient rounded-2xl p-6 border border-orange-100">
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Item name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Tomatoes"
                      required
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1"
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {["piece", "g", "kg", "ml", "l", "cup", "tbsp", "tsp", "oz", "lb"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Expires</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 btn-gradient text-white rounded-xl font-medium disabled:opacity-50"
                    >
                      {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/recipes/create")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                Create Custom Recipe
              </button>
              <button
                onClick={generateSuggestions}
                disabled={isLoadingSuggestions || items.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {isLoadingSuggestions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Get AI Suggestions
              </button>
            </div>

            {/* Items Grid */}
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your kitchen is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Add ingredients to get AI recipe suggestions and expiry alerts
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto text-left">
                  <ol className="text-sm text-blue-600 list-decimal list-inside space-y-1">
                    <li>Add what you have in your fridge or pantry</li>
                    <li>Set expiry dates for perishables</li>
                    <li>Get notified when things expire</li>
                    <li>Discover AI-generated recipes using what you have</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items
                  .sort((a, b) => {
                    const da = getDaysUntilExpiry(a.expiry_date) ?? 999;
                    const db = getDaysUntilExpiry(b.expiry_date) ?? 999;
                    return da - db;
                  })
                  .map((item) => {
                    const days = getDaysUntilExpiry(item.expiry_date);
                    const colorClass = getExpiryColor(days);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-orange-100 hover:border-orange-300 transition-all group"
                      >
                        <div className={`w-2 h-12 rounded-full ${colorClass.split(" ")[0].replace("text-", "bg-")}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.amount} {item.unit}</p>
                        </div>
                        {item.expiry_date && (
                          <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${colorClass}`}>
                            {getExpiryLabel(days)}
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting === item.id}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* SUGGESTIONS TAB */}
        {activeTab === "suggestions" && (
          <div className="space-y-6">
            {isLoadingSuggestions ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
                <p className="text-muted-foreground">AI Chef is inventing recipes from your ingredients...</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
              </div>
            ) : suggestionsError ? (
              <div className="text-center py-16">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Could not generate suggestions</h2>
                <p className="text-red-600 mb-6 max-w-md mx-auto">{suggestionsError}</p>
                <button
                  onClick={() => { setSuggestionsError(""); generateSuggestions(); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl font-medium"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No suggestions yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add items to your inventory, then click "Get AI Suggestions" to discover recipes based on what you have
                </p>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Ingredients
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-orange-100 overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all group"
                  >
                    {/* AI Food Image */}
                    <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
                      <RecipeImage
                        src={suggestion.imageUrl}
                        alt={suggestion.title}
                        className="h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {suggestion.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium rounded-lg text-orange-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {index === 0 && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-lg">
                          Top Pick
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-foreground mb-1">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {suggestion.prepTime + suggestion.cookTime} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {suggestion.servings} servings
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" />
                          {suggestion.difficulty}
                        </span>
                      </div>

                      {/* Uses Ingredients */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {suggestion.usesIngredients.slice(0, 4).map((ing) => (
                          <span key={ing} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                            <Leaf className="h-3 w-3" />
                            {ing}
                          </span>
                        ))}
                        {suggestion.usesIngredients.length > 4 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-lg">
                            +{suggestion.usesIngredients.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleCreateRecipe(suggestion)}
                        disabled={isGeneratingFull?.title === suggestion.title}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-medium text-sm disabled:opacity-50"
                      >
                        {isGeneratingFull?.title === suggestion.title ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating full recipe...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4" />
                            Create This Recipe
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fridge Scanner Modal */}
        {showScanner && (
          <FridgeScanner
            onAddItems={handleScannedItems}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
}
