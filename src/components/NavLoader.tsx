"use client";

import { useEffect, useState } from "react";

export default function NavLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onStart = () => setLoading(true);
    const onEnd = () => setLoading(false);
    window.addEventListener("app:navigate", onStart as EventListener);
    window.addEventListener("app:navigated", onEnd as EventListener);

    return () => {
      window.removeEventListener("app:navigate", onStart as EventListener);
      window.removeEventListener("app:navigated", onEnd as EventListener);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-40 pointer-events-none">
      <div className="pointer-events-auto bg-white/5 backdrop-blur-sm rounded-md p-4 flex items-center gap-3">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-white/80" />
        <div className="text-sm text-white">Loading…</div>
      </div>
    </div>
  );
}
