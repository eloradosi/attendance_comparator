"use client";

import { useEffect, useState } from "react";
import { ActivityLog } from "@/utils/activityStore";
import {
  deleteActivityLog,
  loadActivityLogs,
  updateActivityLog,
  addActivityLog,
} from "@/utils/activityStore";
import { showToast } from "@/components/Toast";
import ActivityForm from "@/components/activity/ActivityForm";
import Modal from "@/components/Modal";
import { auth } from "@/lib/firebaseClient";
import { Edit, Trash2 } from "lucide-react";

type Props = {
  onChange?: () => void;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTopDatetime(dateInput: string | number | Date) {
  const d =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
  // Date in Indonesian long month + time in Asia/Jakarta (WIB)
  const datePart = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d);
  return `${datePart} | ${timePart} WIB`;
}

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
  // day/month/year without forcing leading zero, time in 24h, Asia/Jakarta
  const dateParts = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).formatToParts(d);
  const day = dateParts.find((p) => p.type === "day")?.value ?? "";
  const month = dateParts.find((p) => p.type === "month")?.value ?? "";
  const year = dateParts.find((p) => p.type === "year")?.value ?? "";
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d);
  return `${day}/${month}/${year}, ${time} WIB`;
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

export default function ActivityList({ onChange }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setLogs(loadActivityLogs(uid));
  }, [uid]);

  const refresh = () => {
    if (!uid) return;
    setLogs(loadActivityLogs(uid));
    onChange?.();
  };

  const handleAdd = (log: ActivityLog) => {
    if (!uid) return;
    addActivityLog(uid, log);
    setAdding(false);
    refresh();
    showToast("Activity added", "success");
  };

  const handleSave = (log: ActivityLog) => {
    if (!uid) return;
    // only allow updating today's logs
    if (log.date !== todayISO()) {
      alert("You can only edit logs for today");
      return;
    }
    updateActivityLog(uid, log);
    setEditingId(null);
    refresh();
    showToast("Activity updated", "success");
  };

  const handleDelete = (id: string) => {
    if (!uid) return;
    setToDelete(id);
  };

  const [toDelete, setToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!uid || !toDelete) return;
    deleteActivityLog(uid, toDelete);
    setToDelete(null);
    refresh();
    showToast("Activity deleted", "info");
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
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              + Add Activity
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
          <div className="text-sm text-gray-500">No activity logs yet.</div>
        )}
        {logs.map((l) => {
          const isToday = l.date === todayISO();
          const relLabel = relativeDayLabel(l.date);
          const relClass = "bg-gray-100 text-gray-700";

          return (
            <div key={l.id} className="bg-white p-4 rounded shadow-sm relative">
              {/* top-right relative time badge (hidden for today's items) */}
              {!isToday && (
                <div
                  className={`absolute right-3 top-3 px-2 py-0.5 rounded-full text-xs font-medium ${relClass}`}
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
                      <div className="text-sm text-gray-500">
                        {formatTopDate(l.createdAt)}
                      </div>
                      <div
                        className={`text-sm px-2 py-1 rounded ${
                          l.status === "busy"
                            ? "bg-red-100 text-red-700"
                            : l.status === "normal"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {l.status}
                      </div>
                    </div>
                    <div className="mt-2 font-medium text-gray-800">
                      {l.title}
                    </div>
                    {l.detail && (
                      <div className="mt-1 text-sm text-gray-600">
                        {l.detail}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      Created {formatSmallDatetime(l.createdAt)}
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
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => setEditingId(l.id)}
                          title="Edit"
                          aria-label={`Edit ${l.title}`}
                          className="p-2 rounded border text-gray-600 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          title="Delete"
                          aria-label={`Delete ${l.title}`}
                          className="p-2 rounded border text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
