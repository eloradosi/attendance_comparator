"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { clearAppToken } from "@/lib/api";
import { showToast } from "@/components/Toast";
import { getApiUrl } from "@/lib/runtimeConfig";

export default function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Update lastPath in sessionStorage on every route change
  useEffect(() => {
    if (typeof window !== "undefined" && pathname && pathname !== "/login") {
      sessionStorage.setItem("lastPath", pathname);
    }
  }, [pathname]);

  // === AUTO LOGOUT IF IDLE ===
  useEffect(() => {
    let idleTimer: NodeJS.Timeout | null = null;
    const IDLE_LIMIT = 15 * 60 * 1000; // 15 menit

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(async () => {
        showToast("Logged out due to inactivity", "error");
        try {
          const authInstance = await getFirebaseAuth();
          await signOut(authInstance);
        } catch (error) {
          console.error("Sign out failed:", error);
        }
        clearAppToken();
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("lastPath");
        }
        router.replace("/login");
      }, IDLE_LIMIT);
    };

    // Event yang dianggap aktivitas user
    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "scroll",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, resetIdle));
    resetIdle(); // start timer on mount

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
    };
  }, [router]);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        const authInstance = await getFirebaseAuth();
        unsub = onAuthStateChanged(authInstance, async (user) => {
          if (!user) {
            // If not logged in, redirect to login page; preserve intended path
            const redirectTo = encodeURIComponent(pathname || "/");
            router.replace(`/login?next=${redirectTo}`);
          } else {
            // Check backend connectivity
            try {
              const apiUrl = await getApiUrl();
              // Test backend connectivity using existing endpoint
              const testUrl = `${apiUrl.replace(
                /\/$/,
                ""
              )}/api/logbook/my?page=0&size=1`;
              const response = await fetch(testUrl, {
                method: "GET", // Use GET instead of HEAD to avoid CORS issues
                signal: AbortSignal.timeout(5000), // 5 second timeout
              });

              // Accept 200 OK or 401 Unauthorized (backend reachable, just need auth)
              if (!response.ok && response.status !== 401 && response.status !== 403) {
                throw new Error(`Backend returned ${response.status}`);
              }

              // Backend OK, proceed
              setBackendError(null);

              // If user is authenticated and trying to access /login, redirect to lastPath or dashboard
              if (pathname === "/login") {
                const lastPath =
                  typeof window !== "undefined"
                    ? sessionStorage.getItem("lastPath")
                    : null;
                if (lastPath && lastPath !== "/login") {
                  router.replace(lastPath);
                } else {
                  router.replace("/dashboard");
                }
              } else {
                setReady(true);
              }
            } catch (backendErr) {
              // Backend connectivity failed
              console.error("Backend connectivity check failed:", backendErr);
              setBackendError(
                "Cannot connect to backend API. Please check your configuration or try again later."
              );
              setReady(true); // Show error instead of loading forever
            }
          }
        });
      } catch (error) {
        console.error("Auth listener setup failed:", error);
        setReady(true);
      }
    };

    setupAuthListener();

    return () => {
      if (unsub) unsub();
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Checking authentication...</div>
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // If backend error, show error page and block access
  if (backendError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Backend Connection Error
          </h2>
          <p className="text-gray-600 mb-6">{backendError}</p>
          <button
            onClick={async () => {
              try {
                const authInstance = await getFirebaseAuth();
                await signOut(authInstance);
                clearAppToken();
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("lastPath");
                }
                router.push("/login");
              } catch (err) {
                console.error("Sign out failed:", err);
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sign Out and Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
