"use client";

import { useState, useEffect, useRef } from "react";
import { Tag, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagData {
  id: string;
  name: string;
  slug: string;
}

interface TagInputProps {
  recipeId: string;
  initialTags?: TagData[];
  readOnly?: boolean;
  onTagsChange?: (tags: TagData[]) => void;
}

export function TagInput({ recipeId, initialTags = [], readOnly = false, onTagsChange }: TagInputProps) {
  const [tags, setTags] = useState<TagData[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagData[]>([]);
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setAllTags(data.tags);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = allTags.filter(
        (t) =>
          t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.some((existing) => existing.id === t.id)
      );
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allTags, tags]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = async (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, tagNames: [trimmed] }),
      });

      if (res.ok) {
        // Refresh tags
        const tagsRes = await fetch(`/api/tags?recipeId=${recipeId}`);
        const data = await tagsRes.json();
        if (data.tags) {
          setTags(data.tags);
          onTagsChange?.(data.tags);
        }
      }
    } catch (err) {
      console.error("Error adding tag:", err);
    } finally {
      setIsLoading(false);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const removeTag = async (tagId: string) => {
    if (readOnly) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tags?recipeId=${recipeId}&tagId=${tagId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const updated = tags.filter((t) => t.id !== tagId);
        setTags(updated);
        onTagsChange?.(updated);
      }
    } catch (err) {
      console.error("Error removing tag:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  if (readOnly && tags.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border transition-all",
              "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700"
            )}
          >
            <Tag className="h-3 w-3" />
            {tag.name}
            {!readOnly && (
              <button
                onClick={() => removeTag(tag.id)}
                disabled={isLoading}
                className="ml-1 p-0.5 hover:bg-orange-200 rounded-full transition-colors"
                aria-label={`Remove ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {!readOnly && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => inputValue.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Add a tag..."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => inputValue.trim() && addTag(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-md transition-all disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-orange-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => addTag(suggestion.name)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <Tag className="h-3 w-3 text-orange-400" />
                  {suggestion.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
