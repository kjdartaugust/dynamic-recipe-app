import Link from "next/link";
import { ArrowRight, Sparkles, Refrigerator, Bell } from "lucide-react";
import { VideoHero } from "@/components/video-hero";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <VideoHero />

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Cook Smarter, Waste Less
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              ZeroWaste Chef combines your kitchen inventory with AI to find creative recipes from ingredients you already have.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Refrigerator}
              title="Track Your Kitchen"
              description="Log everything in your fridge and pantry. Set expiry dates and never forget what you have."
              color="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Recipe Ideas"
              description="Our AI Chef analyzes your inventory and invents recipes with gorgeous food photos — using what you already own."
              color="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={Bell}
              title="Expiry Alerts"
              description="Get notified before food goes bad. Turn expiring ingredients into delicious meals instead of waste."
              color="from-red-500 to-pink-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-orange-50/30 to-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gradient-text mb-4">How It Works</h2>
            <p className="text-muted-foreground">From clutter to dinner in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Add Items", desc: "Log your fridge & pantry contents", icon: Refrigerator },
              { step: "2", title: "AI Invent", desc: "Chef creates recipes from your inventory", icon: ChefHat },
              { step: "3", title: "Visualize", desc: "See food photos of every suggestion", icon: Leaf },
              { step: "4", title: "Cook & Save", desc: "Create recipes and save the best ones", icon: Sparkles },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xl font-bold mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg-soft">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stop Wasting Food. Start Cooking.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of home cooks saving money and the planet — one recipe at a time.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 btn-gradient text-white rounded-xl font-semibold"
          >
            Start Cooking Free
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
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="card-gradient rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${color} text-white mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-xl mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
