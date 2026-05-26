"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Clock,
  Users,
  Flame,
  Star,
  Loader2,
  ChefHat,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface PublicRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  created_at: string;
  macros: { calories?: number } | null;
  author: {
    username: string;
    avatar_url: string | null;
  } | null;
  rating: {
    average: number;
    count: number;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    fetchRecipes();
  }, [page, sort]);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/explore?page=${page}&limit=12&sort=${sort}`
      );
      const data = await response.json();
      if (response.ok) {
        setRecipes(data.recipes);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch public recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg mb-4">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">
            Explore Recipes
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Discover recipes shared by the community. Find your next favorite
            meal.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => {
              setSort("recent");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === "recent"
                ? "bg-orange-100 text-orange-700"
                : "text-muted-foreground hover:bg-orange-50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Recent
          </button>
          <button
            onClick={() => {
              setSort("popular");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === "popular"
                ? "bg-orange-100 text-orange-700"
                : "text-muted-foreground hover:bg-orange-50"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Popular
          </button>
          <button
            onClick={() => {
              setSort("oldest");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === "oldest"
                ? "bg-orange-100 text-orange-700"
                : "text-muted-foreground hover:bg-orange-50"
            }`}
          >
            <Clock className="h-4 w-4" />
            Oldest
          </button>
        </div>

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-orange-50 rounded-full mb-6">
              <ChefHat className="h-12 w-12 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              No public recipes yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Be the first to share a recipe with the community!
            </p>
            <Link
              href="/recipes/create"
              className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-white rounded-xl font-medium"
            >
              Create Recipe
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`px-4 py-2 rounded-lg border border-orange-200 text-sm font-medium transition-colors ${
                    page <= 1
                      ? "opacity-50 pointer-events-none text-muted-foreground"
                      : "hover:bg-orange-50 text-foreground"
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`px-4 py-2 rounded-lg border border-orange-200 text-sm font-medium transition-colors ${
                    page >= totalPages
                      ? "opacity-50 pointer-events-none text-muted-foreground"
                      : "hover:bg-orange-50 text-foreground"
                  }`}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: PublicRecipe }) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const calories = recipe.macros?.calories;

  return (
    <Link href={`/recipes/${recipe.id}`} className="group">
      <article className="card-gradient rounded-xl overflow-hidden h-full flex flex-col">
        <div className="aspect-video bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Flame className="h-14 w-14 text-orange-200 fire-icon" />
            </div>
          )}
          {recipe.category && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-md">
                {recipe.category.name}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 space-y-3 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold text-lg line-clamp-1 text-foreground group-hover:text-orange-600 transition-colors">
              {recipe.title}
            </h2>
            {recipe.rating && recipe.rating.count > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground">
                  {recipe.rating.average.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-xs font-bold">
              {recipe.author?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-xs text-muted-foreground">
              by {recipe.author?.username || "Unknown"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-orange-100 mt-auto">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
                {totalTime} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-orange-400" />
                {recipe.servings} servings
              </span>
            )}
            {calories && (
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                {calories} cal
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
