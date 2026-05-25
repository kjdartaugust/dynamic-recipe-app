"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Heart, Share2, Bookmark, BookmarkCheck } from "lucide-react";

interface FavoriteButtonProps {
  recipeId: string;
  isFavorited: boolean;
  onToggle: () => void;
}

export function FavoriteButton({ recipeId, isFavorited, onToggle }: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Please sign in to favorite recipes");
        return;
      }

      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", recipeId);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, recipe_id: recipeId });
      }

      onToggle();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isFavorited
          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorited ? (
        <BookmarkCheck className="h-5 w-5" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </button>
  );
}

interface ShareButtonProps {
  recipeId: string;
  title: string;
}

export function ShareButton({ recipeId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/recipes/${recipeId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this recipe: ${title}`,
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      aria-label="Share recipe"
    >
      {copied ? (
        <span className="text-xs font-medium">Copied!</span>
      ) : (
        <Share2 className="h-5 w-5" />
      )}
    </button>
  );
}
