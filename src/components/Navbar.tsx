import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import GoogleAuth from "@/components/GoogleAuth";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition cursor-pointer"
          >
            AttendanceApp
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:opacity-90 transition"
          >
            <GoogleAuth mode="display" />
            <ChevronDown size={18} className="text-gray-500" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg py-2 z-50">
              <GoogleAuth mode="actions" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
