"use client";

import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/utils/exportExcel";
import { exportToCsv } from "@/utils/exportCsv";
import { DiffItem, Summary } from "@/utils/types";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonsProps {
  diffs: DiffItem[];
  summary?: Summary;
  timesheetRows?: {
    date: string;
    checkin?: string | null;
    checkout?: string | null;
  }[];
}

export default function ExportButtons({
  diffs,
  summary,
  timesheetRows,
}: ExportButtonsProps) {
  // If the user uploaded a PDF timesheet we save it to sessionStorage
  // `exportTimesheetPdfWithWatermark` reads that PDF directly, so show
  // the Download button if either structured rows are present OR a
  // saved PDF exists in sessionStorage.
  const hasSavedPdf =
    typeof window !== "undefined" &&
    !!sessionStorage.getItem("originalTimesheetPdf");
  const handleExportCsv = () => {
    exportToCsv(diffs, summary);
  };

  const handleExportExcel = () => {
    exportToExcel(diffs, summary);
  };

  return (
    <div className="flex gap-3 justify-end">
      {summary &&
        summary.totalDifferences === 0 &&
        (timesheetRows || hasSavedPdf) && (
          <Button
            onClick={async () => {
              try {
                const mod = await import("@/utils/exportPdf");
                if (mod?.exportTimesheetPdfWithWatermark) {
                  await mod.exportTimesheetPdfWithWatermark(
                    // exporter reads stored PDF if provided; pass rows or an empty array
                    timesheetRows || [],
                    summary,
                    "PASSED",
                  );
                } else if (mod?.default) {
                  // support default export
                  await mod.default(timesheetRows || [], summary, "PASSED");
                } else {
                  alert(
                    "PDF export module did not export the expected function.",
                  );
                }
              } catch (err) {
                alert(
                  "PDF export is unavailable. To enable it, run: npm install jspdf jspdf-autotable",
                );
              }
            }}
            variant="outline"
            className="gap-2"
          >
            Download Timesheet PDF (Passed)
          </Button>
        )}
      <Button onClick={handleExportCsv} variant="outline" className="gap-2">
        <FileText className="w-4 h-4" />
        Export CSV
      </Button>
      <Button onClick={handleExportExcel} variant="outline" className="gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        Export Excel
      </Button>
    </div>
  );
}
