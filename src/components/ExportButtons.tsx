"use client";

import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/utils/exportExcel";
import { exportToCsv } from "@/utils/exportCsv";
import { DiffItem, Summary } from "@/utils/types";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonsProps {
  diffs: DiffItem[];
  summary?: Summary;
}

export default function ExportButtons({ diffs, summary }: ExportButtonsProps) {
  const handleExportCsv = () => {
    exportToCsv(diffs, summary);
  };

  const handleExportExcel = () => {
    exportToExcel(diffs, summary);
  };

  return (
    <div className="flex gap-3 justify-end">
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
