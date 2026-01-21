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
 * TIME PICKER VARIANT 3: Hybrid Input with Quick Presets
 * Kombinasi manual input + preset waktu populer
 */
export default function TimePickerHybrid({
  value,
  onChange,
  width = "w-full",
  placeholder = "Select time",
  label,
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState(value);
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("isDarkMode") === "true"
  );

  useEffect(() => {
    setManualInput(value);
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

  // Common time presets
  const presets = [
    { label: "Start Work", value: "08:00", icon: "🌅" },
    { label: "Morning Break", value: "10:00", icon: "☕" },
    { label: "Lunch", value: "12:00", icon: "🍽️" },
    { label: "Afternoon", value: "14:00", icon: "🌤️" },
    { label: "End Work", value: "17:00", icon: "🌆" },
    { label: "Evening", value: "18:00", icon: "🌙" },
    { label: "Now", value: "now", icon: "⏰" },
  ];

  const handlePresetClick = (preset: string) => {
    if (preset === "now") {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      onChange(time);
      setManualInput(time);
    } else {
      onChange(preset);
      setManualInput(preset);
    }
    setOpen(false);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualInput(val);
    // Validate HH:MM format
    if (/^\d{2}:\d{2}$/.test(val)) {
      const [h, m] = val.split(":");
      const hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        onChange(val);
      }
    }
  };

  const formatDisplay = () => {
    if (value) {
      return value;
    }
    return placeholder;
  };

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
          <span className="text-base">⏱️</span>
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
          {/* Manual Input */}
          <div className="mb-3">
            <label
              className={`text-xs font-semibold mb-1 block ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Manual Input
            </label>
            <input
              type="time"
              value={manualInput}
              onChange={handleManualChange}
              className={`w-full px-3 py-2 rounded text-sm border ${
                isDarkMode
                  ? "bg-teal-800/30 border-teal-700/50 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label
              className={`text-xs font-semibold mb-2 block ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    isDarkMode
                      ? "bg-teal-800/50 hover:bg-teal-700 text-gray-200"
                      : "bg-gray-50 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <span className="text-base">{preset.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-medium text-xs">{preset.label}</div>
                    {preset.value !== "now" && (
                      <div className="text-xs opacity-60">{preset.value}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Clear Action */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-teal-700/30">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setManualInput("");
                setOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-xs font-medium transition ${
                isDarkMode
                  ? "bg-red-900/50 hover:bg-red-900/70 text-red-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Clear Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
