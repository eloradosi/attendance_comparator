"use client";

import { ReactNode, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ToastContainer from "@/components/Toast";
import { useSidebar } from "@/hooks/useSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const sidebarExpanded = useSidebar();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setIsDarkMode(sessionStorage.getItem("isDarkMode") === "true");
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "" : "bg-gradient-to-br from-white via-gray-50 to-gray-100"
      }`}
    >
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarExpanded ? "md:ml-64" : "md:ml-20"
        } ml-0 mt-16 md:mt-0`}
      >
        <Navbar />
        <main className="p-4 md:p-8">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
