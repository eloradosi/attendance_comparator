"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
      <ToastContainer />
    </div>
  );
}
