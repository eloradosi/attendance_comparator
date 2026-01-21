"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  value: string; // HH:MM format
  onChange: (v: string) => void;
  width?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: boolean; // Add error prop
};

export default function TimePicker({
  value,
  onChange,
  width = "w-full",
  placeholder = "Select time",
  label,
  required = false,
  error = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("isDarkMode") === "true"
  );

  // Parse value when component mounts or value changes
  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setSelectedHour(parseInt(h, 10));
      setSelectedMinute(parseInt(m, 10));
    } else {
      setSelectedHour(null);
      setSelectedMinute(null);
    }
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIsDarkMode(sessionStorage.getItem("isDarkMode") === "true");
    }, 500);
    return () => clearInterval(id);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    if (selectedMinute !== null) {
      const time = `${String(hour).padStart(2, "0")}:${String(
        selectedMinute
      ).padStart(2, "0")}`;
      onChange(time);
      setOpen(false);
    }
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedHour !== null) {
      const time = `${String(selectedHour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;
      onChange(time);
      setOpen(false);
    }
  };

  const formatDisplay = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      return `${String(selectedHour).padStart(2, "0")}:${String(
        selectedMinute
      ).padStart(2, "0")}`;
    }
    return placeholder;
  };

  return (
    <div ref={ref} className={`relative ${width}`}>
      {label && (
        <label className="text-xs text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-1 text-xs">*</span>}
        </label>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={`${
          label ? "mt-1" : ""
        } w-full rounded px-3 py-1.5 flex items-center justify-between text-sm border transition ${
          error
            ? "border-red-500"
            : isDarkMode
            ? "bg-white/5 border-white/20 text-white"
            : "bg-white border-gray-300 text-gray-900"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">🕐</span>
          <span className={value ? "" : "text-gray-400"}>
            {formatDisplay()}
          </span>
        </span>
        <svg
          className={`w-4 h-4 ${
            isDarkMode ? "text-gray-300" : "text-gray-500"
          }`}
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
        <div
          className={`absolute mt-1 left-0 right-0 rounded shadow-lg z-50 p-3 ${
            isDarkMode
              ? "bg-teal-900 border border-teal-700/30"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Hour Column */}
            <div>
              <div
                className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Hour
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourSelect(hour)}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                      selectedHour === hour
                        ? isDarkMode
                          ? "bg-teal-700 text-white"
                          : "bg-teal-100 text-teal-900 font-medium"
                        : isDarkMode
                        ? "hover:bg-teal-800/50 text-gray-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {String(hour).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Column */}
            <div>
              <div
                className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Minute
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteSelect(minute)}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                      selectedMinute === minute
                        ? isDarkMode
                          ? "bg-teal-700 text-white"
                          : "bg-teal-100 text-teal-900 font-medium"
                        : isDarkMode
                        ? "hover:bg-teal-800/50 text-gray-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {String(minute).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-teal-700/30">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const h = now.getHours();
                  const m = now.getMinutes();
                  setSelectedHour(h);
                  setSelectedMinute(m);
                  onChange(
                    `${String(h).padStart(2, "0")}:${String(m).padStart(
                      2,
                      "0"
                    )}`
                  );
                  setOpen(false);
                }}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${
                  isDarkMode
                    ? "bg-teal-700 hover:bg-teal-600 text-white"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                }`}
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedHour(null);
                  setSelectedMinute(null);
                  onChange("");
                  setOpen(false);
                }}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${
                  isDarkMode
                    ? "bg-red-900/50 hover:bg-red-900/70 text-red-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
