"use client";

import { cn } from "@/lib/utils";

export function RecipeSkeleton() {
  return (
    <div className="card-gradient rounded-xl overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-orange-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-orange-50 rounded animate-pulse w-full" />
        <div className="h-4 bg-orange-50 rounded animate-pulse w-2/3" />
        <div className="flex items-center gap-4 pt-2 border-t border-orange-100">
          <div className="h-4 bg-orange-100 rounded animate-pulse w-16" />
          <div className="h-4 bg-orange-100 rounded animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}

export function RecipeSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeSkeleton key={i} />
      ))}
    </div>
  );
}
