"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Crumb = { path?: string; label: string; onClick?: () => void };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const router = useRouter();
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
              {!isLast && (it.path || it.onClick) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (it.onClick) {
                      it.onClick();
                    } else if (it.path) {
                      router.push(it.path);
                    }
                  }}
                  className={`hover:underline ${baseText} bg-transparent p-0 m-0 cursor-pointer`}
                >
                  {it.label}
                </button>
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
