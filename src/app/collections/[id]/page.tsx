"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Clock,
  Users,
  Trash2,
  Flame,
} from "lucide-react";

interface CollectionRecipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
  profiles: { username: string } | null;
  position: number;
}

interface Collection {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [recipes, setRecipes] = useState<CollectionRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const collectionId = params ? (typeof params === "object" && "id" in params ? params.id : "") : "";

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!collectionId) return;
    fetchCollection();
  }, [user, router, collectionId]);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        router.push("/collections");
        return;
      }
      const data = await res.json();
      setCollection(data.collection);
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error("Error fetching collection:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecipe = async (recipeId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/recipes?recipeId=${recipeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecipes(recipes.filter((r) => r.id !== recipeId));
      }
    } catch (err) {
      console.error("Error removing recipe:", err);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Collections
        </Link>

        <div>
          <h1 className="text-3xl font-bold gradient-text">{collection.title}</h1>
          {collection.description && (
            <p className="text-muted-foreground mt-2">{collection.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{recipes.length} recipes</span>
        </div>
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 bg-orange-50/50 rounded-2xl border border-orange-100">
          <p className="text-muted-foreground">No recipes in this collection yet</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 btn-gradient text-white rounded-xl font-medium text-sm"
          >
            Browse Recipes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group bg-white rounded-2xl border border-orange-100 overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all"
            >
              <Link href={`/recipes/${recipe.id}`} className="block">
                <div className="relative h-40 bg-gradient-to-br from-orange-100 to-red-100">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Flame className="h-10 w-10 text-orange-300" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <Link href={`/recipes/${recipe.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-orange-600 transition-colors truncate">
                      {recipe.title}
                    </h3>
                  </Link>
                  <button
                    onClick={() => removeRecipe(recipe.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {recipe.prep_time + recipe.cook_time} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {recipe.servings}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
