"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Clipboard, Users } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
// use native <img> for remote avatars to avoid next/image host config and restart

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const displayName = user?.displayName || user?.email || "User";
  const firstName = displayName.split(" ")[0];
  const photoURL =
    user?.photoURL ||
    "https://ui-avatars.com/api/?name=" + encodeURIComponent(firstName);
  const [avatarUrl, setAvatarUrl] = useState<string>(photoURL);

  useEffect(() => {
    // Only generate avatar if user data is loaded
    if (!user) return;

    // Always use fun DiceBear avatar for dashboard (even if Google photo exists)
    // This gives consistent, playful character avatars for all users
    try {
      const seedKey = user?.uid
        ? `dashboardAvatarSeed:${user.uid}`
        : `dashboardAvatarSeed:anon`;
      let seed = sessionStorage.getItem(seedKey);
      if (!seed) {
        seed = `${firstName}-${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(seedKey, seed);
      }

      // Use DiceBear v7 API with big-smile style (fun characters with big smiles)
      const dicebear = `https://api.dicebear.com/7.x/big-smile/svg?seed=${encodeURIComponent(
        seed
      )}&backgroundColor=ffffff`;
      console.log("Setting DiceBear avatar:", dicebear);
      setAvatarUrl(dicebear);
    } catch (e) {
      console.error("Avatar generation error:", e);
      // Fallback to Google photo or default if DiceBear fails
      setAvatarUrl(user?.photoURL || photoURL);
    }
  }, [user, firstName, photoURL]);

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* HEADER WITH PROFILE */}
        <div className="flex items-center gap-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Profile"
              width={70}
              height={70}
              style={{ width: 70, height: 70 }}
              className="rounded-full shadow-md border object-cover"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-indigo-700">
              Hi {firstName}! 👋
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Hope you're having a productive day — let's get things moving ✨
            </p>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href="/compare"
            className="group block rounded-xl p-6 border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all bg-blue-100/60 border-blue-200"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-200 text-blue-700 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-blue-700 transition">
                  Attendance Comparator 📊
                </h3>
                <p className="text-sm text-gray-700 mt-1 mb-4 leading-relaxed">
                  Compare two attendance files and detect mismatches instantly.
                </p>
                <Button variant="outline" size="sm" className="px-3">
                  Open Comparator
                </Button>
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/activity"
            className="group block rounded-xl p-6 border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all bg-amber-100/60 border-amber-200"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-200 text-amber-700 shadow-inner">
                <Clipboard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-amber-700 transition">
                  Activity Log 📝
                </h3>
                <p className="text-sm text-gray-700 mt-1 mb-4 leading-relaxed">
                  Track your daily On/Off duty or Idle activities.
                </p>
                <Button variant="outline" size="sm" className="px-3">
                  View Your Logs
                </Button>
              </div>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/dashboard/all-activities"
            className="group block rounded-xl p-6 border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all bg-green-100/60 border-green-200"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-green-200 text-green-700 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-green-700 transition">
                  All Activities 👥
                </h3>
                <p className="text-sm text-gray-700 mt-1 mb-4 leading-relaxed">
                  Admin-only aggregated activity logs view.
                </p>
                <Button variant="outline" size="sm" className="px-3">
                  Open Admin View
                </Button>
              </div>
            </div>
          </Link>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
