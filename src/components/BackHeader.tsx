"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  path?: string; // if provided, the arrow navigates to this path; otherwise go back
  onBack?: () => void;
};

export default function BackHeader({ title, path, onBack }: Props) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      setIsDarkMode(saved !== null ? saved === "true" : false);
    }
  }, []);

  return (
    <div className="flex items-center gap-2 md:gap-3 relative z-40">
      <button
        type="button"
        onClick={() => {
          try {
            console.debug("BackHeader: button clicked", { path });
            // allow parent to run cleanup before navigation
            if (onBack) onBack();

            // Navigate to path or go back
            if (path) {
              router.push(path);
            } else {
              router.back();
            }
          } catch (e) {
            console.warn("BackHeader onClick failed", e);
          }
        }}
        className="inline-flex items-center justify-center w-8 h-8 pointer-events-auto cursor-pointer flex-shrink-0"
        aria-label="back"
      >
        <ArrowLeft
          className={`w-5 h-5 md:w-6 md:h-6 ${
            isDarkMode ? "text-gray-200" : "text-gray-700"
          }`}
        />
      </button>

      <h1
        className={`text-xl md:text-2xl font-semibold ${
          isDarkMode ? "text-white" : ""
        }`}
      >
        {title}
      </h1>
    </div>
  );
}
