"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Flame,
  Refrigerator,
  LayoutDashboard,
  Globe,
  Calendar,
  Settings,
  BarChart3,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expiringCount, setExpiringCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchExpiringCount = () => {
    if (!user) return;
    fetch("/api/fridge/expiring-count")
      .then((r) => r.json())
      .then((d) => {
        const count = typeof d.count === "number" ? d.count : 0;
        setExpiringCount(count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchExpiringCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchExpiringCount, 30000);
    // Refresh on window focus and visibility change (for mobile)
    const onFocus = () => fetchExpiringCount();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") fetchExpiringCount();
    });
    // Listen for fridge changes from other pages
    const onFridgeUpdate = (e: any) => {
      const count = e.detail?.count;
      if (typeof count === "number") setExpiringCount(count);
    };
    window.addEventListener("fridge-updated", onFridgeUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("fridge-updated", onFridgeUpdate);
    };
  }, [user]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { href: "/fridge", label: "My Kitchen", icon: Refrigerator },
    { href: "/dashboard", label: "My Recipes", icon: LayoutDashboard },
    { href: "/explore", label: "Explore", icon: Globe },
    { href: "/meal-plan", label: "Meal Plan", icon: Calendar },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const userInitials = user?.user_metadata?.username
    ? user.user_metadata.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Flame className="h-5 w-5 fire-icon" />
            </div>
            <span className="hidden sm:inline gradient-text">ZeroWaste Chef</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  pathname === item.href
                    ? "bg-orange-50 text-orange-600"
                    : "text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                  {item.href === "/fridge" && expiringCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold px-1 rounded-full ml-1">
                      {expiringCount > 99 ? "99+" : expiringCount}
                    </span>
                  )}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {userInitials}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-orange-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-orange-100">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.user_metadata?.username || user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Profile & Settings
                    </Link>
                    <Link
                      href="/stats"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Stats & Impact
                    </Link>
                    <Link
                      href="/shopping-list"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Shopping List
                    </Link>
                    <div className="border-t border-orange-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          handleSignOut();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm btn-gradient text-white rounded-lg font-medium"
                >
                  <User className="h-4 w-4" />
                  Get Started
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
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-orange-50 text-orange-600"
                      : "text-muted-foreground hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.href === "/fridge" && expiringCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold px-1 rounded-full ml-1">
                      {expiringCount > 99 ? "99+" : expiringCount}
                    </span>
                  )}
                </Link>
              ))}
              <div className="border-t border-orange-100 mt-2 pt-2">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Profile & Settings
                    </Link>
                    <Link
                      href="/stats"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Stats & Impact
                    </Link>
                    <Link
                      href="/shopping-list"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Shopping List
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 text-sm btn-gradient text-white rounded-lg font-medium"
                    >
                      <User className="h-4 w-4" />
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
