import Link from "next/link";
import { ChefHat, ArrowRight, Camera, Sparkles, Mic } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative gradient-bg-hero min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 container mx-auto px-4 max-w-5xl text-center">
          <div className="flex flex-col items-center gap-6">
            {/* Fire Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-150" />
              <div className="relative p-5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <ChefHat className="h-16 w-16 text-white fire-icon" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
              Dynamic Recipe App
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
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

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Powered by AI
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three smart features to make cooking easier than ever before.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Camera}
              title="AI Ingredient Scan"
              description="Upload a photo and let AI identify ingredients automatically."
            />
            <FeatureCard
              icon={Sparkles}
              title="Smart Modifications"
              description="Modify recipes with natural language - vegan, double portions, and more."
            />
            <FeatureCard
              icon={Mic}
              title="Voice Control"
              description="Hands-free cooking with voice commands for next, back, and repeat."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg-soft">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Start Cooking?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Create your first recipe or browse your collection.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 btn-gradient text-white rounded-xl font-semibold"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="card-gradient rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-xl mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
