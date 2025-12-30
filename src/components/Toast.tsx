"use client";

import { useEffect, useState } from "react";

type ToastItem = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

export function showToast(
  message: string,
  type: "success" | "error" | "info" = "success"
) {
  const ev = new CustomEvent("app-toast", { detail: { message, type } });
  window.dispatchEvent(ev);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: any) => {
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
      const t: ToastItem = {
        id,
        message: e.detail.message,
        type: e.detail.type,
      };
      setToasts((s) => [...s, t]);
      // auto remove
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener("app-toast", onToast as EventListener);
    return () =>
      window.removeEventListener("app-toast", onToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-xs w-full px-4 py-2 rounded shadow-md text-sm ${
            t.type === "success" || t.type === "info"
              ? "bg-green-50 text-green-800"
              : t.type === "error"
              ? "bg-red-50 text-red-800"
              : "bg-green-50 text-green-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
