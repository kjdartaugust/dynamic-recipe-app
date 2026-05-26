"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";

export function VideoHero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section 
      className={`relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden ${
        prefersReducedMotion ? "gradient-bg-hero" : ""
      }`}
    >
      {/* Animated gradient background - no video needed */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 animated-gradient-bg" />
      )}

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Floating orbs for depth */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/30 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-float-medium pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/10 rounded-full blur-3xl animate-float-fast pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-5xl text-center">
        <div className="flex flex-col items-center gap-6">
          {/* Fire Icon */}
          <div className="relative animate-bounce-gentle">
            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full scale-150" />
            <div className="relative p-5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <ChefHat className="h-16 w-16 text-white fire-icon" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
            Dynamic Recipe App
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed drop-shadow-md">
            AI-powered recipe management. Scan ingredients, modify recipes, and
            cook with voice control.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold hover:bg-white/90 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              View Recipes
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/recipes/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold border border-white/30 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Create Recipe
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
