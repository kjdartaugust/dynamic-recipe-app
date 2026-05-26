"use client";

import { useState } from "react";
import { Globe, Lock, Loader2 } from "lucide-react";

interface VisibilityToggleProps {
  recipeId: string;
  initialIsPublic: boolean;
  isOwner: boolean;
}

export function VisibilityToggle({
  recipeId,
  initialIsPublic,
  isOwner,
}: VisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOwner) {
    // Just show badge for non-owners
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          isPublic
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
      >
        {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {isPublic ? "Public" : "Private"}
      </div>
    );
  }

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recipes/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          isPublic: !isPublic,
        }),
      });

      if (response.ok) {
        setIsPublic(!isPublic);
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${
        isPublic
          ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPublic ? (
        <Globe className="h-3 w-3" />
      ) : (
        <Lock className="h-3 w-3" />
      )}
      {isPublic ? "Public" : "Private"}
    </button>
  );
}
