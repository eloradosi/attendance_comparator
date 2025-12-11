"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DiffTable from "@/components/DiffTable";
import ExportButtons from "@/components/ExportButtons";
import { CompareResponse } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import apiFetch from "@/lib/api";
import FileUpload from "@/components/FileUpload";
import DashboardLayout from "@/components/DashboardLayout";
import AuthGuard from "@/components/AuthGuard";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";

export default function ComparePage() {
  const router = useRouter();
  const [data, setData] = useState<CompareResponse | null>(null);
  const [timesheetRows, setTimesheetRows] = useState<
    { date: string; checkin?: string | null; checkout?: string | null }[] | null
  >(null);

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
          err
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
    employeeName?: string
  ) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    const url = `${baseUrl}/api/attendance/compare`;

    try {
      // Save timesheet PDF for watermarking later
      if (fileB && fileB.type === "application/pdf") {
        try {
          const arrayBuffer = await fileB.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          sessionStorage.setItem("originalTimesheetPdf", base64);
          sessionStorage.setItem("originalTimesheetFilename", fileB.name);
        } catch (err) {
          console.warn("Failed to save original timesheet PDF", err);
        }
      }

      let dataResp: any;
      if ((ihcs && ihcs.length > 0) || (timesheet && timesheet.length > 0)) {
        const sanitizeTime = (t: string | null) => {
          if (!t) return null;
          const m = t.toString().match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/);
          if (!m) return null;
          const token = m[1].replace(".", ":");
          const parts = token.split(":");
          const hh = parts[0].padStart(2, "0");
          const mm = parts[1].padStart(2, "0");
          return `${hh}:${mm}`;
        };

        const payload: any = {};
        if (ihcs && ihcs.length > 0) {
          payload.ihcs = ihcs.map((r: any) => ({
            date: r.date,
            checkin: sanitizeTime(r.checkin),
            checkout: sanitizeTime(r.checkout),
          }));
        }
        if (timesheet && timesheet.length > 0) {
          const lastSeen: Map<string, { row: any; idx: number }> = new Map();
          for (let i = 0; i < timesheet.length; i++) {
            const r = timesheet[i];
            if (!r || !r.date) continue;
            lastSeen.set(r.date, { row: r, idx: i });
          }
          const sorted = Array.from(lastSeen.values()).sort(
            (a, b) => a.idx - b.idx
          );
          const deduped = sorted.map(({ row }) => ({
            date: row.date,
            checkin: sanitizeTime(row.checkin),
            checkout: sanitizeTime(row.checkout),
          }));
          payload.timesheet = deduped;
          try {
            sessionStorage.setItem(
              "originalTimesheet",
              JSON.stringify(deduped)
            );
          } catch (err) {
            console.warn(
              "Failed to persist originalTimesheet to sessionStorage",
              err
            );
          }
        }
        if (employeeId) payload.employeeId = employeeId;
        if (employeeName) payload.employeeName = employeeName;

        const response = await apiFetch(url, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Backend returned ${response.status}. ${
              response.status === 500
                ? "Server error - check backend logs or try uploading raw files (uncheck PDF parse option)."
                : errorText
            }`
          );
        }

        dataResp = await response.json();
        if (onProgress) onProgress(100);
      } else {
        const formData = new FormData();
        formData.append("fileIHCS", fileA);
        formData.append("fileTimesheet", fileB);

        dataResp = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText || "null");
                resolve(json);
              } catch (err) {
                reject(new Error("Invalid JSON response"));
              }
            } else {
              const errorMsg =
                xhr.status === 500
                  ? "Backend server error (500). Check backend logs or try uploading raw files."
                  : `Upload failed with status ${xhr.status}`;
              reject(new Error(errorMsg));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(formData);
        });
      }

      sessionStorage.setItem("comparisonResult", JSON.stringify(dataResp));
      setData(dataResp);
    } catch (err) {
      console.error("Error during compare:", err);
      alert("Failed to compare files. Please try again.");
    }
  };

  if (!data) {
    // No comparison result yet — show upload UI so user can run comparator
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen py-8">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <div>
                    {/* Back arrow + title */}
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore */}
                    <BackHeader
                      title="Attendance Comparator"
                      href="/dashboard"
                    />
                  </div>
                  <div className="mt-2">
                    <Breadcrumbs
                      items={[
                        { href: "/dashboard", label: "Dashboard" },
                        { label: "Attendance Comparator" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <hr className="my-6 border-t border-gray-200" />

              <section className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 mb-6">
                  Upload IHCS and Timesheet files to compare attendance records.
                </p>
                <FileUpload onSubmit={handleSubmit} />
              </section>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <main className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="container mx-auto">
            <div className="mb-6">
              {/* Breadcrumb: Dashboard > Attendance Comparator > Results */}
              <Breadcrumbs
                items={[
                  { href: "/dashboard", label: "Dashboard" },
                  {
                    href: "/compare",
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

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <BackHeader title="Comparison Results" href="/compare" />
              </div>
              {data.summary.employeeName && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">
                    {data.summary.employeeName}
                  </span>
                  {data.summary.employeeId && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({data.summary.employeeId})
                    </span>
                  )}
                </p>
              )}
              {data.summary.note && (
                <p className="text-sm text-gray-600 mt-1">
                  {data.summary.note}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Rows (IHCS)
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.summary.totalRowsIhcs}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Rows (Timesheet)
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.summary.totalRowsTimesheet}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Matched</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.summary.totalMatched}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Differences
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.summary.totalDifferences}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Missing in Timesheet
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {data.summary.totalMissingInTimesheet}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Missing in IHCS</p>
                  <p className="text-2xl font-bold text-yellow-600">
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
      </DashboardLayout>
    </AuthGuard>
  );
}
