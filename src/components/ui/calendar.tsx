"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [isDark, setIsDark] = React.useState(
    typeof window !== "undefined" &&
      sessionStorage.getItem("isDarkMode") === "true"
  );

  React.useEffect(() => {
    setIsDark(
      typeof window !== "undefined" &&
        sessionStorage.getItem("isDarkMode") === "true"
    );
  }, []);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn("text-sm font-medium", isDark ? "text-white" : ""),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          isDark ? "text-gray-300 hover:bg-white/5" : ""
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn(
          "rounded-md w-9 font-normal text-[0.8rem]",
          isDark ? "text-gray-300" : "text-gray-500"
        ),
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md focus-within:relative focus-within:z-20",
          isDark
            ? ""
            : "[&:has([aria-selected].day-outside)]:bg-gray-100/50 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
          isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-100"
        ),
        day_range_end: "day-range-end",
        day_selected: isDark
          ? "bg-green-500 text-white hover:bg-green-500 hover:text-white focus:bg-green-500 focus:text-white"
          : "bg-green-600 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white",
        day_today: isDark
          ? "bg-white/5 text-gray-200"
          : "bg-gray-100 text-gray-900",
        day_outside: isDark
          ? "day-outside text-gray-400 opacity-60 aria-selected:bg-white/5 aria-selected:text-gray-200"
          : "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-100/50 aria-selected:text-gray-500 aria-selected:opacity-30",
        day_disabled: isDark
          ? "text-gray-500 opacity-50"
          : "text-gray-500 opacity-50",
        day_range_middle: isDark
          ? "aria-selected:bg-white/5 aria-selected:text-white"
          : "aria-selected:bg-gray-100 aria-selected:text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
