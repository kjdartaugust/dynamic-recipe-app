"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ChefHat, Plus, LayoutDashboard, Menu, X, LogIn, LogOut, User, Flame } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recipes/create", label: "Create Recipe", icon: Plus },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Flame className="h-5 w-5 fire-icon" />
            </div>
            <span className="hidden sm:inline gradient-text">Dynamic Recipe App</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-orange-600",
                  pathname === item.href
                    ? "text-orange-600"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user.user_metadata?.username || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-muted-foreground hover:text-orange-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                    pathname === "/login"
                      ? "bg-orange-50 text-orange-600 border border-orange-200"
                      : "text-muted-foreground hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-sm btn-gradient text-white rounded-lg font-medium"
                >
                  <User className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-orange-600" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-orange-100">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-orange-50 text-orange-600"
                      : "text-muted-foreground hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-orange-100 pt-2 mt-2">
                {user ? (
                  <>
                    <span className="px-3 py-2 text-sm text-muted-foreground block">
                      {user.user_metadata?.username || user.email}
                    </span>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-orange-50 hover:text-orange-600 rounded-lg w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg font-medium"
                    >
                      <User className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
