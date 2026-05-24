import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <ChefHat className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Dynamic Recipe App
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          AI-powered recipe management. Scan ingredients, modify recipes, and
          cook with voice control.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          View Recipes
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/recipes/create"
          className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
        >
          Create Recipe
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl w-full">
        <FeatureCard
          title="AI Ingredient Scan"
          description="Upload a photo and let AI identify ingredients automatically."
        />
        <FeatureCard
          title="Smart Modifications"
          description="Modify recipes with natural language - vegan, double portions, and more."
        />
        <FeatureCard
          title="Voice Control"
          description="Hands-free cooking with voice commands for next, back, and repeat."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 border border-border rounded-lg bg-card text-card-foreground">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
