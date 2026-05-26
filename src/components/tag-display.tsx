"use client";

import { Tag } from "lucide-react";
import Link from "next/link";

interface TagData {
  id: string;
  name: string;
  slug: string;
}

interface TagDisplayProps {
  tags: TagData[];
  size?: "sm" | "md";
  clickable?: boolean;
}

export function TagDisplay({ tags, size = "sm", clickable = false }: TagDisplayProps) {
  if (!tags || tags.length === 0) return null;

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-xs"
    : "px-3 py-1 text-sm";

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const content = (
          <span
            className={`inline-flex items-center gap-1 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 ${sizeClasses} ${clickable ? "hover:border-orange-400 hover:shadow-sm transition-all cursor-pointer" : ""}`}
          >
            <Tag className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
            {tag.name}
          </span>
        );

        if (clickable) {
          return (
            <Link key={tag.id} href={`/dashboard?tag=${tag.slug}`}>
              {content}
            </Link>
          );
        }

        return <span key={tag.id}>{content}</span>;
      })}
    </div>
  );
}
