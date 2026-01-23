"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { clearAppToken } from "@/lib/api";
import { showToast } from "@/components/Toast";

// ⚠️ TEMPORARY BYPASS FOR FRONTEND DEVELOPMENT ⚠️
const TEMP_BYPASS_AUTH = false; // Set to false when backend is ready
// ⚠️ END TEMPORARY BYPASS ⚠️

export default function AuthGuard({ children }: PropsWithChildren) {
  // If bypass is enabled, render children immediately
  if (TEMP_BYPASS_AUTH) {
    return <>{children}</>;
  }

  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

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
        } catch (error) {}
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
          }
        });
      } catch (error) {
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

  return <>{children}</>;
}
