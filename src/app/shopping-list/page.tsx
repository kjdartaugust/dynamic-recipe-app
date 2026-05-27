"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  WifiOff,
} from "lucide-react";

interface ShoppingItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  checked: boolean;
  recipe_title?: string;
}

interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingItem[];
}

export default function ShoppingListPage() {
  const router = useRouter();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [pendingOffline, setPendingOffline] = useState(false);

  // Load list: prefer server when online, localStorage when offline
  const loadList = useCallback(async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        const res = await fetch("/api/shopping-list", { cache: "no-store" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.lists?.length > 0) {
          const serverList = data.lists[0];
          setList(serverList);
          // Persist to localStorage for offline
          localStorage.setItem("shopping-list", JSON.stringify(serverList));
        } else {
          setList(null);
          localStorage.removeItem("shopping-list");
        }
      } else {
        // Offline: load from localStorage
        const cached = localStorage.getItem("shopping-list");
        if (cached) {
          setList(JSON.parse(cached));
        } else {
          setList(null);
        }
      }
    } catch {
      // Fallback to cache
      const cached = localStorage.getItem("shopping-list");
      if (cached) setList(JSON.parse(cached));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadList();

    const onOnline = () => {
      setIsOnlineState(true);
      setPendingOffline(false);
      // Auto-sync when coming back online
      setTimeout(loadList, 1000);
    };
    const onOffline = () => setIsOnlineState(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [loadList]);

  const persist = useCallback(
    async (updatedList: ShoppingList | null) => {
      setList(updatedList);
      if (updatedList) {
        localStorage.setItem("shopping-list", JSON.stringify(updatedList));
      } else {
        localStorage.removeItem("shopping-list");
      }

      if (!navigator.onLine) {
        setPendingOffline(true);
        return;
      }

      setIsSaving(true);
      try {
        if (updatedList) {
          await fetch("/api/shopping-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listId: updatedList.id,
              title: updatedList.title,
              items: updatedList.items,
            }),
          });
        } else {
          // Clear all
          await fetch("/api/shopping-list", { method: "DELETE" });
        }
      } catch {
        setPendingOffline(true);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const toggleItem = (index: number) => {
    if (!list) return;
    const updated = {
      ...list,
      items: list.items.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      ),
    };
    persist(updated);
  };

  const removeItem = (index: number) => {
    if (!list) return;
    const updated = {
      ...list,
      items: list.items.filter((_, i) => i !== index),
    };
    persist(updated);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    if (!list) {
      const newList: ShoppingList = {
        id: "local",
        title: "My Shopping List",
        items: [
          {
            id: `local-${Date.now()}`,
            name: newItemName.trim(),
            checked: false,
          },
        ],
      };
      persist(newList);
      setNewItemName("");
      return;
    }

    const updated = {
      ...list,
      items: [
        ...list.items,
        {
          id: `local-${Date.now()}`,
          name: newItemName.trim(),
          checked: false,
        },
      ],
    };
    persist(updated);
    setNewItemName("");
  };

  const clearCompleted = () => {
    if (!list) return;
    const updated = {
      ...list,
      items: list.items.filter((item) => !item.checked),
    };
    persist(updated);
  };

  const clearAll = async () => {
    if (!list) return;
    if (!confirm("Clear entire shopping list?")) return;
    persist(null);
  };

  const checkedCount = list?.items.filter((i) => i.checked).length || 0;
  const totalCount = list?.items.length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Offline Banner */}
      {!isOnlineState && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700">
          <WifiOff className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">You are offline</p>
            <p className="text-xs text-amber-600">
              Shopping list works offline. Changes save to local storage.
            </p>
          </div>
        </div>
      )}
      {pendingOffline && isOnlineState && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-700">
          <RefreshCw className="h-5 w-5 flex-shrink-0 animate-spin" />
          <p className="text-sm">Syncing offline changes to server...</p>
        </div>
      )}

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

          {/* Progress */}
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
                key={item.id || index}
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
