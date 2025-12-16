"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSidebar } from "@/hooks/useSidebar";

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const sidebarExpanded = useSidebar();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-y-0 left-0 right-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
        sidebarExpanded ? "md:left-64" : "md:left-20"
      }`}
    >
      <div
        className="absolute inset-0 z-[9998] bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded-xl shadow-lg z-[10000] w-full max-w-md mx-4 relative">
        {title && (
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">{title}</h3>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
