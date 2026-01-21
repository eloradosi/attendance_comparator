"use client";

import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";
import ToastContainer from "@/components/Toast";
import Dropdown from "@/components/ui/dropdown";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useSidebar } from "@/hooks/useSidebar";
import SlideLoader from "@/components/SlideLoader";
import { parsePdf, parseIHcsPdf } from "@/utils/parsePdf";
import { timesheetExcel } from "@/components/service";

export default function TimesheetPreviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const sidebarExpanded = useSidebar();
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [selectedVendor, setSelectedVendor] = useState<string>("MII");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().getMonth().toString(),
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [ihcsFile, setIhcsFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  // Handle dark mode from sessionStorage after mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      setIsDarkMode(saved === "true");
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    getFirebaseAuth().then((auth) => {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const vendors = ["IGLO", "SDD", "MII"];

  const handleIhcsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIhcsFile(e.target.files[0]);
    }
  };

  const handleDownload = async () => {
    setError("");

    if (!ihcsFile) {
      setError("Please upload IHCS file");
      return;
    }

    try {
      setIsLoading(true);

      // Parse IHCS file
      console.log("📄 Parsing IHCS file:", ihcsFile.name);

      // Extract employee metadata
      const meta = await parseIHcsPdf(ihcsFile);
      console.log("👤 Employee metadata:", meta);

      // Parse attendance rows from IHCS
      const ihcsData = await parsePdf(ihcsFile, {
        vendor:
          selectedVendor === "MII"
            ? "MII"
            : selectedVendor === "IGLO"
              ? "IGLO"
              : selectedVendor === "SDD"
                ? "SDD"
                : undefined,
      });
      console.log("📊 Parsed IHCS data:", ihcsData);

      // Format ihcsData with totalWorkingHour calculation
      const formattedIhcsData = ihcsData.map((row) => {
        let totalWorkingHour: string | null = null;

        if (row.checkin && row.checkout) {
          try {
            const [checkInHour, checkInMin] = row.checkin
              .split(":")
              .map(Number);
            const [checkOutHour, checkOutMin] = row.checkout
              .split(":")
              .map(Number);

            const checkInMinutes = checkInHour * 60 + checkInMin;
            const checkOutMinutes = checkOutHour * 60 + checkOutMin;

            const diffMinutes = checkOutMinutes - checkInMinutes;
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            totalWorkingHour = minutes > 0 ? `${hours}.${minutes}` : `${hours}`;
          } catch (e) {
            console.warn("Failed to calculate working hours for:", row);
          }
        }

        return {
          date: row.date,
          checkin: row.checkin,
          checkout: row.checkout,
          totalWorkingHour,
        };
      });

      // Create period string (YYYY-MM)
      const period = `${selectedYear}-${String(
        parseInt(selectedMonth) + 1,
      ).padStart(2, "0")}`;

      console.log("🔄 Sending to API:", {
        vendor: selectedVendor,
        period,
        ihcsDataCount: formattedIhcsData.length,
        employeeId: meta.employeeId,
        employeeName: meta.employeeName,
      });

      // Call API to get filled Excel file
      const response = await timesheetExcel({
        vendor: selectedVendor,
        period,
        employeeId: meta.employeeId || undefined,
        employeeName: meta.employeeName || undefined,
        ihcsData: formattedIhcsData,
      });

      console.log("✅ API Response - Excel file received");

      // Create filename: Vendor_Nama_Periode
      const employeeNameClean = (meta.employeeName || "Unknown")
        .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
        .replace(/\s+/g, "_") // Replace spaces with underscore
        .trim();

      // Format periode: "Januari 2026"
      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const periodFormatted = `${monthNames[parseInt(selectedMonth)]}_${selectedYear}`;
      const filename = `${selectedVendor}_${employeeNameClean}_${periodFormatted}.xlsx`;

      // Create download URL and trigger download
      const url = URL.createObjectURL(response.excelFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("✅ Download completed");
    } catch (err: any) {
      setError(err.message || "Failed to generate and download Excel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <>
        <SlideLoader isLoading={isLoading} />

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
            } ml-0 mt-16 md:mt-0`}
          >
            <div className="container mx-auto max-w-7xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div>
                    <BackHeader title="Timesheet Preview" path="/dashboard" />
                  </div>
                  <div className="mt-2">
                    <Breadcrumbs
                      items={[
                        { path: "/dashboard", label: "Dashboard" },
                        { label: "Timesheet Preview" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <hr
                className={`my-4 md:my-6 border-t ${
                  isDarkMode ? "border-white/10" : "border-gray-200"
                }`}
              />

              {/* Upload Section */}
              <section
                className={`p-4 md:p-6 rounded-lg backdrop-blur-sm border mb-6 ${
                  isDarkMode
                    ? "bg-white/10 border-white/20"
                    : "bg-white border-gray-200"
                }`}
              >
                <h2
                  className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Timesheet Preview Configuration
                </h2>
                <p
                  className={`text-sm md:text-base mb-4 md:mb-6 ${
                    isDarkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  Upload IHCS file (PDF). The system will automatically generate
                  the timesheet.
                </p>

                <div className="space-y-4">
                  {/* Vendor Selection */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Vendor
                    </label>
                    <Dropdown
                      options={vendors.map((vendor) => ({
                        value: vendor,
                        label: vendor,
                      }))}
                      value={selectedVendor}
                      onChange={setSelectedVendor}
                      width="w-full"
                      placeholder="Select Vendor"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Month Selection */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Month
                      </label>
                      <Dropdown
                        options={months}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        width="w-full"
                        placeholder="Select Month"
                      />
                    </div>

                    {/* Year Selection */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Year
                      </label>
                      <Dropdown
                        options={Array.from({ length: 4 }, (_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return {
                            value: year.toString(),
                            label: year.toString(),
                          };
                        })}
                        value={selectedYear.toString()}
                        onChange={(value) => setSelectedYear(parseInt(value))}
                        width="w-full"
                        placeholder="Select Year"
                      />
                    </div>
                  </div>

                  {/* IHCS File Upload - Drag & Drop */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      IHCS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      id="ihcsFile"
                      accept=".pdf"
                      onChange={handleIhcsFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() =>
                        document.getElementById("ihcsFile")?.click()
                      }
                      className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-white border-gray-300 hover:border-blue-400"
                    >
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {ihcsFile
                          ? ihcsFile.name
                          : "Drag & drop or click to choose file"}
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    disabled={isLoading || !ihcsFile}
                    className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Generating Excel..." : "Download Excel"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
        <ToastContainer />
      </>
    </AuthGuard>
  );
}
