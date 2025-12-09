"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import DashboardLayout from "@/components/DashboardLayout";
import AuthGuard from "@/components/AuthGuard";
import Breadcrumbs from "@/components/Breadcrumbs";
import BackHeader from "@/components/BackHeader";

type ActivityRow = {
  uid: string;
  id: string;
  date: string;
  status: string;
  title?: string;
  detail?: string;
  percentStart?: number;
  percentEnd?: number;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
};

export default function AllActivitiesPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);

  // (date normalization removed — we will parse dates minimally when loading rows)

  // Filters
  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [statusFilter, setStatusFilter] = useState<
    "all" | ActivityRow["status"]
  >("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  // date filters disabled for now
  // dropdown state refs
  const statusRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const users = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      const profileRaw =
        typeof window !== "undefined"
          ? localStorage.getItem(`userProfile:${r.uid}`)
          : null;
      let display = r.uid;
      if (profileRaw) {
        try {
          const pr = JSON.parse(profileRaw);
          display = pr.displayName || pr.email || r.uid;
        } catch (e) {
          // ignore
        }
      }
      map.set(r.uid, display);
    });
    return Array.from(map.entries()).map(([uid, name]) => ({ uid, name }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (userFilter !== "all" && r.uid !== userFilter) return false;
      return true;
    });
  }, [rows, statusFilter, userFilter]);

  // Reset page when filters change
  useEffect(() => setPage(1), [statusFilter, userFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("activityLogs:")
    );
    const all: ActivityRow[] = [];
    keys.forEach((k) => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const parsed = JSON.parse(raw) as any[];
        const uid = k.replace(/^activityLogs:/, "");
        // try to read a user profile mapping saved when the activity was created
        const profileRaw = localStorage.getItem(`userProfile:${uid}`);
        let displayName: string | null = null;
        try {
          if (profileRaw) {
            const pr = JSON.parse(profileRaw);
            displayName = pr.displayName || pr.email || null;
          }
        } catch (e) {
          // ignore
        }
        parsed.forEach((p) => {
          let dateIso = "";
          if (p.date) {
            try {
              dateIso = new Date(p.date).toISOString().slice(0, 10);
            } catch (e) {
              dateIso = String(p.date);
            }
          } else if (p.createdAt) {
            dateIso = new Date(p.createdAt).toISOString().slice(0, 10);
          }
          all.push({
            uid,
            ...p,
            date: dateIso,
            ...(displayName ? { title: p.title, detail: p.detail } : {}),
          });
        });
      } catch (err) {
        console.warn("Failed to parse activity logs for", k, err);
      }
    });
    // sort by createdAt desc
    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRows(all);
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="container mx-auto">
          <div className="mb-6">
            <BackHeader title="All Activities" href="/dashboard" />
            <div className="mt-2">
              <Breadcrumbs
                items={[
                  { href: "/dashboard", label: "Dashboard" },
                  { label: "All Activities" },
                ]}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-4">
              This view aggregates activity logs found in localStorage (keys
              starting with <code>activityLogs:</code>). In production, use a
              server-backed store to see logs from all users.
            </p>
            {/* Filters */}
            <div className="mb-4 flex flex-col md:flex-row md:items-end gap-3">
              <div ref={statusRef}>
                <label className="text-sm text-gray-600">Status</label>
                <Dropdown
                  options={[
                    { value: "all", label: "All" },
                    {
                      value: "on_duty",
                      label: (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-300" />
                          <span>On duty</span>
                        </span>
                      ),
                    },
                    {
                      value: "off_duty",
                      label: (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-300" />
                          <span>Off duty</span>
                        </span>
                      ),
                    },
                    {
                      value: "idle",
                      label: (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-300" />
                          <span>Idle</span>
                        </span>
                      ),
                    },
                  ]}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as any)}
                  width="w-44"
                />
              </div>

              <div ref={userRef}>
                <label className="text-sm text-gray-600">User</label>
                <Dropdown
                  options={[
                    { value: "all", label: "All users" },
                    ...users.map((u) => ({ value: u.uid, label: u.name })),
                  ]}
                  value={userFilter}
                  onChange={(v) => setUserFilter(v)}
                  width="w-64"
                />
              </div>

              {/* Date filter removed per request */}

              <div />
            </div>

            {filteredRows.length === 0 ? (
              <div className="text-sm text-gray-500">
                No activity logs found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-sm text-gray-600 border-b">
                        <th className="py-2 px-3">User</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Title / Reason</th>
                        <th className="py-2 px-3">Details</th>
                        <th className="py-2 px-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.map((r) => (
                        <tr key={`${r.uid}:${r.id}`} className="odd:bg-gray-50">
                          <td className="py-2 px-3 align-top text-sm text-gray-700">
                            {(localStorage.getItem(`userProfile:${r.uid}`) &&
                              JSON.parse(
                                localStorage.getItem(
                                  `userProfile:${r.uid}`
                                ) as string
                              ).displayName) ||
                              r.uid}
                          </td>
                          <td className="py-2 px-3 align-top text-sm text-gray-700">
                            {r.date}
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
                            {r.status === "off_duty" ? r.reason : r.title}
                          </td>
                          <td className="py-2 px-3 align-top text-sm text-gray-700">
                            {r.detail ??
                              (r.status === "on"
                                ? `${r.percentStart ?? "-"}% → ${
                                    r.percentEnd ?? "-"
                                  }%`
                                : "-")}
                          </td>
                          <td className="py-2 px-3 align-top text-xs text-gray-500">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      {filteredRows.length === 0
                        ? 0
                        : (page - 1) * pageSize + 1}
                      –{Math.min(page * pageSize, filteredRows.length)} of{" "}
                      {filteredRows.length}
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
                            setPage(1);
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
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        aria-label="First page"
                        title="First page"
                        className={`p-2 rounded border ${
                          page === 1
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        title="Previous page"
                        className={`p-2 rounded border ${
                          page === 1
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* page number buttons (show up to 5 centered on current) */}
                      {(() => {
                        const pages: number[] = [];
                        const start = Math.max(1, page - 2);
                        const end = Math.min(totalPages, page + 2);
                        for (let i = start; i <= end; i++) pages.push(i);
                        return pages.map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`px-3 py-1 rounded border ${
                              p === page
                                ? "bg-blue-600 text-white border-blue-600"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </button>
                        ));
                      })()}

                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        aria-label="Next page"
                        title="Next page"
                        className={`p-2 rounded border ${
                          page === totalPages
                            ? "text-gray-400 border-gray-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        aria-label="Last page"
                        title="Last page"
                        className={`p-2 rounded border ${
                          page === totalPages
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
