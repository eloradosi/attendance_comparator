"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Trash,
} from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import DashboardLayout from "@/components/DashboardLayout";
import AuthGuard from "@/components/AuthGuard";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";
import axios from "axios";
import { getAppToken } from "@/lib/api";
import { getApiUrl } from "@/lib/runtimeConfig";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  fetchAllActivities,
  type ActivityRow,
} from "@/components/service/all-activities";

export default function AllActivitiesPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:navigated"));
    } catch (e) {
      // ignore on server
    }
  }, []);

  // (date normalization removed — we will parse dates minimally when loading rows)

  // Filters
  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  // Calculate date range: 3 days before today
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 2); // 2 days before = 3 days range (today + 2 days before)

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  };

  const [statusFilter, setStatusFilter] = useState<
    "all" | ActivityRow["status"]
  >("all");
  const [statusOptions, setStatusOptions] = useState<
    {
      value: string;
      label: any;
    }[]
  >([{ value: "all", label: "All" }]);
  const [userOptions, setUserOptions] = useState<
    {
      value: string;
      label: any;
    }[]
  >([{ value: "all", label: "All users" }]);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  // dropdown state refs
  const statusRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(0); // Backend uses 0-based page index
  const [pageSize, setPageSize] = useState(10);

  // userOptions loaded from backend; keep a memoized list of user values for any internal use
  const users = useMemo(() => userOptions.map((u) => u.value), [userOptions]);

  // Server-side filtering for status and user, client-side only for todayOnly
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    // Status and user already filtered server-side
    return rows.filter((r) => {
      if (todayOnly && r.date !== today) return false;
      return true;
    });
  }, [rows, todayOnly, today]);

  // Reset page when filters change
  useEffect(
    () => setPage(0),
    [statusFilter, userFilter, pageSize, dateRange, todayOnly],
  );

  const totalPages = Math.max(1, Math.ceil(totalData / pageSize));

  // Use server data directly (server-side pagination)
  const pagedRows = filteredRows;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const source = axios.CancelToken.source();

    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAllActivities({
          dateRange,
          page,
          size: pageSize,
          status: statusFilter,
          userName: userFilter,
          cancelToken: source.token,
        });

        setRows(response.data);
        setTotalData(response.totalData);
      } catch (err: any) {
        if (axios.isCancel(err)) {
          return;
        }
        setRows([]);
        setTotalData(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      source.cancel();
    };
  }, [dateRange, page, pageSize, statusFilter, userFilter, refreshTrigger]);

  // Load LOV for status dropdown from backend
  useEffect(() => {
    if (typeof window === "undefined") return;
    const source = axios.CancelToken.source();

    const loadStatusOptions = async () => {
      try {
        const backend = await getApiUrl();
        const token = getAppToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${backend.replace(/\/$/, "")}/api/dashboard/logbook-status`,
          {
            headers,
            cancelToken: source.token,
          },
        );
        const data = Array.isArray(res.data) ? res.data : [];
        const opts = [
          { value: "all", label: "All" },
          ...data.map((x: any) => ({
            value: x.value,
            label: (
              <span className="inline-flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    x.value === "on_duty"
                      ? "bg-amber-300"
                      : x.value === "off_duty"
                        ? "bg-red-300"
                        : x.value === "idle"
                          ? "bg-green-300"
                          : "bg-gray-300"
                  }`}
                />
                <span>{x.label}</span>
              </span>
            ),
          })),
        ];
        setStatusOptions(opts);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
      }
    };

    const loadUserOptions = async () => {
      try {
        const backend = await getApiUrl();
        const token = getAppToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${backend.replace(/\/$/, "")}/api/dashboard/logbook-users`,
          {
            headers,
            cancelToken: source.token,
          },
        );
        const data = Array.isArray(res.data) ? res.data : [];
        const opts = [
          { value: "all", label: "All users" },
          ...data.map((x: any) => ({ value: x.value, label: x.label })),
        ];
        setUserOptions(opts);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
      }
    };

    loadStatusOptions();
    loadUserOptions();

    return () => {
      source.cancel();
    };
  }, []);

  // Clear all filters helper
  const handleClearFilters = () => {
    setStatusFilter("all");
    setUserFilter("all");
    setTodayOnly(false);
    setDateRange(undefined);
    setPage(0);
    setStatusOpen(false);
    setUserOpen(false);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="container mx-auto">
          <div className="mb-6">
            <BackHeader title="All Activities" path="/dashboard" />
            <div className="mt-4">
              <Breadcrumbs
                items={[
                  { path: "/dashboard", label: "Dashboard" },
                  { label: "All Activities" },
                ]}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-4">
              Dashboard view showing activity logs for the last 3 days
              (including today), sorted by date descending. Data is fetched from
              the backend API.
            </p>
            {/* Filters */}
            <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap md:items-end gap-3">
              <div ref={statusRef}>
                <label className="text-sm text-gray-600">Status</label>
                <Dropdown
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as any)}
                  width="w-44"
                />
              </div>

              <div ref={userRef}>
                <label className="text-sm text-gray-600">User</label>
                <Dropdown
                  options={userOptions}
                  value={userFilter}
                  onChange={(v) => setUserFilter(v)}
                  width="w-64"
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm text-gray-600">Date Range</label>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              {/* Quick shortcuts */}
              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                  disabled={isLoading}
                  title="Refresh data"
                  aria-label="Refresh data"
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50 transition text-sm ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <RotateCcw
                    className={`w-4 h-4 text-green-600 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span>{isLoading ? "Loading..." : "Refresh"}</span>
                </button>

                {(statusFilter !== "all" ||
                  userFilter !== "all" ||
                  todayOnly ||
                  dateRange) && (
                  <button
                    onClick={handleClearFilters}
                    title="Clear filters"
                    aria-label="Clear filters"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
                  >
                    <Trash className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="text-sm text-gray-500">
                No activity logs found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-left border-collapse">
                      <thead>
                        <tr className="text-sm text-gray-600 border-b">
                          <th className="py-2 px-3 whitespace-nowrap">User</th>
                          <th className="py-2 px-3 whitespace-nowrap w-28">
                            Date
                          </th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Title / Reason</th>
                          <th className="py-2 px-3">Details</th>
                          <th className="py-2 px-3 whitespace-nowrap w-28">
                            Created
                          </th>
                          <th className="py-2 px-3 whitespace-nowrap w-28">
                            Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.map((r) => (
                          <tr key={r.id} className="odd:bg-gray-50">
                            <td className="py-2 px-3 align-top text-sm text-gray-700">
                              {r.userName || r.userEmail || "Unknown"}
                            </td>
                            <td className="py-2 px-3 align-top text-sm text-gray-700 whitespace-nowrap">
                              {(() => {
                                const d = r.date.split("-");
                                return d.length === 3
                                  ? `${d[2]}-${d[1]}-${d[0]}`
                                  : r.date;
                              })()}
                            </td>
                            <td className="py-2 px-3 align-top text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  r.status === "on_duty"
                                    ? "bg-amber-100 text-amber-700"
                                    : r.status === "off_duty"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                }`}
                              >
                                {r.status === "on_duty"
                                  ? "On duty"
                                  : r.status === "off_duty"
                                    ? "Off duty"
                                    : "Idle"}
                              </span>
                            </td>
                            <td className="py-2 px-3 align-top text-sm text-gray-800">
                              {r.status === "off_duty" || r.status === "idle"
                                ? r.reason || "-"
                                : r.title || "-"}
                            </td>
                            <td className="py-2 px-3 align-top text-sm text-gray-700">
                              {r.status === "on_duty"
                                ? `${r.percentStart ?? "-"}% → ${
                                    r.percentEnd ?? "-"
                                  }%`
                                : r.detail || "-"}
                            </td>
                            <td className="py-2 px-3 align-top text-xs text-gray-500 whitespace-nowrap">
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )
                                : "-"}
                            </td>
                            <td className="py-2 px-3 align-top text-xs text-gray-500 whitespace-nowrap">
                              {r.updatedAt
                                ? new Date(r.updatedAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination controls */}
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                    <div className="text-sm text-gray-600">
                      Showing {totalData === 0 ? 0 : page * pageSize + 1}–
                      {Math.min((page + 1) * pageSize, totalData)} of{" "}
                      {totalData}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">Rows per page</div>
                      <div className="w-24">
                        <Dropdown
                          options={[5, 10, 20, 50].map((n) => ({
                            value: String(n),
                            label: String(n),
                          }))}
                          value={String(pageSize)}
                          onChange={(v) => {
                            setPageSize(Number(v));
                            setPage(0);
                          }}
                          width="w-24"
                        />
                      </div>
                    </div>
                  </div>

                  <nav
                    className="flex items-center justify-center"
                    aria-label="Pagination"
                  >
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setPage(0)}
                        disabled={page === 0}
                        aria-label="First page"
                        title="First page"
                        className={`p-2 rounded border ${
                          page === 0
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        aria-label="Previous page"
                        title="Previous page"
                        className={`p-2 rounded border ${
                          page === 0
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* page number buttons (show up to 5 centered on current) */}
                      {(() => {
                        const pages: number[] = [];
                        const start = Math.max(0, page - 2);
                        const end = Math.min(totalPages - 1, page + 2);
                        for (let i = start; i <= end; i++) pages.push(i);
                        return pages.map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`px-3 py-1 rounded border ${
                              p === page
                                ? "bg-green-600 text-white border-green-600"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {p + 1}
                          </button>
                        ));
                      })()}

                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page === totalPages - 1}
                        aria-label="Next page"
                        title="Next page"
                        className={`p-2 rounded border ${
                          page === totalPages - 1
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(totalPages - 1)}
                        disabled={page === totalPages - 1}
                        aria-label="Last page"
                        title="Last page"
                        className={`p-2 rounded border ${
                          page === totalPages - 1
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </nav>
                </div>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
