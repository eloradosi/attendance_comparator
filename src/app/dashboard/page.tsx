"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
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
              reports — for now you can open the Attendance Comparator.
            </p>
            {/* Navigation to comparator is available in the header; remove duplicate CTA */}
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
      </DashboardLayout>
    </AuthGuard>
  );
}
