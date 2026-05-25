"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserPlus, Mail, Lock, User, Loader2, CheckCircle, Flame } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { needsEmailConfirmation } = await signUp(email, password, username);
      
      if (needsEmailConfirmation) {
        setShowConfirmation(true);
      } else {
        // Auto-logged in, redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 p-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Check your email!</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. 
            Click the link to activate your account.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              After confirming, you can{" "}
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
            <Flame className="h-6 w-6 text-white fire-icon" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Create account</h1>
          <p className="text-muted-foreground">
            Sign up to start creating recipes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
