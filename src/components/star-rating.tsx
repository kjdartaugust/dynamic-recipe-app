"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRate,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = interactive
          ? starValue <= (hoverRating || rating)
          : starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onRate?.(starValue)}
            className={cn(
              "transition-colors",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                "transition-colors",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
