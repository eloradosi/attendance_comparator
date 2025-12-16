"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("isDarkMode") === "true"
  );

  React.useEffect(() => {
    const id = setInterval(() => {
      setIsDarkMode(sessionStorage.getItem("isDarkMode") === "true");
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          `flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md ${
            isDarkMode
              ? "bg-white/5 border-white/20 text-white"
              : "bg-white hover:bg-gray-50"
          }`,
          !dateRange && (isDarkMode ? "text-gray-300" : "text-gray-500")
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                {format(dateRange.to, "dd/MM/yyyy")}
              </>
            ) : (
              format(dateRange.from, "dd/MM/yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </div>
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute z-50 mt-2 rounded-lg shadow-lg p-3 ${
              isDarkMode
                ? "bg-teal-900 border border-teal-700/30"
                : "bg-white border"
            }`}
          >
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={1}
              className="rounded-md"
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  onDateRangeChange(undefined);
                  setIsOpen(false);
                }}
                className={`px-3 py-1.5 text-sm border rounded ${
                  isDarkMode
                    ? "hover:bg-white/5 text-gray-300 border-gray-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className={`px-3 py-1.5 text-sm rounded ${
                  isDarkMode
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
