"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  ChefHat,
  Refrigerator,
  TrendingUp,
  Award,
  ArrowRight,
  Loader2,
  Recycle,
  BarChart3,
} from "lucide-react";

interface Stats {
  totalRecipes: number;
  totalPublicRecipes: number;
  totalIngredients: number;
  fridgeItems: number;
  expiringItems: number;
  avgRating: number;
  recipeViews: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [recipesRes, fridgeRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/fridge"),
      ]);

      const recipesData = recipesRes.ok ? await recipesRes.json() : { recipes: [] };
      const fridgeData = fridgeRes.ok ? await fridgeRes.json() : { items: [] };

      const recipes = recipesData.recipes || [];
      const fridge = fridgeData.items || [];

      const expiringCount = fridge.filter((item: any) => {
        if (!item.expiry_date) return false;
        const days = Math.ceil(
          (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return days <= 3;
      }).length;

      setStats({
        totalRecipes: recipes.length,
        totalPublicRecipes: recipes.filter((r: any) => r.is_public).length,
        totalIngredients: recipes.reduce((sum: number, r: any) => sum + (r.ingredients?.length || 0), 0),
        fridgeItems: fridge.length,
        expiringItems: expiringCount,
        avgRating: 0,
        recipeViews: 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Recipes Created",
      value: stats?.totalRecipes || 0,
      icon: ChefHat,
      color: "from-orange-500 to-red-500",
      link: "/dashboard",
    },
    {
      label: "Public Recipes",
      value: stats?.totalPublicRecipes || 0,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      link: "/explore",
    },
    {
      label: "Ingredients Tracked",
      value: stats?.fridgeItems || 0,
      icon: Refrigerator,
      color: "from-blue-500 to-cyan-500",
      link: "/fridge",
    },
    {
      label: "Expiring Soon",
      value: stats?.expiringItems || 0,
      icon: Recycle,
      color: stats?.expiringItems && stats.expiringItems > 0 ? "from-red-500 to-orange-500" : "from-gray-400 to-gray-500",
      link: "/fridge",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg mb-4">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">
            Your Impact
          </h1>
          <p className="text-muted-foreground mt-2">
            Tracking your food waste reduction journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.link}
              className="card-gradient rounded-2xl p-6 border border-orange-100 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{card.label}</p>
                  <p className="text-4xl font-bold mt-2 gradient-text">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-orange-600 group-hover:underline">
                View details <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-800">
            <Award className="h-5 w-5" />
            Food Waste Prevention Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Plan meals around expiring ingredients first",
              "Store herbs in water like flowers to extend life",
              "Freeze bread before it goes stale",
              "Use vegetable scraps for homemade stock",
              "Pickle or ferment vegetables before they spoil",
              "Compost whatever you can't rescue",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-green-100">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-green-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
