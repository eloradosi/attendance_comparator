"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Clipboard, Users } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const displayName = user?.displayName || user?.email || "User";
  const firstName = displayName.split(" ")[0];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-semibold mb-2">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-gray-600 mb-4">
              This is your central dashboard. Use the menu to access tools and
              reports — start by opening the Attendance Comparator or logging
              today's activity.
            </p>
            {/* Navigation to comparator is available in the header; duplicate CTA removed */}
          </section>

          <aside className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Account</h3>
            <div className="text-sm text-gray-700">
              <div className="font-medium">{displayName}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              No other tools yet — stay tuned.
            </div>
          </aside>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/compare"
            className="group block bg-white p-5 rounded-lg shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Attendance Comparator
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload timesheets and compare attendances to find differences
                  quickly.
                </p>
                <Button variant="outline" size="sm" className="px-3">
                  Open Comparator
                </Button>
              </div>
            </div>
          </Link>

          <Link
            href="/activity"
            className="group block bg-white p-5 rounded-lg shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-md bg-amber-50 text-amber-600">
                <Clipboard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Activity Log</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add or update your daily activity (On duty / Off duty / Idle).
                </p>
                <Button variant="outline" size="sm" className="px-3">
                  View Your Logs
                </Button>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/all-activities"
            className="group block bg-white p-5 rounded-lg shadow hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-md bg-green-50 text-green-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">All Activities</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Admin view: aggregated activity logs from all users (local
                  demo).
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
