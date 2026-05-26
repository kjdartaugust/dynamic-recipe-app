import Link from "next/link";
import { ArrowRight, Camera, Sparkles, Mic } from "lucide-react";
import { VideoHero } from "@/components/video-hero";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Video Background */}
      <VideoHero />

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
