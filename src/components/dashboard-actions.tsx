"use client";

import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { RecipeUrlImporter } from "./recipe-url-importer";

export function DashboardActions() {
  const [showImporter, setShowImporter] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <a
          href="/recipes/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Recipe
        </a>
        <button
          onClick={() => setShowImporter(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <Link2 className="h-4 w-4" />
          Import URL
        </button>
      </div>

      {showImporter && (
        <RecipeUrlImporter onClose={() => setShowImporter(false)} />
      )}
    </>
  );
}
