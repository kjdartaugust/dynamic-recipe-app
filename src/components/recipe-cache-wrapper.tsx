"use client";

import { useEffect } from "react";
import { cacheRecipe } from "@/lib/offline-cache";

interface RecipeCacheWrapperProps {
  recipe: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    ingredients: Array<{ name: string; amount: number; unit: string }>;
    prep_time: number;
    cook_time: number;
    servings: number;
    difficulty: string;
    image_url?: string | null;
  };
}

export function RecipeCacheWrapper({ recipe }: RecipeCacheWrapperProps) {
  useEffect(() => {
    // Auto-cache recipe when viewed (for offline access)
    cacheRecipe({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      image_url: recipe.image_url || undefined,
      cached_at: Date.now(),
    }).catch(() => {
      // Silently fail if caching doesn't work
    });
  }, [recipe.id]);

  return null;
}
