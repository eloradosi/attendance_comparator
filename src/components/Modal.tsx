"use client";

import { ReactNode } from "react";

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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded shadow-lg z-10 w-full max-w-md mx-4">
        {title && (
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">{title}</h3>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
