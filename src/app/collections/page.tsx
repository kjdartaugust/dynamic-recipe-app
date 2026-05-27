"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  Folder,
  Plus,
  Loader2,
  ArrowLeft,
  BookOpen,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
  collection_recipes: { count: number } | null;
}

export default function CollectionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchCollections();
  }, [user, router]);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollections([data.collection, ...collections]);
        setNewTitle("");
        setNewDescription("");
        setShowForm(false);
      }
    } catch (err) {
      console.error("Error creating collection:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm("Delete this collection? Recipes will not be deleted.")) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCollections(collections.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Error deleting collection:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
          <h1 className="text-3xl font-bold gradient-text">Collections</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 btn-gradient text-white rounded-xl font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          New Collection
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={createCollection}
          className="card-gradient rounded-2xl p-6 border border-orange-100 space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Weeknight Dinners"
              required
              className="w-full mt-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full mt-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-orange-200 rounded-xl text-muted-foreground hover:bg-orange-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !newTitle.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Collection
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-orange-50 rounded-full mb-6">
            <Folder className="h-12 w-12 text-orange-300" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No collections yet</h2>
          <p className="text-muted-foreground max-w-md">
            Create collections to organize your recipes — like "Weeknight Dinners,"
            "Holiday Recipes," or "Family Favorites."
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group bg-white rounded-2xl border border-orange-100 p-5 hover:shadow-lg hover:border-orange-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <Link
                  href={`/collections/${collection.id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-orange-600 transition-colors truncate">
                    {collection.title}
                  </h3>
                </Link>
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {collection.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{collection.collection_recipes?.count || 0} recipes</span>
                </div>
                <Link
                  href={`/collections/${collection.id}`}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
