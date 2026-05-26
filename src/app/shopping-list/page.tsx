"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Check,
  Trash2,
  ArrowLeft,
  Loader2,
  ChefHat,
  X,
  RefreshCw,
} from "lucide-react";

interface ShoppingListItem {
  name: string;
  amount?: number;
  unit?: string;
  checked: boolean;
  recipe_id?: string;
  recipe_title?: string;
}

interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingListItem[];
  created_at: string;
  updated_at: string;
}

export default function ShoppingListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shopping-list", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.lists && data.lists.length > 0) {
        setList(data.lists[0]);
      } else {
        setList(null);
      }
    } catch (err) {
      console.error("Error loading shopping list:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Re-fetch whenever the pathname changes (navigation to this page)
  useEffect(() => {
    loadList();
  }, [pathname, loadList]);

  const saveList = async (updatedList: ShoppingList) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: updatedList.id,
          title: updatedList.title,
          items: updatedList.items,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setList(data.list);
      }
    } catch (err) {
      console.error("Error saving list:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleItem = (index: number) => {
    if (!list) return;
    const updated = { ...list };
    updated.items = updated.items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setList(updated);
    saveList(updated);
  };

  const removeItem = (index: number) => {
    if (!list) return;
    const updated = { ...list };
    updated.items = updated.items.filter((_, i) => i !== index);
    setList(updated);
    saveList(updated);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    if (!list) {
      const newList: ShoppingList = {
        id: "",
        title: "My Shopping List",
        items: [{ name: newItemName.trim(), checked: false }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setList(newList);
      saveList(newList);
      setNewItemName("");
      return;
    }
    const updated = { ...list };
    updated.items = [...updated.items, { name: newItemName.trim(), checked: false }];
    setList(updated);
    saveList(updated);
    setNewItemName("");
  };

  const clearCompleted = () => {
    if (!list) return;
    const updated = { ...list };
    updated.items = updated.items.filter((item) => !item.checked);
    setList(updated);
    saveList(updated);
  };

  const clearAll = async () => {
    if (!list) return;
    if (!confirm("Are you sure you want to clear the entire shopping list?")) return;

    try {
      const res = await fetch(`/api/shopping-list?listId=${list.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setList(null);
      }
    } catch (err) {
      console.error("Error clearing list:", err);
    }
  };

  const checkedCount = list?.items.filter((i) => i.checked).length || 0;
  const totalCount = list?.items.length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold gradient-text">Shopping List</h1>
        </div>
        <button
          onClick={loadList}
          disabled={isLoading}
          className="p-2 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      ) : !list || list.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-orange-50 rounded-full mb-6">
            <ShoppingCart className="h-12 w-12 text-orange-300" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your shopping list is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add items manually or add ingredients from any recipe page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-white rounded-xl font-medium"
          >
            <ChefHat className="h-4 w-4" />
            Browse Recipes
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-orange-600">{checkedCount}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> items checked
            </div>
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>

          {/* Add item */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Add an item..."
              className="flex-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
            />
            <button
              onClick={addItem}
              disabled={!newItemName.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-md transition-all disabled:opacity-50 font-medium"
            >
              Add
            </button>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {list.items.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  item.checked
                    ? "bg-orange-50/30 border-orange-100"
                    : "bg-white border-orange-100 hover:border-orange-300"
                }`}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    item.checked
                      ? "bg-gradient-to-r from-orange-500 to-red-500 border-transparent"
                      : "border-orange-300 hover:border-orange-500"
                  }`}
                >
                  {item.checked && <Check className="h-3.5 w-3.5 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      item.checked ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {item.name}
                  </p>
                  {(item.amount || item.unit) && (
                    <p className="text-sm text-muted-foreground">
                      {item.amount} {item.unit}
                    </p>
                  )}
                  {item.recipe_title && (
                    <p className="text-xs text-orange-500 mt-0.5">
                      From: {item.recipe_title}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeItem(index)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {checkedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors text-muted-foreground"
              >
                <Check className="h-4 w-4" />
                Clear Completed
              </button>
            )}
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
