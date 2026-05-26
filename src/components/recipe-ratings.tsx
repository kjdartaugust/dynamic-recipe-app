"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { StarRating } from "./star-rating";
import { Loader2, Send, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface RecipeRatingsProps {
  recipeId: string;
}

export function RecipeRatings({ recipeId }: RecipeRatingsProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRatings();
  }, [recipeId]);

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ratings?recipeId=${recipeId}`);
      const data = await response.json();
      if (response.ok) {
        setRatings(data.ratings);
        setAverage(data.average);
        setCount(data.count);

        // Find user's existing rating
        const existing = data.ratings.find((r: Review) => r.user_id === user?.id);
        if (existing) {
          setUserRating(existing.rating);
          setUserReview(existing.review || "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("Please sign in to rate this recipe");
      return;
    }
    if (userRating === 0) {
      setError("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          rating: userRating,
          review: userReview.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      // Refresh ratings
      await fetchRatings();
      setUserReview("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your rating?")) return;
    try {
      const response = await fetch(`/api/ratings?recipeId=${recipeId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUserRating(0);
        setUserReview("");
        await fetchRatings();
      }
    } catch (err) {
      console.error("Failed to delete rating:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-foreground">{average.toFixed(1)}</div>
        <div>
          <StarRating rating={Math.round(average)} size="sm" />
          <p className="text-sm text-muted-foreground mt-1">
            {count} review{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Submit Rating */}
      {user && (
        <div className="card-gradient rounded-xl p-5 border border-orange-100">
          <h3 className="font-semibold mb-3">
            {ratings.some((r) => r.user_id === user.id) ? "Update your rating" : "Rate this recipe"}
          </h3>
          <div className="space-y-3">
            <StarRating
              rating={userRating}
              size="lg"
              interactive
              onRate={setUserRating}
            />
            <textarea
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="Write a review (optional)..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-orange-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 btn-gradient text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit
              </button>
              {ratings.some((r) => r.user_id === user.id) && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Reviews</h3>
        {ratings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to rate this recipe!</p>
        ) : (
          ratings.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-4 border border-orange-100"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white text-xs font-bold">
                    {review.profiles?.username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {review.profiles?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              {review.review && (
                <p className="text-sm text-foreground mt-2">{review.review}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
