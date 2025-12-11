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

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50",
          !dateRange && "text-gray-500"
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
          <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={1}
              className="rounded-md"
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
              <button
                onClick={() => {
                  onDateRangeChange(undefined);
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
