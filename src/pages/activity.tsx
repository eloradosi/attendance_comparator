"use client";

import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import ActivityList from "@/components/activity/ActivityList";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";
import ToastContainer from "@/components/Toast";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useSidebar } from "@/hooks/useSidebar";

export default function ActivityPage() {
  const [user, setUser] = useState<User | null>(null);
  const sidebarExpanded = useSidebar();

  // 🌙 Dark mode
  const [isDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });

  // 🧠 Local state: apakah user sudah submit activity hari ini
  const [hasActivityToday, setHasActivityToday] = useState(false);

  // ⏰ Time awareness
  const now = useMemo(() => new Date(), []);
  const isAfterMidnight = now.getHours() >= 0; // rule sudah aktif setelah 00:00

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const authInstance = await getFirebaseAuth();
      unsub = onAuthStateChanged(authInstance, (u) => setUser(u));
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:navigated"));
    } catch {}
  }, []);

  /**
   * 👉 Callback ini dipanggil setelah user berhasil add activity
   * Idealnya dipanggil dari ActivityList
   */
  const handleActivityAdded = () => {
    setHasActivityToday(true);
  };

  /**
   * RULE:
   * - Warning hanya tampil jika:
   *   - user BELUM punya activity hari ini
   */
  const showWarning = !hasActivityToday;

  return (
    <AuthGuard>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
            : "bg-gradient-to-br from-white via-gray-50 to-gray-100"
        }`}
      >
        <Sidebar />

        <div
          className={`p-4 md:p-6 transition-all duration-300 ${
            sidebarExpanded ? "md:ml-64" : "md:ml-20"
          } ml-0 mt-12 md:mt-0`}
        >
          <div className="container mx-auto max-w-7xl">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <BackHeader title="Activity Log" path="/dashboard" />
                <div className="mt-4">
                  <Breadcrumbs
                    items={[
                      { path: "/dashboard", label: "Dashboard" },
                      { label: "Activity Log" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <hr
              className={`my-6 border-t ${
                isDarkMode ? "border-white/10" : "border-gray-200"
              }`}
            />

            {/* ⚠️ GLOBAL RULE / WARNING */}
            {showWarning && (
              <div
                className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                  isDarkMode
                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                    : "border-yellow-300 bg-yellow-50 text-yellow-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div className="space-y-1">
                    <p className="font-medium">One activity per day only.</p>

                    {isAfterMidnight ? (
                      <p>
                        No log after <b>12 AM</b>? The system will automatically
                        mark it as <b>Idle</b>.
                      </p>
                    ) : (
                      <p>
                        Make sure to submit today’s activity before <b>12 AM</b>
                        .
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 📦 MAIN CONTENT CARD */}
            <section
              className={`p-4 rounded-lg backdrop-blur-sm border ${
                isDarkMode
                  ? "bg-white/10 border-white/20"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* 
                🔌 NEXT LEVEL:
                ActivityList idealnya menerima callback ini.
                Kalau belum ada, UI tetap aman — warning hanya hilang
                jika callback dipanggil.
              */}
              <ActivityList onActivityAdded={handleActivityAdded} />
            </section>
          </div>
        </div>

        <ToastContainer />
      </div>
    </AuthGuard>
  );
}
