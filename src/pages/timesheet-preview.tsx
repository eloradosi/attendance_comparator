"use client";

import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";
import ToastContainer, { showToast } from "@/components/Toast";
import Dropdown from "@/components/ui/dropdown";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useSidebar } from "@/hooks/useSidebar";
import SlideLoader from "@/components/SlideLoader";
import { parsePdf, parseIHcsPdf } from "@/utils/parsePdf";
import { timesheetExcel, uploadAttendance } from "@/components/service";

export default function TimesheetPreviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const sidebarExpanded = useSidebar();
  const [isLoading, setIsLoading] = useState(false);

  // Form states - Upload Card
  const [uploadMonth, setUploadMonth] = useState<string>(
    new Date().getMonth().toString(),
  );
  const [uploadYear, setUploadYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [ihcsFile, setIhcsFile] = useState<File | null>(null);

  // Form states - Download Card
  const [downloadVendor, setDownloadVendor] = useState<string>("MII");
  const [downloadMonth, setDownloadMonth] = useState<string>(
    new Date().getMonth().toString(),
  );
  const [downloadYear, setDownloadYear] = useState<number>(
    new Date().getFullYear(),
  );

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

  const handleUpload = async () => {
    if (!ihcsFile) {
      showToast("Please select IHCS file to upload", "error");
      return;
    }

    try {
      setIsLoading(true);

      // Parse IHCS file
      console.log("📄 Parsing IHCS file for upload:", ihcsFile.name);

      // Extract employee metadata
      const meta = await parseIHcsPdf(ihcsFile);
      console.log("👤 Employee metadata:", meta);

      // Parse attendance rows from IHCS
      const ihcsData = await parsePdf(ihcsFile, {
        vendor: "MII",
      });
      console.log("📊 Parsed IHCS data:", ihcsData);

      // Format data untuk backend
      const ihcsDataFormatted = ihcsData.map((row) => ({
        date: row.date,
        checkin: row.checkin,
        checkout: row.checkout,
        ket: row.ket,
      }));

      // Create period string (YYYY-MM)
      const period = `${uploadYear}-${String(parseInt(uploadMonth) + 1).padStart(2, "0")}`;

      // Call API to upload attendance data
      const response = await uploadAttendance({
        employeeId: meta.employeeId || "",
        employeeName: meta.employeeName || "",
        vendor: "MII",
        period,
        ihcsData: ihcsDataFormatted,
      });

      console.log("✅ Upload completed:", response);

      showToast(
        `Upload berhasil! Data ${response.data.employeeName} (${response.data.totalRecords} records, ${response.data.tkRecords} TK) telah tersimpan`,
        "success",
      );
    } catch (err: any) {
      console.error("❌ Upload failed:", err);
      showToast(err.message || "Failed to upload IHCS data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);

      // Create period string (YYYY-MM)
      const period = `${downloadYear}-${String(parseInt(downloadMonth) + 1).padStart(2, "0")}`;

      console.log("🔄 Requesting Excel for:", {
        vendor: downloadVendor,
        period,
      });

      // Call API to get filled Excel file
      const response = await timesheetExcel({
        vendor: downloadVendor,
        period,
        ihcsData: [],
      });

      console.log("✅ API Response - Excel file received");

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
      const periodFormatted = `${monthNames[parseInt(downloadMonth)]}_${downloadYear}`;
      const filename = `${downloadVendor}_Timesheet_${periodFormatted}.xlsx`;

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
      showToast("Excel file downloaded successfully", "success");
    } catch (err: any) {
      showToast(
        err.message || "Failed to generate and download Excel",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <>
        <SlideLoader isLoading={isLoading} />

        <div
          className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-white via-gray-50 to-gray-100"
          style={{ minHeight: "100vh" }}
        >
          <Sidebar />
          <div
            className={`p-4 md:p-6 pb-20 transition-all duration-300 min-h-screen ${
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

              <hr className="my-4 md:my-6 border-t border-white/10" />

              {/* Vertical Layout */}
              <div className="space-y-8">
                {/* Card 1: Upload to System */}
                <section className="p-6 rounded-lg backdrop-blur-sm border overflow-visible bg-white border-gray-200">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Upload to System
                  </h2>
                  <p className="text-sm mb-6 text-gray-600">
                    Upload IHCS file to system for attendance adjustment
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Month Selection */}
                      <div className="relative z-20">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Month
                        </label>
                        <Dropdown
                          options={months}
                          value={uploadMonth}
                          onChange={setUploadMonth}
                          width="w-full"
                          placeholder="Select Month"
                        />
                      </div>

                      {/* Year Selection */}
                      <div className="relative z-10">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
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
                          value={uploadYear.toString()}
                          onChange={(value) => setUploadYear(parseInt(value))}
                          width="w-full"
                          placeholder="Select Year"
                        />
                      </div>
                    </div>

                    {/* IHCS File Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
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

                    {/* Upload Button */}
                    <button
                      onClick={handleUpload}
                      disabled={isLoading || !ihcsFile}
                      className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
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
                      {isLoading ? "Uploading..." : "Upload to System"}
                    </button>
                  </div>
                </section>

                {/* Card 2: Download Excel */}
                <section className="p-6 rounded-lg backdrop-blur-sm border overflow-visible bg-white border-gray-200">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Download Excel
                  </h2>
                  <p className="text-sm mb-6 text-gray-600">
                    Generate and download timesheet Excel file
                  </p>

                  <div className="space-y-4">
                    {/* Vendor Selection */}
                    <div className="relative z-20">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Vendor
                      </label>
                      <Dropdown
                        options={vendors.map((vendor) => ({
                          value: vendor,
                          label: vendor,
                        }))}
                        value={downloadVendor}
                        onChange={setDownloadVendor}
                        width="w-full"
                        placeholder="Select Vendor"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Month Selection */}
                      <div className="relative z-20">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Month
                        </label>
                        <Dropdown
                          options={months}
                          value={downloadMonth}
                          onChange={setDownloadMonth}
                          width="w-full"
                          placeholder="Select Month"
                        />
                      </div>

                      {/* Year Selection */}
                      <div className="relative z-10">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
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
                          value={downloadYear.toString()}
                          onChange={(value) => setDownloadYear(parseInt(value))}
                          width="w-full"
                          placeholder="Select Year"
                        />
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={handleDownload}
                      disabled={isLoading}
                      className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      {isLoading ? "Processing..." : "Download Excel"}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </>
    </AuthGuard>
  );
}
