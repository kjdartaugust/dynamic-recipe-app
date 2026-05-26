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
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          // If duplicate key error, just treat as success (already favorited)
          if (data.error?.includes("duplicate key")) {
            setIsFavorited(true);
          } else {
            throw new Error(data.error || `Server error: ${res.status}`);
          }
        }
      } else {
        const res = await fetch(`/api/favorites?recipeId=${recipeId}`, {
          method: "DELETE",
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Server error: ${res.status}`);
        }
      }
    } catch (err) {
      // Revert on any other error
      setIsFavorited(!newState);
      console.error("Favorite toggle error:", err);
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
      <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
    </button>
  );
}
