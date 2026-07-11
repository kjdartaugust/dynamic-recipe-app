"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  BookOpen,
  Refrigerator,
  Star,
  ShieldCheck,
  Activity,
  Trash2,
  EyeOff,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Metrics {
  users: number;
  newUsersLast30Days: number;
  recipes: number;
  publicRecipes: number;
  privateRecipes: number;
  fridgeItems: number;
  ratings: number;
  collections: number;
}

interface AdminUserRow {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
  is_admin: boolean;
  recipeCount: number;
}

interface AdminRecipeRow {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  author: string;
}

interface CronRun {
  job: string;
  ran_at: string;
  ok: boolean;
  sent: number;
  detail: string | null;
}

interface Health {
  env: Record<string, boolean>;
  crons: Array<{ job: string; lastRun: CronRun | null }>;
}

type Tab = "metrics" | "users" | "recipes" | "health";

const TABS: Array<{ id: Tab; label: string; icon: typeof Users }> = [
  { id: "metrics", label: "Metrics", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "recipes", label: "Moderation", icon: BookOpen },
  { id: "health", label: "System", icon: ShieldCheck },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("metrics");

  return (
    <div className="container mx-auto px-4 max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Metrics, moderation, and system health for ZeroWaste Chef.
        </p>
      </div>

      <div className="flex gap-1 border-b border-orange-100 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === t.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-muted-foreground hover:text-orange-600"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "metrics" && <MetricsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "recipes" && <RecipesTab />}
      {tab === "health" && <HealthTab />}
    </div>
  );
}

function MetricsTab() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load metrics"))))
      .then(setMetrics)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!metrics) return <Loading />;

  const cards = [
    { label: "Users", value: metrics.users, sub: `+${metrics.newUsersLast30Days} in 30d`, icon: Users },
    { label: "Recipes", value: metrics.recipes, sub: `${metrics.publicRecipes} public · ${metrics.privateRecipes} private`, icon: BookOpen },
    { label: "Fridge items", value: metrics.fridgeItems, sub: "tracked ingredients", icon: Refrigerator },
    { label: "Ratings", value: metrics.ratings, sub: `${metrics.collections} collections`, icon: Star },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-orange-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
            <c.icon className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">{c.value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (q: string, signal: AbortSignal) => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) {
      setError("Failed to load users");
      return;
    }
    const data = await res.json();
    setUsers(data.users);
  }, []);

  // Abort the in-flight request when the query changes, so a slow response
  // for an old query can't land after — and overwrite — a newer one.
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      load(query, controller.signal).catch((e: Error) => {
        if (e.name !== "AbortError") setError("Failed to load users");
      });
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, load]);

  const remove = async (u: AdminUserRow) => {
    // Irreversible and cascades to all their content, so make the blast
    // radius explicit before doing it.
    const confirmed = window.confirm(
      `Permanently delete ${u.username} (${u.email ?? "no email"})?\n\n` +
        `This also deletes their ${u.recipeCount} recipe(s), fridge items, ratings and collections. This cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(u.id);
    const res = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
    setBusy(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed to delete user" }));
      setError(body.error ?? "Failed to delete user");
      return;
    }
    setUsers((prev) => prev?.filter((x) => x.id !== u.id) ?? null);
  };

  return (
    <div className="space-y-4">
      {error && <ErrorNote message={error} />}
      <SearchBox value={query} onChange={setQuery} placeholder="Search by username or email…" />

      {!users ? (
        <Loading />
      ) : users.length === 0 ? (
        <Empty message="No users match that search." />
      ) : (
        <div className="rounded-xl border border-orange-100 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Recipes</th>
                <th className="px-4 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-orange-50">
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      {u.username}
                      {u.is_admin && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">{u.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.recipeCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(u)}
                      disabled={u.is_admin || busy === u.id}
                      title={u.is_admin ? "Revoke is_admin in SQL before deleting" : "Delete user"}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {busy === u.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecipesTab() {
  const [recipes, setRecipes] = useState<AdminRecipeRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (q: string, signal: AbortSignal) => {
    const res = await fetch(`/api/admin/recipes?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) {
      setError("Failed to load recipes");
      return;
    }
    const data = await res.json();
    setRecipes(data.recipes);
  }, []);

  // See UsersTab: abort in-flight requests so stale results can't overwrite
  // newer ones.
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      load(query, controller.signal).catch((e: Error) => {
        if (e.name !== "AbortError") setError("Failed to load recipes");
      });
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, load]);

  const unpublish = async (r: AdminRecipeRow) => {
    setBusy(r.id);
    // The endpoint is takedown-only; it does not accept an is_public flag.
    const res = await fetch("/api/admin/recipes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id }),
    });
    setBusy(null);

    if (!res.ok) {
      setError("Failed to unpublish recipe");
      return;
    }
    setRecipes((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
  };

  return (
    <div className="space-y-4">
      {error && <ErrorNote message={error} />}
      <p className="text-sm text-muted-foreground">
        Public recipes currently visible on <span className="font-medium">/explore</span>.
        Unpublishing hides a recipe from the community but keeps it in the author&apos;s account.
      </p>
      <SearchBox value={query} onChange={setQuery} placeholder="Search recipe titles…" />

      {!recipes ? (
        <Loading />
      ) : recipes.length === 0 ? (
        <Empty message="No public recipes match that search." />
      ) : (
        <div className="grid gap-3">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-orange-100 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  by {r.author} · {formatDate(r.created_at)}
                </div>
                {r.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {r.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => unpublish(r)}
                disabled={busy === r.id}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                <EyeOff className="h-3.5 w-3.5" />
                {busy === r.id ? "Hiding…" : "Unpublish"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthTab() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/health")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load system health"))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!health) return <Loading />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-orange-100 bg-white p-5">
        <h2 className="font-semibold mb-1">Scheduled jobs</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Both run daily at 09:00 UTC via Vercel Cron.
        </p>
        <div className="space-y-3">
          {health.crons.map((c) => (
            <div key={c.job} className="rounded-lg border border-orange-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{c.job}</span>
                {c.lastRun ? (
                  <StatusPill ok={c.lastRun.ok} />
                ) : (
                  <span className="text-xs text-muted-foreground">never run</span>
                )}
              </div>
              {c.lastRun && (
                <div className="text-xs text-muted-foreground mt-1.5">
                  {new Date(c.lastRun.ran_at).toLocaleString()} · {c.lastRun.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-orange-100 bg-white p-5">
        <h2 className="font-semibold mb-1">Configuration</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Whether each key is present. Values are never exposed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries(health.env).map(([key, set]) => (
            <div key={key} className="flex items-center justify-between text-sm py-0.5">
              <span className="text-muted-foreground">{key}</span>
              {set ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded",
        ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      )}
    >
      {ok ? "OK" : "Failed"}
    </span>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-orange-100 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}

function Loading() {
  return <div className="text-sm text-muted-foreground py-8">Loading…</div>;
}

function Empty({ message }: { message: string }) {
  return <div className="text-sm text-muted-foreground py-8">{message}</div>;
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
      {message}
    </div>
  );
}
