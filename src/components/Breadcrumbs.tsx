"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Crumb = { href?: string; label: string; onClick?: () => void };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      setIsDarkMode(saved !== null ? saved === "true" : false);
    }
  }, []);

  const baseText = isDarkMode ? "text-gray-300" : "text-gray-600";
  const lastText = isDarkMode
    ? "text-white font-medium"
    : "text-gray-800 font-medium";
  const chevronColor = isDarkMode ? "text-gray-400" : "text-gray-400";

  return (
    <nav className={`text-sm ${baseText} mb-4`} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center">
              {!isLast && it.href ? (
                it.onClick ? (
                  <button
                    type="button"
                    onClick={it.onClick}
                    className={`hover:underline ${baseText} bg-transparent p-0 m-0`}
                  >
                    {it.label}
                  </button>
                ) : (
                  <Link
                    href={it.href}
                    className={`hover:underline ${baseText}`}
                  >
                    {it.label}
                  </Link>
                )
              ) : (
                <span className={isLast ? lastText : baseText}>{it.label}</span>
              )}
              {!isLast && (
                <ChevronRight className={`w-4 h-4 ${chevronColor} mx-2`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
