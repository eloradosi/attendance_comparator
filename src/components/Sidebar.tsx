import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FileText, Clipboard, Users, TrendingUp, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { clearAppToken } from "@/lib/api";

export default function Sidebar() {
  const router = useRouter();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("sidebarExpanded");
      return saved === "true";
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });
  const pathname = router.pathname;

  useEffect(() => {
    sessionStorage.setItem("sidebarExpanded", String(sidebarExpanded));
  }, [sidebarExpanded]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = sessionStorage.getItem("isDarkMode");
      setIsDarkMode(saved !== null ? saved === "true" : false);
    };

    window.addEventListener("storage", handleStorageChange);
    // Poll sessionStorage for changes (since storage event doesn't fire in same tab)
    const interval = setInterval(() => {
      const saved = sessionStorage.getItem("isDarkMode");
      const current = saved !== null ? saved === "true" : false;
      if (current !== isDarkMode) {
        setIsDarkMode(current);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isDarkMode]);

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearAppToken();
      router.push("/login");
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`md:hidden fixed top-4 left-4 z-[60] w-10 h-10 rounded-lg border flex items-center justify-center transition ${
          isDarkMode
            ? "bg-teal-900/90 border-teal-700/30 hover:bg-teal-800"
            : "bg-white border-gray-300 hover:bg-gray-100"
        }`}
      >
        <svg
          className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className={`fixed left-0 top-0 h-full backdrop-blur-sm border-r flex flex-col py-6 transition-all duration-300 cursor-pointer z-50 ${
          sidebarExpanded ? "w-64" : "w-20"
        } ${
          isDarkMode
            ? "bg-teal-950/80 border-teal-800/30"
            : "bg-white/80 border-gray-200"
        } ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-[#0c988d] to-[#09867e] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          {sidebarExpanded && (
            <span
              className={`text-xl font-bold whitespace-nowrap ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ATLAS
            </span>
          )}
        </div>

        <nav
          className="flex flex-col gap-2 px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("app:navigate"));
              router.push("/dashboard");
            }}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition group w-full text-left ${
              sidebarExpanded ? "" : "justify-center"
            } ${
              isActive("/dashboard")
                ? isDarkMode
                  ? "bg-green-500/20 border-green-500/30 hover:bg-green-500/30"
                  : "bg-green-100 border-green-300 hover:bg-green-200"
                : isDarkMode
                ? "hover:bg-white/10 border-transparent"
                : "hover:bg-gray-200 border-transparent"
            }`}
          >
            <FileText
              className={`w-5 h-5 flex-shrink-0 ${
                isActive("/dashboard")
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            />
            {sidebarExpanded && (
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isActive("/dashboard")
                    ? isDarkMode
                      ? "text-white"
                      : "text-gray-900"
                    : isDarkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                Dashboard
              </span>
            )}
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("app:navigate"));
              router.push("/activity");
            }}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition group w-full text-left ${
              sidebarExpanded ? "" : "justify-center"
            } ${
              isActive("/activity")
                ? isDarkMode
                  ? "bg-green-500/20 border-green-500/30 hover:bg-green-500/30"
                  : "bg-green-100 border-green-300 hover:bg-green-200"
                : isDarkMode
                ? "hover:bg-white/10 border-transparent"
                : "hover:bg-gray-200 border-transparent"
            }`}
          >
            <Clipboard
              className={`w-5 h-5 flex-shrink-0 ${
                isActive("/activity")
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            />
            {sidebarExpanded && (
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isActive("/activity")
                    ? isDarkMode
                      ? "text-white"
                      : "text-gray-900"
                    : isDarkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                Activity Log
              </span>
            )}
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("app:navigate"));
              router.push("/compare");
            }}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition group w-full text-left ${
              sidebarExpanded ? "" : "justify-center"
            } ${
              isActive("/compare")
                ? isDarkMode
                  ? "bg-green-500/20 border-green-500/30 hover:bg-green-500/30"
                  : "bg-green-100 border-green-300 hover:bg-green-200"
                : isDarkMode
                ? "hover:bg-white/10 border-transparent"
                : "hover:bg-gray-200 border-transparent"
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 flex-shrink-0 ${
                isActive("/compare")
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            />
            {sidebarExpanded && (
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isActive("/compare")
                    ? isDarkMode
                      ? "text-white"
                      : "text-gray-900"
                    : isDarkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                Attendance Comparator
              </span>
            )}
          </button>
        </nav>

        {/* Sign Out Button at Bottom */}
        <div className="mt-auto px-3 pb-4">
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition w-full ${
              sidebarExpanded ? "" : "justify-center"
            } ${
              isDarkMode
                ? "hover:bg-red-500/20 border-transparent hover:border-red-500/30"
                : "hover:bg-red-50 border-transparent hover:border-red-200"
            }`}
          >
            <LogOut
              className={`w-5 h-5 flex-shrink-0 ${
                isDarkMode ? "text-red-400" : "text-red-600"
              }`}
            />
            {sidebarExpanded && (
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isDarkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                Sign Out
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
