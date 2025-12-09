"use client";

import { useEffect, useState, useRef } from "react";
import { ActivityLog, ActivityStatus } from "@/utils/activityStore";
import Modal from "@/components/Modal";

type Props = {
  initial?: Partial<ActivityLog>;
  onCancel?: () => void;
  onSave: (log: ActivityLog) => void;
  forTodayOnly?: boolean; // if true, date is locked to today
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ActivityForm({
  initial,
  onCancel,
  onSave,
  forTodayOnly = true,
}: Props) {
  const [date, setDate] = useState(initial?.date || todayISO());
  const [title, setTitle] = useState(initial?.title || "");
  const [detail, setDetail] = useState(initial?.detail || "");
  const [percentStart, setPercentStart] = useState<number | "">(
    initial?.percentStart ?? ""
  );
  const [percentEnd, setPercentEnd] = useState<number | "">(
    initial?.percentEnd ?? ""
  );
  const [reason, setReason] = useState(initial?.reason || "");
  const [status, setStatus] = useState<ActivityStatus>(
    initial?.status || "idle"
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const reasonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (e.target instanceof Node) {
        // If click is inside status dropdown, keep it open
        if (ref.current && ref.current.contains(e.target)) return;
        // If click is inside reason dropdown, keep it open
        if (reasonRef.current && reasonRef.current.contains(e.target)) return;
      }
      setOpen(false);
      setReasonOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (forTodayOnly) setDate(todayISO());
  }, [forTodayOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation per status
    if (status === "on_duty") {
      if (!title.trim()) {
        alert("Please enter an activity title for On duty");
        return;
      }
      if (percentStart === "" || percentEnd === "") {
        alert("Please enter start/end percentage for On duty");
        return;
      }
      if (Number(percentStart) > Number(percentEnd)) {
        alert("Start percentage cannot be greater than end percentage");
        return;
      }
    } else if (status === "off_duty") {
      if (!reason) {
        alert("Please select a reason for Off duty");
        return;
      }
    }
    // show confirmation modal instead of immediately saving
    const log: ActivityLog = {
      id:
        initial?.id ||
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? (crypto as any).randomUUID()
          : String(Date.now())),
      date,
      status,
      // include only fields relevant to the selected status
      title: status === "on_duty" ? title.trim() || undefined : undefined,
      detail: status === "on_duty" ? detail.trim() || undefined : undefined,
      percentStart:
        status === "on_duty"
          ? percentStart === ""
            ? undefined
            : Number(percentStart)
          : undefined,
      percentEnd:
        status === "on_duty"
          ? percentEnd === ""
            ? undefined
            : Number(percentEnd)
          : undefined,
      reason: status === "off_duty" ? reason || undefined : undefined,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPendingLog(log);
    setConfirmOpen(true);
  };

  const isToday = date === todayISO();
  // determine if form is dirty compared to initial
  const isDirty = (() => {
    if (!initial) {
      // allow creating an Idle activity even without extra fields so it can be tracked
      if (status === "idle") return true;
      if (status === "on_duty")
        return (
          title.trim() !== "" ||
          detail.trim() !== "" ||
          percentStart !== "" ||
          percentEnd !== ""
        );
      if (status === "off_duty") return reason !== "";
      return true;
    }
    return (
      initial.date !== date ||
      (initial.title || "") !== title ||
      (initial.detail || "") !== detail ||
      (initial.status || "idle") !== status ||
      (initial.percentStart || "") !== percentStart ||
      (initial.percentEnd || "") !== percentEnd ||
      (initial.reason || "") !== reason
    );
  })();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLog, setPendingLog] = useState<ActivityLog | null>(null);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            disabled={forTodayOnly}
            aria-invalid={!isToday}
            title={forTodayOnly ? "Date is locked to today" : undefined}
          />
        </div>

        <div className="relative">
          <label className="text-sm text-gray-600">Status</label>
          {/* Custom dropdown with colored dot icons */}
          <div ref={ref as any} className="mt-1">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="w-full border rounded px-3 py-2 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    status === "on_duty"
                      ? "bg-amber-600"
                      : status === "off_duty"
                      ? "bg-red-600"
                      : "bg-green-600"
                  }`}
                />
                <span className="capitalize">
                  {status === "on_duty"
                    ? "On duty"
                    : status === "off_duty"
                    ? "Off duty"
                    : "Idle"}
                </span>
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {open && (
              <ul
                role="listbox"
                className="mt-1 absolute left-0 right-0 bg-white border rounded shadow-md z-50"
              >
                {(["on_duty", "off_duty", "idle"] as ActivityStatus[]).map(
                  (s) => (
                    <li
                      key={s}
                      role="option"
                      aria-selected={s === status}
                      onClick={() => {
                        // change status and clear fields that are not relevant to the new status
                        setStatus(s);
                        setOpen(false);
                        if (s !== "on_duty") {
                          setTitle("");
                          setDetail("");
                          setPercentStart("");
                          setPercentEnd("");
                        }
                        if (s !== "off_duty") {
                          setReason("");
                        }
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    >
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          s === "on_duty"
                            ? "bg-amber-600"
                            : s === "off_duty"
                            ? "bg-red-600"
                            : "bg-green-600"
                        }`}
                      />
                      <span className="capitalize">
                        {s === "on_duty"
                          ? "On duty"
                          : s === "off_duty"
                          ? "Off duty"
                          : "Idle"}
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        {status === "on_duty" && (
          <>
            <label className="text-sm text-gray-600">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="Short descriptive title"
            />
          </>
        )}
      </div>

      <div className="mt-3">
        {status === "on_duty" && (
          <>
            <label className="text-sm text-gray-600">Detail</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 min-h-[80px]"
              placeholder="Describe the activity (optional)"
            />
          </>
        )}
        {status === "off_duty" && (
          <>
            <label className="text-sm text-gray-600">Reason</label>
            <div ref={reasonRef as any} className="relative mt-1">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={reasonOpen}
                onClick={() => setReasonOpen((s) => !s)}
                className="w-full border rounded px-3 py-2 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {reason === "" ? (
                    <span className="text-sm text-gray-700">Select reason</span>
                  ) : (
                    // show icon + label when selected
                    <span className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        {reason === "sakit"
                          ? "🩺"
                          : reason === "cuti"
                          ? "🏖️"
                          : "✅"}
                      </span>
                      <span className="capitalize text-sm text-gray-800">
                        {reason === "sakit"
                          ? "Sakit"
                          : reason === "cuti"
                          ? "Cuti"
                          : "Izin"}
                      </span>
                    </span>
                  )}
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {reasonOpen && (
                <ul
                  role="listbox"
                  className="mt-1 absolute left-0 right-0 bg-white border rounded shadow-md z-50"
                >
                  {[
                    { value: "sakit", label: "Sakit", icon: "🩺" },
                    { value: "cuti", label: "Cuti", icon: "🏖️" },
                    { value: "izin", label: "Izin", icon: "✅" },
                  ].map((opt) => (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={opt.value === reason}
                      onClick={() => {
                        setReason(opt.value);
                        setReasonOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                    >
                      <span className="text-lg" aria-hidden>
                        {opt.icon}
                      </span>
                      <span>{opt.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        {status === "on_duty" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-sm text-gray-600">Start %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percentStart}
                onChange={(e) =>
                  setPercentStart(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">End %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percentEnd}
                onChange={(e) =>
                  setPercentEnd(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={!isDirty}
          className={`px-4 py-2 ${
            isDirty ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
          } rounded`}
        >
          {initial ? "Save" : "Add Activity"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 border rounded text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        title={initial ? "Confirm Save" : "Confirm Add"}
        onClose={() => setConfirmOpen(false)}
      >
        <p className="mb-4">
          Are you sure you want to{" "}
          {initial ? "save changes" : "add this activity"}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmOpen(false)}
            className="px-3 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (pendingLog) {
                onSave(pendingLog);
                setConfirmOpen(false);
                setPendingLog(null);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Yes, {initial ? "Save" : "Add"}
          </button>
        </div>
      </Modal>
    </form>
  );
}
