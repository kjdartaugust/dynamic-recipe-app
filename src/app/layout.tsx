import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { AuthProvider } from "@/contexts/auth-context";
import { RecipeChatbot } from "@/components/recipe-chatbot";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Dynamic Recipe App - AI-Powered Recipe Management",
    template: "%s | Dynamic Recipe App",
  },
  description:
    "AI-powered recipe management application. Scan ingredients with AI, modify recipes naturally, and cook hands-free with voice control.",
  keywords: [
    "recipes",
    "cooking",
    "AI",
    "food",
    "meal planning",
    "ingredient scanner",
    "voice control",
  ],
  authors: [{ name: "Dynamic Recipe App" }],
  creator: "Dynamic Recipe App",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Dynamic Recipe App",
    title: "Dynamic Recipe App - AI-Powered Recipe Management",
    description:
      "AI-powered recipe management application. Scan ingredients with AI, modify recipes naturally, and cook hands-free with voice control.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynamic Recipe App - AI-Powered Recipe Management",
    description:
      "AI-powered recipe management application. Scan ingredients with AI, modify recipes naturally, and cook hands-free with voice control.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider>
          <Navigation />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
          <RecipeChatbot />
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
