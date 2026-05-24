import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Recipe",
  description:
    "Create a new recipe with AI assistance. Add ingredients, instructions, and let AI help you modify and enhance your recipes.",
  openGraph: {
    title: "Create Recipe | Dynamic Recipe App",
    description:
      "Create a new recipe with AI assistance. Add ingredients, instructions, and let AI help you modify and enhance your recipes.",
  },
};

export default function CreateRecipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
