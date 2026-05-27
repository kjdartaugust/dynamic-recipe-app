"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Check, X, Loader2 } from "lucide-react";

interface Collection {
  id: string;
  title: string;
}

interface AddToCollectionButtonProps {
  recipeId: string;
}

export function AddToCollectionButton({ recipeId }: AddToCollectionButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [addedCollections, setAddedCollections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showMenu) return;
    fetchCollections();
  }, [showMenu]);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) return;
      const data = await res.json();
      setCollections(data.collections || []);

      // Check which collections already have this recipe
      for (const collection of data.collections || []) {
        const detailRes = await fetch(`/api/collections/${collection.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const hasRecipe = detail.recipes?.some((r: any) => r.id === recipeId);
          if (hasRecipe) {
            setAddedCollections((prev) => new Set(prev).add(collection.id));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching collections:", err);
    }
  };

  const addToCollection = async (collectionId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
      if (res.ok || res.status === 409) {
        setAddedCollections((prev) => new Set(prev).add(collectionId));
      }
    } catch (err) {
      console.error("Error adding to collection:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        title="Add to Collection"
      >
        <FolderPlus className="h-4 w-4" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-orange-100 py-2 z-50">
            <div className="px-3 py-2 border-b border-orange-100">
              <p className="text-sm font-medium text-foreground">Add to Collection</p>
            </div>

            {collections.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">No collections yet</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => addToCollection(collection.id)}
                    disabled={isLoading || addedCollections.has(collection.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    <span className="truncate">{collection.title}</span>
                    {addedCollections.has(collection.id) && (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
