import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DiffTable from "@/components/DiffTable";
import ExportButtons from "@/components/ExportButtons";
import { CompareResponse } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";
import { useSidebar } from "@/hooks/useSidebar";
import { compareFiles } from "@/components/service/compare";

export default function ComparePage() {
  const router = useRouter();
  const [data, setData] = useState<CompareResponse | null>(null);
  const [timesheetRows, setTimesheetRows] = useState<
    { date: string; checkin?: string | null; checkout?: string | null }[] | null
  >(null);
  const sidebarExpanded = useSidebar();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:navigated"));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const storedData = sessionStorage.getItem("comparisonResult");
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
        const ts = sessionStorage.getItem("originalTimesheet");
        if (ts) {
          try {
            setTimesheetRows(JSON.parse(ts));
          } catch (err) {
            console.warn("Failed to parse originalTimesheet", err);
          }
        }
      } catch (err) {
        console.error(
          "Failed to parse comparisonResult from sessionStorage",
          err,
        );
        // clear and allow user to upload again
        sessionStorage.removeItem("comparisonResult");
      }
    }
  }, []);

  // handle submit copied from home page so users can upload from /compare
  const handleSubmit = async (
    fileA: File,
    fileB: File,
    onProgress?: (percent: number) => void,
    ihcs?: any,
    timesheet?: any,
    employeeId?: string,
    employeeName?: string,
  ) => {
    try {
      const dataResp = await compareFiles({
        fileA,
        fileB,
        onProgress,
        ihcs,
        timesheet,
        employeeId,
        employeeName,
      });

      sessionStorage.setItem("comparisonResult", JSON.stringify(dataResp));
      setData(dataResp);
    } catch (err) {
      console.error("Error during compare:", err);
      // Stop loading on error
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:loading:stop"));
      }
      alert("Failed to compare files. Please try again.");
    }
  };

  if (!data) {
    // No comparison result yet — show upload UI so user can run comparator
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
            } ml-0 mt-16 md:mt-0`}
          >
            <div className="container mx-auto max-w-7xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div>
                    {/* Back arrow + title */}
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore */}
                    <BackHeader
                      title="Attendance Comparator"
                      path="/dashboard"
                    />
                  </div>
                  <div className="mt-2">
                    <Breadcrumbs
                      items={[
                        { path: "/dashboard", label: "Dashboard" },
                        { label: "Attendance Comparator" },
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

              <div
                className={`p-6 rounded-lg border ${
                  isDarkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <FileUpload onSubmit={handleSubmit} />
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

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
        <main
          className={`p-4 md:p-8 transition-all duration-300 ${
            sidebarExpanded ? "md:ml-64" : "md:ml-20"
          } ml-0 mt-16 md:mt-0`}
        >
          <div className="container mx-auto max-w-7xl">
            <div className="mb-6">
              {/* Breadcrumb: Dashboard > Attendance Comparator > Results */}
              <Breadcrumbs
                items={[
                  { path: "/dashboard", label: "Dashboard" },
                  {
                    path: "/compare",
                    label: "Attendance Comparator",
                    onClick: () => {
                      // Clear stored comparison so the upload UI is shown again
                      try {
                        sessionStorage.removeItem("comparisonResult");
                        sessionStorage.removeItem("originalTimesheet");
                        sessionStorage.removeItem("originalTimesheetPdf");
                      } catch (err) {
                        // ignore
                      }
                      // Reset local component state so the upload UI renders immediately
                      try {
                        setData(null);
                        setTimesheetRows(null);
                      } catch (e) {
                        // setData / setTimesheetRows may not be available in some render paths
                      }
                      router.push("/compare");
                    },
                  },
                  { label: "Results" },
                ]}
              />
            </div>

            <div
              className={`rounded-lg p-6 mb-6 backdrop-blur-sm border ${
                isDarkMode
                  ? "bg-white/10 border-white/20"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <BackHeader
                  title="Comparison Results"
                  path="/compare"
                  onBack={() => {
                    try {
                      sessionStorage.removeItem("comparisonResult");
                      sessionStorage.removeItem("originalTimesheet");
                      sessionStorage.removeItem("originalTimesheetPdf");
                      sessionStorage.removeItem("originalTimesheetFilename");
                    } catch (e) {}
                    // Clear data state to show upload form again
                    setData(null);
                  }}
                />
              </div>
              {data.summary.employeeName && (
                <p
                  className={`text-sm mb-1 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  <span className="font-medium">
                    {data.summary.employeeName}
                  </span>
                  {data.summary.employeeId && (
                    <span
                      className={`ml-2 text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      ({data.summary.employeeId})
                    </span>
                  )}
                </p>
              )}
              {data.summary.note && (
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {data.summary.note}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-blue-500/20" : "bg-blue-50"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    Total Rows (IHCS)
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    {data.summary.totalRowsIhcs}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-blue-500/20" : "bg-blue-50"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    Total Rows (Timesheet)
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    {data.summary.totalRowsTimesheet}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-green-500/20" : "bg-green-50"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    Total Matched
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-green-300" : "text-green-600"
                    }`}
                  >
                    {data.summary.totalMatched}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-red-500/20" : "bg-red-50"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    Total Differences
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-red-300" : "text-red-600"
                    }`}
                  >
                    {data.summary.totalDifferences}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-yellow-500/20" : "bg-yellow-50"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    Missing in Timesheet
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-yellow-300" : "text-yellow-600"
                    }`}
                  >
                    {data.summary.totalMissingInTimesheet}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-yellow-500/20" : "bg-yellow-50"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 ${
                      isDarkMode ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    Missing in IHCS
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-yellow-300" : "text-yellow-600"
                    }`}
                  >
                    {data.summary.totalMissingInIhcs}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <ExportButtons
                diffs={data.differences}
                summary={data.summary}
                timesheetRows={timesheetRows || undefined}
              />
            </div>

            <DiffTable diffs={data.differences} />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
