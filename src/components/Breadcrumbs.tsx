"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center">
              {!isLast && it.href ? (
                <Link href={it.href} className="hover:underline text-gray-600">
                  {it.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? "text-gray-800 font-medium" : "text-gray-600"
                  }
                >
                  {it.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
