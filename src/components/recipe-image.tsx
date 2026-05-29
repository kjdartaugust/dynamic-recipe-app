"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChefHat,
  Drumstick,
  Beef,
  Fish,
  Salad,
  Soup,
  Cake,
  Coffee,
  Egg,
  Utensils,
} from "lucide-react";

interface RecipeImageProps {
  src: string | null;
  alt: string;
  className?: string;
  tags?: string[];
}

interface CategoryConfig {
  icon: React.ReactNode;
  gradient: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
  pattern: string;
}

function getCategory(title: string = "", tags: string[] = []): string {
  const text = (title + " " + tags.join(" ")).toLowerCase();

  const patterns: Record<string, string[]> = {
    breakfast: ["breakfast", "pancake", "waffle", "omelet", "egg", "bacon", "cereal", "toast"],
    chicken: ["chicken", "poultry", "turkey", "duck"],
    beef: ["beef", "steak", "burger", "meatball", "meat", "pork", "lamb"],
    seafood: ["fish", "salmon", "tuna", "shrimp", "seafood", "crab", "lobster"],
    salad: ["salad", "vegetable", "veggie", "green", "lettuce", "quinoa"],
    pasta: ["pasta", "noodle", "spaghetti", "ramen", "macaroni", "lasagna"],
    soup: ["soup", "stew", "curry", "chowder", "broth", "pho"],
    dessert: ["dessert", "cake", "cookie", "pie", "chocolate", "sweet", "pudding", "ice cream"],
    drink: ["drink", "smoothie", "juice", "cocktail", "beverage", "milkshake"],
  };

  for (const [category, words] of Object.entries(patterns)) {
    for (const word of words) {
      if (text.includes(word)) return category;
    }
  }

  return "generic";
}

function getCategoryConfig(category: string): CategoryConfig {
  const configs: Record<string, CategoryConfig> = {
    breakfast: {
      icon: <Egg className="h-12 w-12" />,
      gradient: "from-amber-100 via-yellow-50 to-orange-100",
      bgColor: "bg-amber-100/50",
      iconColor: "text-amber-600",
      textColor: "text-amber-700",
      pattern: "radial-gradient(circle, rgba(251,191,36,0.1) 1px, transparent 1px)",
    },
    chicken: {
      icon: <Drumstick className="h-12 w-12" />,
      gradient: "from-orange-100 via-red-50 to-orange-100",
      bgColor: "bg-orange-100/50",
      iconColor: "text-orange-600",
      textColor: "text-orange-700",
      pattern: "radial-gradient(circle, rgba(249,115,22,0.1) 1px, transparent 1px)",
    },
    beef: {
      icon: <Beef className="h-12 w-12" />,
      gradient: "from-red-100 via-rose-50 to-red-100",
      bgColor: "bg-red-100/50",
      iconColor: "text-red-600",
      textColor: "text-red-700",
      pattern: "radial-gradient(circle, rgba(239,68,68,0.1) 1px, transparent 1px)",
    },
    seafood: {
      icon: <Fish className="h-12 w-12" />,
      gradient: "from-teal-100 via-cyan-50 to-blue-100",
      bgColor: "bg-teal-100/50",
      iconColor: "text-teal-600",
      textColor: "text-teal-700",
      pattern: "radial-gradient(circle, rgba(20,184,166,0.1) 1px, transparent 1px)",
    },
    salad: {
      icon: <Salad className="h-12 w-12" />,
      gradient: "from-green-100 via-emerald-50 to-green-100",
      bgColor: "bg-green-100/50",
      iconColor: "text-green-600",
      textColor: "text-green-700",
      pattern: "radial-gradient(circle, rgba(34,197,94,0.1) 1px, transparent 1px)",
    },
    pasta: {
      icon: <Utensils className="h-12 w-12" />,
      gradient: "from-yellow-100 via-amber-50 to-orange-100",
      bgColor: "bg-yellow-100/50",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-700",
      pattern: "radial-gradient(circle, rgba(234,179,8,0.1) 1px, transparent 1px)",
    },
    soup: {
      icon: <Soup className="h-12 w-12" />,
      gradient: "from-orange-100 via-amber-50 to-yellow-100",
      bgColor: "bg-orange-100/50",
      iconColor: "text-orange-600",
      textColor: "text-orange-700",
      pattern: "radial-gradient(circle, rgba(251,146,60,0.1) 1px, transparent 1px)",
    },
    dessert: {
      icon: <Cake className="h-12 w-12" />,
      gradient: "from-pink-100 via-rose-50 to-pink-100",
      bgColor: "bg-pink-100/50",
      iconColor: "text-pink-600",
      textColor: "text-pink-700",
      pattern: "radial-gradient(circle, rgba(236,72,153,0.1) 1px, transparent 1px)",
    },
    drink: {
      icon: <Coffee className="h-12 w-12" />,
      gradient: "from-sky-100 via-blue-50 to-indigo-100",
      bgColor: "bg-sky-100/50",
      iconColor: "text-sky-600",
      textColor: "text-sky-700",
      pattern: "radial-gradient(circle, rgba(14,165,233,0.1) 1px, transparent 1px)",
    },
  };

  return (
    configs[category] || {
      icon: <ChefHat className="h-12 w-12" />,
      gradient: "from-orange-100 via-red-50 to-orange-100",
      bgColor: "bg-orange-100/50",
      iconColor: "text-orange-600",
      textColor: "text-orange-700",
      pattern: "radial-gradient(circle, rgba(249,115,22,0.1) 1px, transparent 1px)",
    }
  );
}

export function RecipeImage({ src, alt, className = "", tags = [] }: RecipeImageProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const category = getCategory(alt, tags);
  const config = getCategoryConfig(category);

  const handleLoad = useCallback(() => {
    setStatus("success");
  }, []);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
    } else {
      setStatus("error");
    }
  }, [retryCount]);

  useEffect(() => {
    setStatus("loading");
    setRetryCount(0);
  }, [src]);

  // If no image URL provided, show fallback immediately
  if (!src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${config.gradient} ${className}`}
        style={{
          backgroundImage: config.pattern,
          backgroundSize: "20px 20px",
        }}
      >
        <div
          className={`inline-flex items-center justify-center p-4 ${config.bgColor} rounded-2xl shadow-sm border border-white/50 backdrop-blur-sm`}
        >
          <span className={config.iconColor}>{config.icon}</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${config.gradient} ${className}`}
        style={{
          backgroundImage: config.pattern,
          backgroundSize: "20px 20px",
        }}
      >
        <div
          className={`inline-flex items-center justify-center p-4 ${config.bgColor} rounded-2xl shadow-sm border border-white/50 backdrop-blur-sm`}
        >
          <span className={config.iconColor}>{config.icon}</span>
        </div>
      </div>
    );
  }

  const imgSrc = retryCount > 0 ? `${src}&retry=${retryCount}` : src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-10">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full animate-pulse">
              <ChefHat className="h-6 w-6 text-orange-500" />
            </div>
            <div className="w-20 h-1.5 bg-orange-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
            </div>
            <p className="text-xs text-orange-600 font-medium">Loading image...</p>
          </div>
        </div>
      )}
      <img
        key={imgSrc}
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          status === "success" ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
