"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, Tag, ShoppingBasket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TagData {
  id: string;
  name: string;
  slug: string;
}

interface RecipeSearchProps {
  categories: Category[];
  currentFilter?: string;
}

export function RecipeSearch({ categories, currentFilter = "all" }: RecipeSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [ingredientQuery, setIngredientQuery] = useState(searchParams.get("ingredients") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<TagData[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setAllTags(data.tags);
      })
      .catch(console.error);
  }, []);

  const performSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (ingredientQuery.trim()) params.set("ingredients", ingredientQuery.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (currentFilter && currentFilter !== "all") params.set("filter", currentFilter);

    const queryString = params.toString();
    router.push(`/dashboard${queryString ? `?${queryString}` : ""}`);
  }, [searchQuery, ingredientQuery, selectedCategory, selectedTags, currentFilter, router]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, ingredientQuery, selectedCategory, selectedTags, performSearch]);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setIngredientQuery("");
    setSelectedCategory("");
    setSelectedTags([]);
    router.push(`/dashboard${currentFilter !== "all" ? `?filter=${currentFilter}` : ""}`);
  };

  const hasActiveFilters = searchQuery || ingredientQuery || selectedCategory || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
          <input
            type="text"
            placeholder="Search recipes by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 border border-orange-200 rounded-xl transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-orange-100 text-orange-700 border-orange-300"
              : "hover:bg-orange-50 text-muted-foreground"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {showFilters && (
        <div className="p-5 border border-orange-200 rounded-xl bg-gradient-to-r from-orange-50/50 to-amber-50/50 space-y-5">
          {/* Ingredient Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
              <ShoppingBasket className="h-4 w-4 text-orange-400" />
              Search by Ingredients
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., chicken, tomato, onion (comma separated)"
                value={ingredientQuery}
                onChange={(e) => setIngredientQuery(e.target.value)}
                className="w-full px-4 py-2 border border-orange-200 rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm"
              />
              {ingredientQuery && (
                <button
                  onClick={() => setIngredientQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedCategory === ""
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent"
                    : "border-orange-200 hover:bg-orange-50 text-muted-foreground"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent"
                      : "border-orange-200 hover:bg-orange-50 text-muted-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                <Tag className="h-4 w-4 text-orange-400" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.slug)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedTags.includes(tag.slug)
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent"
                        : "border-orange-200 hover:bg-orange-50 text-muted-foreground"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
