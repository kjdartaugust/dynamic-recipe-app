"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";

// Swappable video source - replace this URL with your AI-generated video later
const HERO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function VideoHero() {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("resize", checkMobile);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  const showVideo = !isMobile && !prefersReducedMotion && !videoError;

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* Base gradient layer - always present as fallback */}
      <div className="absolute inset-0 gradient-bg-hero" />

      {/* Video layer - sits on top of gradient */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      )}

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" style={{ zIndex: 2 }} />

      {/* Decorative subtle gradient orbs */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"
        style={{ zIndex: 2 }}
      />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"
        style={{ zIndex: 2 }}
      />

      {/* Content */}
      <div className="relative container mx-auto px-4 max-w-5xl text-center" style={{ zIndex: 10 }}>
        <div className="flex flex-col items-center gap-6">
          {/* Fire Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full scale-150" />
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
