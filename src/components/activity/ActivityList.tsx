"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "@/components/Toast";
import ActivityForm from "@/components/activity/ActivityForm";
import Modal from "@/components/Modal";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { Edit } from "lucide-react";
import {
  fetchMyActivities,
  saveActivity,
  deleteActivity,
  todayISO,
  type ActivityLog,
} from "@/components/service/activity";

type Props = {
  onActivityAdded?: () => void; // ✅ NEW: trigger parent (hide warning)
};

function formatTopDate(dateInput: string | number | Date) {
  const d =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

function formatSmallDatetime(dateInput: string | number | Date) {
  const d =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Jakarta",
  }).format(d);
  return time;
}

function relativeDayLabel(dateInput: string | number | Date) {
  const d =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
  const now = new Date();
  const dateOnly = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const nowOnly = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowOnly - dateOnly) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

export default function ActivityList({ onActivityAdded }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isDarkMode");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window === "undefined") return;
      const saved = sessionStorage.getItem("isDarkMode");
      const cur = saved !== null ? saved === "true" : false;
      setIsDarkMode(cur);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const [uid, setUid] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const authInstance = await getFirebaseAuth();
        if (isMounted) setUid(authInstance.currentUser?.uid);
      } catch (e) {
        setUid(undefined);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initial load
  useEffect(() => {
    if (!uid) return;

    let isMounted = true;
    const source = axios.CancelToken.source();

    (async () => {
      try {
        const mapped = await fetchMyActivities({
          page: 0,
          size: 100,
          cancelToken: source.token,
        });

        if (isMounted) {
          setLogs(mapped);

          // Check if there's activity for today and notify parent
          const today = todayISO();
          const hasToday = mapped.some((log) => log.date === today);
          if (hasToday && onActivityAdded) {
            onActivityAdded();
          }
        }
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        if (isMounted) {
          console.error("Failed to load activity logs from backend", err);
          showToast(
            err.response?.data?.message || "Failed to load activity logs",
            "error"
          );
          setLogs([]);
        }
      }
    })();

    return () => {
      isMounted = false;
      source.cancel();
    };
  }, [uid]);

  const refresh = () => {
    if (!uid) return;
    (async () => {
      try {
        const mapped = await fetchMyActivities({
          page: 0,
          size: 100,
        });

        setLogs(mapped);

        // Check if there's activity for today and notify parent
        const today = todayISO();
        const hasToday = mapped.some((log) => log.date === today);
        if (hasToday && onActivityAdded) {
          onActivityAdded();
        }
      } catch (err: any) {
        console.error("Failed to refresh from backend", err);
        showToast(
          err.response?.data?.message || "Failed to refresh activity logs",
          "error"
        );
        setLogs([]);
      }
    })();
  };

  const handleAdd = async (log: ActivityLog) => {
    if (!uid) return;

    try {
      // For new activity, don't send id (let backend generate it)
      const { id, createdAt, updatedAt, ...logWithoutId } = log;
      await saveActivity(logWithoutId as ActivityLog);
      setAdding(false);
      refresh();

      // ✅ NEXT LEVEL: tell parent to hide warning
      onActivityAdded?.();

      showToast("Activity added", "success");
      return;
    } catch (err: any) {
      console.error("Error adding activity:", err);
      showToast(
        err.response?.data?.message || "Failed to add activity",
        "error"
      );
      setAdding(false);
    }
  };

  const handleSave = async (log: ActivityLog) => {
    if (!uid) return;

    try {
      await saveActivity(log);
      setEditingId(null);
      refresh();
      showToast("Activity updated", "success");
      return;
    } catch (err: any) {
      console.error("Error updating activity:", err);
      showToast(
        err.response?.data?.message || "Failed to update activity",
        "error"
      );
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!uid) return;
    setToDelete(id);
  };

  const confirmDelete = async () => {
    if (!uid || !toDelete) return;
    try {
      await deleteActivity(toDelete);
      setToDelete(null);
      refresh();
      showToast("Activity deleted", "success");
    } catch (err: any) {
      console.error("Error deleting activity:", err);
      showToast(
        err.response?.data?.message || "Failed to delete activity",
        "error"
      );
      setToDelete(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Activity Logs</h2>
        </div>

        <div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className={`px-3 py-2 font-semibold text-sm rounded transition ${
                isDarkMode
                  ? "bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30"
                  : "bg-green-100 border border-green-300 text-green-700 hover:bg-green-200"
              }`}
            >
              Add Activity
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-4">
          <ActivityForm
            onCancel={() => setAdding(false)}
            onSave={handleAdd}
            forTodayOnly
          />
        </div>
      )}

      <div className="space-y-3">
        {logs.length === 0 && (
          <div
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-500"
            }`}
          >
            No activity logs yet.
          </div>
        )}

        {logs.map((l) => {
          const isToday = l.date === todayISO();
          const relLabel = relativeDayLabel(l.date);

          return (
            <div
              key={l.id}
              className={`${
                isDarkMode ? "bg-white/5" : "bg-white"
              } p-4 rounded shadow-sm relative`}
            >
              {!isToday && (
                <div
                  className={`absolute right-3 top-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isDarkMode
                      ? "bg-white/10 text-gray-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {relLabel}
                </div>
              )}

              {editingId === l.id ? (
                <ActivityForm
                  initial={l}
                  onCancel={() => setEditingId(null)}
                  onSave={handleSave}
                  forTodayOnly
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {l.createdAt ? formatTopDate(l.createdAt) : "-"}
                      </div>

                      <div
                        className={`text-sm px-2 py-1 rounded ${
                          l.status === "on_duty"
                            ? "bg-amber-100 text-amber-700"
                            : l.status === "off_duty"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {l.status === "on_duty"
                          ? "On duty"
                          : l.status === "off_duty"
                          ? "Off duty"
                          : "Idle"}
                      </div>
                    </div>

                    {l.title && (
                      <div
                        className={`mt-2 font-medium ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {l.title}
                      </div>
                    )}

                    {l.detail && (
                      <div
                        className={`mt-1 text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {l.detail}
                      </div>
                    )}

                    {l.status === "on_duty" && (
                      <div
                        className={`mt-2 text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Start: {l.percentStart ?? "-"}% · End:{" "}
                        {l.percentEnd ?? "-"}%
                      </div>
                    )}

                    {l.status === "off_duty" && l.reason && (
                      <div
                        className={`mt-2 text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Reason: {l.reason}
                      </div>
                    )}

                    {l.status === "idle" && l.reason && (
                      <div
                        className={`mt-2 text-sm italic ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {l.reason}
                      </div>
                    )}

                    <div
                      className={`mt-2 text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-400"
                      }`}
                    >
                      Created{" "}
                      {l.createdAt ? formatSmallDatetime(l.createdAt) : "-"}
                      {l.updatedAt ? (
                        <span>
                          {" "}
                          · Updated {formatSmallDatetime(l.updatedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isToday ? (
                      <button
                        onClick={() => setEditingId(l.id)}
                        title="Edit"
                        aria-label={`Edit ${l.title}`}
                        className={`p-2 rounded border ${
                          isDarkMode
                            ? "text-gray-300 border-white/10 hover:bg-white/5"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      {toDelete && (
        <Modal
          open={!!toDelete}
          title="Confirm Delete"
          onClose={() => setToDelete(null)}
        >
          <p className="mb-4">
            Are you sure you want to delete this activity? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setToDelete(null)}
              className="px-3 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
