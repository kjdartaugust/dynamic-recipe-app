"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  recipeId: string;
  initialFavorited?: boolean;
}

export function FavoriteButton({ recipeId, initialFavorited = false }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check favorite status on mount
    const checkFavorite = async () => {
      try {
        const res = await fetch(`/api/favorites?recipeId=${recipeId}`);
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(data.isFavorited);
        }
      } catch {
        // Silently fail
      }
    };
    checkFavorite();
  }, [recipeId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    const newState = !isFavorited;
    setIsFavorited(newState);

    try {
      if (newState) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
      } else {
        await fetch(`/api/favorites?recipeId=${recipeId}`, {
          method: "DELETE",
        });
      }
    } catch {
      // Revert on error
      setIsFavorited(!newState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn(
        "p-2 rounded-full transition-all duration-200 hover:scale-110",
        isFavorited
          ? "bg-red-500 text-white shadow-md"
          : "bg-white/80 text-muted-foreground hover:bg-white hover:text-red-500"
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn("h-4 w-4", isFavorited && "fill-current")}
      />
    </button>
  );
}
