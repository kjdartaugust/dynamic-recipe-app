import Link from "next/link";
import { ChefHat, Home, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-6 text-center">
      <div className="p-4 bg-muted rounded-full">
        <ChefHat className="h-16 w-16 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Page Not Found
        </h2>
        <p className="text-muted-foreground max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved, deleted, or never existed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
