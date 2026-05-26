"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface AddToShoppingListProps {
  recipeId: string;
  recipeTitle: string;
  ingredients: Ingredient[];
}

export function AddToShoppingList({ recipeId, recipeTitle, ingredients }: AddToShoppingListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (isAdding || added) return;
    setIsAdding(true);

    try {
      // Get existing lists
      const listsRes = await fetch("/api/shopping-list");
      const listsData = await listsRes.json();

      const items = ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        checked: false,
        recipe_id: recipeId,
        recipe_title: recipeTitle,
      }));

      if (listsData.lists && listsData.lists.length > 0) {
        // Update existing list - merge items
        const existingList = listsData.lists[0];
        const existingItems = existingList.items || [];
        const mergedItems = [...existingItems, ...items];

        const res = await fetch("/api/shopping-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listId: existingList.id,
            title: existingList.title,
            items: mergedItems,
          }),
        });

        if (res.ok) setAdded(true);
      } else {
        // Create new list
        const res = await fetch("/api/shopping-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "My Shopping List",
            items,
          }),
        });

        if (res.ok) setAdded(true);
      }
    } catch (err) {
      console.error("Error adding to shopping list:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={isAdding || added}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        added
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-md"
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Added to List
        </>
      ) : isAdding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Add to Shopping List
        </>
      )}
    </button>
  );
}
