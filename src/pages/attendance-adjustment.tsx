"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Calendar, Save, RotateCcw } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";
import ToastContainer from "@/components/Toast";
import { useSidebar } from "@/hooks/useSidebar";
import {
  getTKRecords,
  adjustTKStatus,
  type TKEmployeeRecord,
} from "@/components/service";
import { isAdmin } from "@/lib/userRoles";
import { showToast } from "@/components/Toast";

export default function AttendanceAdjustmentPage() {
  const router = useRouter();
  const [employeeRecords, setEmployeeRecords] = useState<TKEmployeeRecord[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const sidebarExpanded = useSidebar();
  const [selectedStatus, setSelectedStatus] = useState<{
    [key: string]: string;
  }>({});

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (typeof window !== "undefined" && !isAdmin()) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:navigated"));
    } catch (e) {
      // ignore on server
    }
  }, []);

  // Fetch TK records from backend API
  const fetchTKRecords = async () => {
    setIsLoading(true);

    try {
      const response = await getTKRecords();

      if (response.data && Array.isArray(response.data)) {
        setEmployeeRecords(response.data);
        console.log("✅ TK Records loaded:", response.data.length, "employees");
      } else {
        console.error("❌ Invalid response format");
        setEmployeeRecords([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching TK records:", error);
      setEmployeeRecords([]);
      alert(`Failed to load TK records: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTKRecords();
  }, []);

  const handleStatusChange = (recordKey: string, status: string) => {
    setSelectedStatus((prev) => ({
      ...prev,
      [recordKey]: status,
    }));
  };

  const handleSaveAdjustments = async (employeeId: string) => {
    // Filter adjustments for this specific employee
    const employeeAdjustments = Object.entries(selectedStatus)
      .filter(([key]) => key.startsWith(`${employeeId}-`))
      .map(([key, status]) => ({
        date: key.substring(employeeId.length + 1), // Extract full date after employeeId
        ket: status,
      }));

    if (employeeAdjustments.length === 0) {
      showToast("Tidak ada perubahan status untuk karyawan ini", "info");
      return;
    }

    setIsLoading(true);

    try {
      // Find the employee record
      const employee = employeeRecords.find((e) => e.employeeId === employeeId);

      if (!employee) {
        showToast("Data karyawan tidak ditemukan", "error");
        return;
      }

      await adjustTKStatus({ id: employee.id, ihcsData: employeeAdjustments });
      showToast(
        `Adjustment berhasil disimpan untuk ${employee.employeeName}`,
        "success",
      );

      // Clear selections for this employee only
      const newSelectedStatus = { ...selectedStatus };
      Object.keys(newSelectedStatus).forEach((key) => {
        if (key.startsWith(`${employeeId}-`)) {
          delete newSelectedStatus[key];
        }
      });
      setSelectedStatus(newSelectedStatus);

      fetchTKRecords();
    } catch (error) {
      console.error("Error saving adjustments:", error);
      showToast("Gagal menyimpan perubahan status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedStatus({});
    fetchTKRecords();
  };

  return (
    <AuthGuard>
      <>
        <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-white via-gray-50 to-gray-100">
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
                    <BackHeader
                      title="Attendance Adjustment"
                      path="/dashboard"
                    />
                  </div>
                  <div className="mt-2">
                    <Breadcrumbs
                      items={[
                        { path: "/dashboard", label: "Dashboard" },
                        { label: "Attendance Adjustment" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4 md:my-6 border-t border-gray-200" />

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Kelola Status Kehadiran TK
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Adjust status kehadiran TK menjadi cuti atau sakit
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Memuat data...
                    </p>
                  </div>
                </div>
              ) : employeeRecords.length === 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Tidak ada data TK
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada karyawan dengan status TK saat ini
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {employeeRecords.map((employee) => (
                    <div
                      key={employee.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
                    >
                      <div className="mb-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {employee.employeeName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            NPP: {employee.employeeId} • Period:{" "}
                            {employee.period}
                          </p>
                        </div>
                        <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-sm font-medium text-orange-700 dark:text-orange-300">
                          {employee.ihcsData.length} hari TK
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Tanggal
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status Asli
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Adjust Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status Akhir
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {employee.ihcsData.map((attendance, index) => {
                              const key = `${employee.employeeId}-${attendance.date}`;
                              const currentSelection = selectedStatus[key];
                              const finalStatus =
                                currentSelection || attendance.ket;

                              return (
                                <tr
                                  key={key}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  style={{
                                    position: "relative",
                                    zIndex: employee.ihcsData.length - index,
                                  }}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(
                                      attendance.date,
                                    ).toLocaleDateString("id-ID", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="inline-flex rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300">
                                      {attendance.ket}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleStatusChange(key, "CUTI")
                                        }
                                        className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                                          currentSelection === "CUTI"
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                                        }`}
                                      >
                                        Cuti
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleStatusChange(key, "SAKIT")
                                        }
                                        className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                                          currentSelection === "SAKIT"
                                            ? "bg-red-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                                        }`}
                                      >
                                        Sakit
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                        finalStatus === "CUTI"
                                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                          : finalStatus === "SAKIT"
                                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                            : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                      }`}
                                    >
                                      {finalStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Save button for this employee */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() =>
                            handleSaveAdjustments(employee.employeeId)
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                          disabled={
                            isLoading ||
                            !Object.keys(selectedStatus).some((key) =>
                              key.startsWith(`${employee.employeeId}-`),
                            )
                          }
                        >
                          <Save className="h-4 w-4" />
                          Simpan Adjustment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <ToastContainer />
      </>
    </AuthGuard>
  );
}
