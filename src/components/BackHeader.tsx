"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  href?: string; // if provided, the arrow links to this href; otherwise go back
  onBack?: () => void;
};

export default function BackHeader({ title, href, onBack }: Props) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      setIsDarkMode(saved !== null ? saved === "true" : false);
    }
  }, []);

  return (
    <div className="flex items-center gap-3 relative z-40">
      {href ? (
        <Link
          href={href}
          onClick={() => {
            try {
              console.debug("BackHeader: link clicked", { href });
              // allow parent to run cleanup before navigation
              onBack && onBack();
            } catch (e) {
              console.warn("BackHeader onBack failed", e);
            }
          }}
          className="inline-flex items-center justify-center w-8 h-8 pointer-events-auto"
          aria-label="back"
        >
          <ArrowLeft
            className={`w-6 h-6 ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            }`}
          />
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            try {
              console.debug("BackHeader: button clicked");
              if (onBack) return onBack();
            } catch (e) {
              console.warn("BackHeader onBack failed", e);
            }
            router.back();
          }}
          className="inline-flex items-center justify-center w-8 h-8 pointer-events-auto"
          aria-label="back"
        >
          <ArrowLeft
            className={`w-6 h-6 ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            }`}
          />
        </button>
      )}

      <h1
        className={`text-2xl font-semibold ${isDarkMode ? "text-white" : ""}`}
      >
        {title}
      </h1>
    </div>
  );
}
