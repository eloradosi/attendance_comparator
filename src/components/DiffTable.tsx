"use client";

import { useState } from "react";
import { DiffItem } from "@/utils/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import DiffStatusBadge from "./DiffStatusBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DiffTableProps {
  diffs: DiffItem[];
}

const formatDate = (dateString: string): string => {
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

  const date = new Date(dateString);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export default function DiffTable({ diffs }: DiffTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(diffs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDiffs = diffs.slice(startIndex, endIndex);

  const handlePreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (page: number) => setCurrentPage(page);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const getTimesheetCellStyle = (
    field: string,
    type: "checkin" | "checkout",
    timesheetValue: string | null | undefined,
    ihcsValue: string | null | undefined
  ) => {
    if (
      field === "CHECK_IN" &&
      type === "checkin" &&
      timesheetValue !== ihcsValue
    ) {
      return "text-red-600";
    }
    if (
      field === "CHECK_OUT" &&
      type === "checkout" &&
      timesheetValue !== ihcsValue
    ) {
      return "text-red-600";
    }
    if (field === "CHECK_IN_CHECKOUT" && timesheetValue !== ihcsValue) {
      return "text-red-600";
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white shadow-smooth overflow-hidden">
        <Table>
          <TableHeader>
            {/* MAIN HEADER */}
            <TableRow className="border-b-2">
              <TableHead className="font-semibold w-28 border-r-2 text-center">
                Date
              </TableHead>

              <TableHead
                className="font-semibold text-center border-r-2"
                colSpan={2}
              >
                Check-in
              </TableHead>

              <TableHead
                className="font-semibold text-center border-r-2"
                colSpan={2}
              >
                Check-out
              </TableHead>

              <TableHead className="font-semibold w-48 text-center">
                Status
              </TableHead>
            </TableRow>

            {/* SUB HEADER */}
            <TableRow className="border-b-2">
              <TableHead className="font-normal text-xs text-center border-r-2"></TableHead>

              <TableHead className="font-normal text-xs text-center w-20 border-r">
                IHCS
              </TableHead>
              <TableHead className="font-normal text-xs text-center w-20 border-r-2">
                Timesheet
              </TableHead>

              <TableHead className="font-normal text-xs text-center w-20 border-r">
                IHCS
              </TableHead>
              <TableHead className="font-normal text-xs text-center w-20 border-r-2">
                Timesheet
              </TableHead>

              <TableHead className="font-normal text-xs text-center"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentDiffs.map((diff, index) => (
              <TableRow key={index} className="border-b">
                <TableCell className="font-medium text-center border-r-2">
                  {formatDate(diff.date)}
                </TableCell>

                <TableCell className="text-center border-r w-20">
                  {diff.valueCheckinIhcs || "-"}
                </TableCell>

                <TableCell
                  className={`text-center border-r-2 w-20 ${getTimesheetCellStyle(
                    diff.field,
                    "checkin",
                    diff.valueCheckinTimesheet,
                    diff.valueCheckinIhcs
                  )}`}
                >
                  {diff.valueCheckinTimesheet || "-"}
                </TableCell>

                <TableCell className="text-center border-r w-20">
                  {diff.valueCheckoutIhcs || "-"}
                </TableCell>

                <TableCell
                  className={`text-center border-r-2 w-20 ${getTimesheetCellStyle(
                    diff.field,
                    "checkout",
                    diff.valueCheckoutTimesheet,
                    diff.valueCheckoutIhcs
                  )}`}
                >
                  {diff.valueCheckoutTimesheet || "-"}
                </TableCell>

                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                  <div>{diff.field.replace(/_/g, " ")}</div>
                  {diff.note && (
                    <div className="text-xs text-gray-500 mt-1">
                      {diff.note}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, diffs.length)} of{" "}
            {diffs.length} entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) =>
                page === -1 ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageClick(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
