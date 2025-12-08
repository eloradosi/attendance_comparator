"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import ActivityList from "@/components/activity/ActivityList";
import Breadcrumbs from "@/components/Breadcrumbs";
import { auth } from "@/lib/firebaseClient";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

export default function ActivityPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const displayName = user?.displayName || user?.email || "User";

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen py-8">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold">Activity Log</h1>
                <div className="mt-2">
                  <Breadcrumbs
                    items={[
                      { href: "/dashboard", label: "Dashboard" },
                      { label: "Activity Log" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <hr className="my-6 border-t border-gray-200" />

            <section className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 mb-6">
                Add and manage daily activity logs. You can create or edit logs
                only for today; past logs are read-only.
              </p>
              <ActivityList />
            </section>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
