"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  value: string; // HH:MM format
  onChange: (v: string) => void;
  width?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
};

/**
 * TIME PICKER VARIANT 2: Compact Scrollable Wheels
 * Style yang lebih mobile-friendly dengan scroll wheel design
 */
export default function TimePickerCompact({
  value,
  onChange,
  width = "w-full",
  placeholder = "Select time",
  label,
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tempHour, setTempHour] = useState<number>(0);
  const [tempMinute, setTempMinute] = useState<number>(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const hourScrollRef = useRef<HTMLDivElement | null>(null);
  const minuteScrollRef = useRef<HTMLDivElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("isDarkMode") === "true"
  );

  // Parse value when component mounts or value changes
  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setTempHour(parseInt(h, 10));
      setTempMinute(parseInt(m, 10));
    } else {
      setTempHour(0);
      setTempMinute(0);
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
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // Every 5 minutes

  const handleConfirm = () => {
    const time = `${String(tempHour).padStart(2, "0")}:${String(
      tempMinute
    ).padStart(2, "0")}`;
    onChange(time);
    setOpen(false);
  };

  const formatDisplay = () => {
    if (value) {
      return value;
    }
    return placeholder;
  };

  // Scroll to selected value when opening
  useEffect(() => {
    if (open && hourScrollRef.current && minuteScrollRef.current) {
      const hourElement = hourScrollRef.current.querySelector(
        `[data-hour="${tempHour}"]`
      );
      const minuteElement = minuteScrollRef.current.querySelector(
        `[data-minute="${tempMinute}"]`
      );
      hourElement?.scrollIntoView({ block: "center" });
      minuteElement?.scrollIntoView({ block: "center" });
    }
  }, [open, tempHour, tempMinute]);

  return (
    <div ref={ref} className={`relative ${width}`}>
      {label && (
        <label className="text-sm text-gray-600">
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
        } w-full rounded px-3 py-2 flex items-center justify-between text-sm border transition ${
          isDarkMode
            ? "bg-white/5 border-white/20 text-white"
            : "bg-white border-gray-300 text-gray-900"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">⏰</span>
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
          className={`absolute mt-1 left-0 right-0 rounded shadow-lg z-50 p-4 ${
            isDarkMode
              ? "bg-teal-900 border border-teal-700/30"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {/* Hour Wheel */}
            <div className="flex flex-col items-center">
              <div
                className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Hour
              </div>
              <div
                ref={hourScrollRef}
                className={`h-32 overflow-y-auto w-16 rounded ${
                  isDarkMode ? "bg-teal-800/30" : "bg-gray-50"
                }`}
                style={{
                  scrollbarWidth: "thin",
                }}
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    data-hour={hour}
                    onClick={() => setTempHour(hour)}
                    className={`w-full py-2 text-center text-sm transition ${
                      tempHour === hour
                        ? isDarkMode
                          ? "bg-teal-600 text-white font-bold"
                          : "bg-teal-500 text-white font-bold"
                        : isDarkMode
                        ? "hover:bg-teal-700/50 text-gray-200"
                        : "hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {String(hour).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <span
              className={`text-2xl font-bold ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              :
            </span>

            {/* Minute Wheel */}
            <div className="flex flex-col items-center">
              <div
                className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Minute
              </div>
              <div
                ref={minuteScrollRef}
                className={`h-32 overflow-y-auto w-16 rounded ${
                  isDarkMode ? "bg-teal-800/30" : "bg-gray-50"
                }`}
                style={{
                  scrollbarWidth: "thin",
                }}
              >
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    data-minute={minute}
                    onClick={() => setTempMinute(minute)}
                    className={`w-full py-2 text-center text-sm transition ${
                      tempMinute === minute
                        ? isDarkMode
                          ? "bg-teal-600 text-white font-bold"
                          : "bg-teal-500 text-white font-bold"
                        : isDarkMode
                        ? "hover:bg-teal-700/50 text-gray-200"
                        : "hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {String(minute).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setTempHour(now.getHours());
                setTempMinute(Math.floor(now.getMinutes() / 5) * 5);
              }}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition ${
                isDarkMode
                  ? "bg-teal-700 hover:bg-teal-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Now
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition ${
                isDarkMode
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded text-xs font-medium transition ${
                isDarkMode
                  ? "bg-red-900/50 hover:bg-red-900/70 text-red-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
