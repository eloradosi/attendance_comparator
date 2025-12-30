import { useEffect, useState, useMemo, useRef } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import {
  FileText,
  Clipboard,
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  Key,
  ChevronDown,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import axios from "axios";
import { getAppToken, clearAppToken } from "@/lib/api";
import getIdToken from "@/lib/getIdToken";
import { showToast } from "@/components/Toast";
import Dropdown from "@/components/ui/dropdown";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  fetchActivities,
  type ActivityRow,
} from "@/components/service/dashboard";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const sidebarExpanded = useSidebar();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });
  const router = useRouter();

  // All Activities states
  const today = (() => {
    const d = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
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
    const dayName = days[d.getDay()];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  })();

  const [statusFilter, setStatusFilter] = useState<
    "all" | ActivityRow["status"]
  >("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const statusRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const users = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((r) => {
      const display = r.userName || r.userEmail || r.uid || "Unknown";
      const key = r.userEmail || r.uid || r.id;
      map.set(key, display);
    });
    return Array.from(map.entries()).map(([uid, name]) => ({ uid, name }));
  }, [activities]);

  const filteredRows = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    return activities.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      const userKey = r.userEmail || r.uid || r.id;
      if (userFilter !== "all" && userKey !== userFilter) return false;
      if (todayOnly && r.date !== today) return false;
      return true;
    });
  }, [activities, statusFilter, userFilter, todayOnly, today]);

  useEffect(
    () => setPage(1),
    [statusFilter, userFilter, pageSize, dateRange, todayOnly]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleClearFilters = () => {
    setStatusFilter("all");
    setUserFilter("all");
    setTodayOnly(false);
    setDateRange(undefined);
    setPage(1);
    setStatusOpen(false);
    setUserOpen(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearAppToken();
      router.push("/login");
    } catch (err) {
      console.error("Sign-out failed:", err);
      showToast("Sign out failed", "error");
    }
  };

  // Check token expiry periodically and auto sign-out if expired
  useEffect(() => {
    if (!user) return;

    const checkExpiry = async () => {
      const { isTokenExpired } = await import("@/lib/api");
      if (isTokenExpired()) {
        showToast("Session expired. Please sign in again.", "error");
        await handleSignOut();
      }
    };

    // Check immediately
    checkExpiry();

    // Check every 30 seconds
    const interval = setInterval(checkExpiry, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Notify loader that navigation finished when this page mounts
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:navigated"));
    } catch (e) {
      // ignore on server
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("isDarkMode", String(isDarkMode));
  }, [isDarkMode]);

  // ensure page background matches dark mode (covers areas outside React root)
  useEffect(() => {
    if (typeof document === "undefined") return;
    // toggle tailwind gradient classes on body so background matches dashboard
    // use a purple gradient for dark mode and ensure body covers full height
    const darkCls = [
      "min-h-screen",
      "bg-gradient-to-br",
      "from-[#1f1744]",
      "via-[#3b2aa8]",
      "to-[#1a1a5a]",
    ];
    const lightCls = [
      "min-h-screen",
      "bg-gradient-to-br",
      "from-white",
      "via-gray-50",
      "to-gray-100",
    ];

    const htmlEl = document.documentElement;
    if (isDarkMode) {
      document.body.classList.add(...darkCls);
      htmlEl.classList.add(...darkCls);
      // remove light classes if present
      lightCls.forEach((c) => {
        document.body.classList.remove(c);
        htmlEl.classList.remove(c);
      });
    } else {
      // remove dark classes then add light to both body and html
      darkCls.forEach((c) => {
        document.body.classList.remove(c);
        htmlEl.classList.remove(c);
      });
      document.body.classList.add(...lightCls);
      htmlEl.classList.add(...lightCls);
    }
  }, [isDarkMode]);

  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Compute display name reactively based on user state
  const displayName = user?.displayName || user?.email || "User";
  const firstName = displayName.split(" ")[0];

  useEffect(() => {
    if (!user) return;

    // Use Gmail profile photo directly
    setAvatarUrl(
      user?.photoURL ||
        "https://ui-avatars.com/api/?name=" + encodeURIComponent(firstName)
    );
  }, [user, firstName]);

  // Fetch activities with dateRange support
  useEffect(() => {
    if (!user) return;

    const source = axios.CancelToken.source();

    const loadActivities = async () => {
      try {
        const mapped = await fetchActivities({
          dateRange,
          cancelToken: source.token,
        });
        setActivities(mapped);
      } catch (err: any) {
        if (axios.isCancel(err)) {
          return;
        }
        console.error("Error fetching activities:", err);
        setActivities([]);
      }
    };

    loadActivities();

    return () => {
      source.cancel();
    };
  }, [user, dateRange]);

  const handleLogIdToken = async () => {
    try {
      if (!user) {
        showToast("No user signed in", "error");
        return;
      }
      const token = await getIdToken(false);

      // Copy to clipboard
      await navigator.clipboard.writeText(token || "");

      console.log("=== ID TOKEN ===");
      console.log(token);
      console.log("================");
      showToast("Token copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to get token:", err);
      showToast("Failed to get token", "error");
    }
  };

  return (
    <AuthGuard>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#1f1744] via-[#3b2aa8] to-[#1a1a5a]"
            : "bg-gradient-to-br from-white via-gray-50 to-gray-100"
        }`}
      >
        <Sidebar />

        {/* Main Content */}
        <div
          className={`p-4 md:p-6 transition-all duration-300 ${
            sidebarExpanded ? "md:ml-64" : "md:ml-20"
          } ml-0`}
        >
          {/* Header */}
          <div className="flex flex-row items-center justify-between mb-8 gap-4 mt-12 md:mt-0">
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold mb-1 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Dashboard
              </h1>
              <div
                className={`flex items-center gap-2 text-xs md:text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{today}</span>
                <span className="sm:hidden">
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* dark mode toggle removed for now */}
              {/* notification button removed for now */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <img
                    src={avatarUrl || "https://ui-avatars.com/api/?name=User"}
                    alt="Profile"
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${
                      isDarkMode ? "border-white/20" : "border-gray-300"
                    }`}
                  />
                  <ChevronDown
                    className={`w-4 h-4 hidden sm:block ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  />
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute right-0 mt-2 w-56 border rounded-lg shadow-xl overflow-hidden z-20 ${
                        isDarkMode
                          ? "bg-slate-800 border-white/20"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div
                        className={`px-4 py-3 border-b ${
                          isDarkMode ? "border-white/10" : "border-gray-200"
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {displayName}
                        </p>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogIdToken();
                            setShowProfileMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition ${
                            isDarkMode
                              ? "text-gray-300 hover:bg-white/10"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Key className="w-4 h-4" />
                          <span>Log ID Token</span>
                        </button> */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignOut();
                            setShowProfileMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition ${
                            isDarkMode
                              ? "text-red-400 hover:bg-white/10"
                              : "text-red-600 hover:bg-gray-100"
                          }`}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Greeting Card */}
          <div
            className={`backdrop-blur-sm border rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 ${
              isDarkMode
                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-white/20"
                : "bg-gradient-to-r from-[#004d47]/10 via-[#09867e]/8 to-[#0c988d]/6 border-gray-200"
            }`}
          >
            <h2
              className={`text-lg md:text-2xl font-bold mb-1 md:mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ✨{" "}
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return "Good Morning";
                if (hour < 18) return "Good Afternoon";
                return "Good Evening";
              })()}
              , {firstName}
            </h2>
            <p
              className={`text-sm md:text-base ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Here's what's been happening recently
            </p>
          </div>

          {/* All Activities Section */}
          <div
            className={`backdrop-blur-sm border rounded-2xl p-4 ${
              isDarkMode
                ? "bg-white/10 border-white/20"
                : "bg-white border-gray-200"
            }`}
          >
            <h3
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              All Activities
            </h3>

            {/* Filters */}
            <div className="mb-4">
              <div className="flex flex-col lg:flex-row lg:items-end gap-2 lg:gap-3">
                <div ref={statusRef}>
                  <label
                    className={`text-sm ${
                      isDarkMode ? "text-white" : "text-gray-600"
                    }`}
                  >
                    Status
                  </label>
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
                  <label
                    className={`text-sm ${
                      isDarkMode ? "text-white" : "text-gray-600"
                    }`}
                  >
                    User
                  </label>
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

                {/* Date Range Filter */}
                <div>
                  <label
                    className={`text-sm ${
                      isDarkMode ? "text-white" : "text-gray-600"
                    }`}
                  >
                    Date Range
                  </label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    className="w-64"
                  />
                </div>

                {/* Quick shortcuts - desktop inline, mobile below */}
                <div className="flex items-end gap-2 flex-wrap mt-2 lg:mt-0">
                  <button
                    onClick={() => {
                      setStatusFilter("idle");
                      setUserFilter("all");
                      setTodayOnly(true);
                      setPage(1);
                    }}
                    className={`inline-flex items-center text-sm font-semibold gap-2 px-3 py-2 rounded-md transition ${
                      isDarkMode
                        ? "bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30"
                        : "bg-green-100 border border-green-300 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    View Today’s Idle
                  </button>

                  {(statusFilter !== "all" ||
                    userFilter !== "all" ||
                    todayOnly ||
                    dateRange) && (
                    <button
                      onClick={handleClearFilters}
                      title="Clear filters"
                      aria-label="Clear filters"
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border transition ${
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-800 text-gray-300"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Trash
                        className={`w-4 h-4 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      />
                      <span className="text-sm">Clear Filters</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div
                className={`text-sm ${
                  isDarkMode ? "text-white" : "text-gray-500"
                }`}
              >
                No activity logs found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-left border-collapse">
                      <thead>
                        <tr
                          className={`text-sm border-b ${
                            isDarkMode
                              ? "text-gray-400 border-white/10"
                              : "text-gray-600 border-gray-200"
                          }`}
                        >
                          <th className="py-2 px-3 whitespace-nowrap">User</th>
                          <th className="py-2 px-3 whitespace-nowrap">Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Title / Reason</th>
                          <th className="py-2 px-3">Details</th>
                          <th className="py-2 px-3">Created</th>
                          <th className="py-2 px-3">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.map((r) => (
                          <tr
                            key={r.id}
                            className={
                              isDarkMode
                                ? "odd:bg-gray-800/30"
                                : "odd:bg-gray-50"
                            }
                          >
                            <td
                              className={`py-2 px-3 align-top text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {r.userName || r.userEmail || "Unknown"}
                            </td>
                            <td
                              className={`py-2 px-3 align-top text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
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
                            <td
                              className={`py-2 px-3 align-top text-sm ${
                                isDarkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {r.status === "off_duty" || r.status === "idle"
                                ? r.reason || "-"
                                : r.title || "-"}
                            </td>
                            <td
                              className={`py-2 px-3 align-top text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              <div>
                                <div>{r.detail || "-"}</div>
                                {r.status === "on_duty" &&
                                  r.percentStart !== undefined &&
                                  r.percentEnd !== undefined && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {r.percentStart}% → {r.percentEnd}%
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td
                              className={`py-2 px-3 align-top text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleString()
                                : "-"}
                            </td>
                            <td
                              className={`py-2 px-3 align-top text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {r.updatedAt
                                ? new Date(r.updatedAt).toLocaleString()
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
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Showing{" "}
                      {filteredRows.length === 0
                        ? 0
                        : (page - 1) * pageSize + 1}
                      –{Math.min(page * pageSize, filteredRows.length)} of{" "}
                      {filteredRows.length}
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Rows per page
                      </div>
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
                            ? isDarkMode
                              ? "text-gray-600 border-gray-700"
                              : "text-gray-400 border-gray-200"
                            : isDarkMode
                            ? "border-gray-700 hover:bg-white/5"
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
                            ? isDarkMode
                              ? "text-gray-600 border-gray-700"
                              : "text-gray-400 border-gray-200"
                            : isDarkMode
                            ? "border-gray-700 hover:bg-white/5"
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
                                ? "bg-green-600 text-white border-green-600"
                                : isDarkMode
                                ? "border-gray-700 hover:bg-white/5"
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
                            ? isDarkMode
                              ? "text-gray-600 border-gray-700"
                              : "text-gray-400 border-gray-200"
                            : isDarkMode
                            ? "border-gray-700 hover:bg-white/5"
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
                            ? isDarkMode
                              ? "text-gray-600 border-gray-700"
                              : "text-gray-400 border-gray-200"
                            : isDarkMode
                            ? "border-gray-700 hover:bg-white/5"
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
      </div>
    </AuthGuard>
  );
}
