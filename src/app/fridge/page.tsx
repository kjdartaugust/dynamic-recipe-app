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
  CheckCircle,
  ChefHat,
  ArrowRight,
  Thermometer,
} from "lucide-react";

interface FridgeItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  expiry_date: string | null;
  category: string;
  created_at: string;
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return days;
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
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} ago`;
  if (days === 0) return "Expires today!";
  if (days === 1) return "Expires tomorrow";
  return `${days} days left`;
}

export default function FridgePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("piece");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("other");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchItems();
  }, [user, router]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/fridge");
      const data = await response.json();
      if (response.ok) {
        setItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch fridge items:", error);
    } finally {
      setIsLoading(false);
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
          category,
        }),
      });

      if (response.ok) {
        setName("");
        setAmount("");
        setUnit("piece");
        setExpiryDate("");
        setCategory("other");
        await fetchItems();
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/fridge?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRescueRecipe = async () => {
    const expiringItems = items.filter((item) => {
      const days = getDaysUntilExpiry(item.expiry_date);
      return days !== null && days <= 7;
    });

    if (expiringItems.length === 0) {
      alert("No items expiring soon! Add some ingredients with expiry dates.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: expiringItems }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recipe");
      }

      // Redirect to create recipe page with pre-filled data
      const params = new URLSearchParams();
      params.set("rescue", JSON.stringify(data.recipe));
      router.push(`/recipes/create?${params.toString()}`);
    } catch (error) {
      console.error("Rescue recipe error:", error);
      alert("Failed to generate rescue recipe. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return null;

  const expiringCount = items.filter((item) => {
    const days = getDaysUntilExpiry(item.expiry_date);
    return days !== null && days <= 3;
  }).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg mb-4">
            <Refrigerator className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">
            My Fridge & Pantry
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your ingredients and rescue them before they go to waste
          </p>
        </div>

        {/* Expiring Alert */}
        {expiringCount > 0 && (
          <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <div className="flex-1">
                <p className="font-semibold text-orange-800">
                  {expiringCount} item{expiringCount > 1 ? "s" : ""} expiring soon!
                </p>
                <p className="text-sm text-orange-600">
                  Rescue them with an AI-generated recipe before they go bad.
                </p>
              </div>
              <button
                onClick={handleRescueRecipe}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 btn-gradient text-white rounded-xl font-medium text-sm disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChefHat className="h-4 w-4" />
                )}
                Rescue Recipe
              </button>
            </div>
          </div>
        )}

        {/* Add Item Form */}
        <div className="card-gradient rounded-2xl p-6 border border-orange-100 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-500" />
            Add Item
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Name *
              </label>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Amount
              </label>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="piece">piece</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
                <option value="oz">oz</option>
                <option value="lb">lb</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Expires
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 btn-gradient text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add to Fridge
              </button>
            </div>
          </form>
        </div>

        {/* Items List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your fridge is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your ingredients to reduce food waste
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto text-left">
              <p className="text-sm text-blue-700 font-medium mb-2">How it works:</p>
              <ol className="text-sm text-blue-600 list-decimal list-inside space-y-1">
                <li>Add ingredients you have at home</li>
                <li>Set expiry dates for perishables</li>
                <li>Get alerts when items are expiring</li>
                <li>Generate recipes to rescue them!</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const days = getDaysUntilExpiry(item.expiry_date);
              const colorClass = getExpiryColor(days);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-orange-100 hover:border-orange-300 transition-colors group"
                >
                  <div className={`w-2 h-12 rounded-full ${colorClass.split(" ")[0].replace("text-", "bg-")}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.amount} {item.unit}
                    </p>
                  </div>
                  {item.expiry_date && (
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colorClass}`}>
                      {getExpiryLabel(days)}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting === item.id}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {isDeleting === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
