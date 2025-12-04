"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { parsePdf, parseIHcsPdf, ParsedTimesheetRow } from "@/utils/parsePdf";

interface FileUploadProps {
  onSubmit: (
    fileA: File,
    fileB: File,
    onProgress: (percent: number) => void,
    parsedDataA?: ParsedTimesheetRow[],
    parsedDataB?: ParsedTimesheetRow[],
    employeeId?: string,
    employeeName?: string
  ) => Promise<void>;
}

export default function FileUpload({ onSubmit }: FileUploadProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragA, setDragA] = useState(false);
  const [dragB, setDragB] = useState(false);
  const [parsePdfEnabled, setParsePdfEnabled] = useState(true);
  const [vendor, setVendor] = useState<string>("auto");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedDataA, setParsedDataA] = useState<ParsedTimesheetRow[] | null>(
    null
  );
  const [parsedDataB, setParsedDataB] = useState<ParsedTimesheetRow[] | null>(
    null
  );
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  const handleFileAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileA(f);
      setParsedDataA(null);

      if (f.name.toLowerCase().endsWith(".pdf")) {
        if (parsePdfEnabled) {
          // parse in background
          parsePdfFile(f, "A");
        } else {
          console.log(
            "ℹ️ PDF file selected for A but parsing is disabled. Enable to parse."
          );
        }
      }
    }
  };

  const parsePdfFile = async (file: File, which: "A" | "B") => {
    console.log("🔍 Starting PDF parsing for:", file.name, which);
    console.log("   parsePdfEnabled:", parsePdfEnabled);
    setIsParsing(true);
    // Helper to sanitize parsed times into HH:MM for preview
    const sanitizeTimeForPreview = (t: string | null) => {
      if (!t) return null;
      const m = t.toString().match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/);
      if (!m) return null;
      const token = m[1].replace(".", ":");
      const parts = token.split(":");
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${hh}:${mm}`;
    };

    try {
      if (which === "A") {
        // IHCS: extract employee metadata and also parse attendance rows (parsedDataA)
        const meta = await parseIHcsPdf(file);
        setEmployeeId(meta.employeeId);
        setEmployeeName(meta.employeeName);
        console.log(
          `✅ IHCS metadata parsed: employeeId=${meta.employeeId} employeeName=${meta.employeeName}`
        );

        // Also attempt to parse timesheet-like rows from IHCS PDF (some IHCS have attendance rows)
        try {
          const parsedRows = await parsePdf(file, {
            vendor: vendor === "auto" ? undefined : vendor,
          });
          if (parsedRows && parsedRows.length > 0) {
            // Sanitize times for preview (show HH:MM)
            const sanitized = parsedRows.map((r) => ({
              date: r.date,
              checkin: sanitizeTimeForPreview(r.checkin),
              checkout: sanitizeTimeForPreview(r.checkout),
            }));
            setParsedDataA(sanitized);
            console.log(`✅ IHCS rows parsed: ${parsedRows.length} rows`);
            console.log(
              "📊 IHCS parsed rows (first 3):",
              JSON.stringify(sanitized.slice(0, 3), null, 2)
            );
          } else {
            // keep existing parsedDataA as null if nothing found
            console.log("ℹ️ IHCS parsed but no attendance rows found in fileA");
            setParsedDataA(null);
          }
        } catch (err) {
          console.error("❌ Failed to parse IHCS rows:", err);
          setParsedDataA(null);
        }
      } else {
        const parsed = await parsePdf(file, {
          vendor: vendor === "auto" ? undefined : vendor,
        });
        // Sanitize times for preview (show HH:MM) for timesheet
        const sanitized = parsed.map((r) => ({
          date: r.date,
          checkin: sanitizeTimeForPreview(r.checkin),
          checkout: sanitizeTimeForPreview(r.checkout),
        }));
        setParsedDataB(sanitized);
        console.log(
          `✅ PDF parsed successfully (${which})! Rows:`,
          parsed.length
        );
        console.log(
          "📊 Parsed data (first 3):",
          JSON.stringify(sanitized.slice(0, 3), null, 2)
        );
      }
    } catch (err) {
      console.error("❌ Failed to parse PDF:", err);
      alert("Failed to parse PDF. The file will be uploaded as-is.");
      if (which === "A") {
        setEmployeeId(null);
        setEmployeeName(null);
        setParsedDataA(null);
      } else setParsedDataB(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileBChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileB(file);
      setParsedDataB(null);

      // Auto-parse if enabled and file is PDF
      if (file.name.toLowerCase().endsWith(".pdf")) {
        if (parsePdfEnabled) {
          await parsePdfFile(file, "B");
        } else {
          console.log(
            "ℹ️ PDF file selected but parsing is disabled. Check the checkbox to enable parsing."
          );
        }
      } else {
        console.log("ℹ️ Non-PDF file selected:", file.name);
      }
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    which: "A" | "B"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const f = files[0];
      if (which === "A") {
        setFileA(f);
        setParsedDataA(null);
        if (f.name.toLowerCase().endsWith(".pdf")) {
          if (parsePdfEnabled) {
            await parsePdfFile(f, "A");
          } else {
            console.log(
              "ℹ️ PDF file dropped for A but parsing is disabled. Check the checkbox to enable parsing."
            );
          }
        } else {
          console.log("ℹ️ Non-PDF file dropped for A:", f.name);
        }
      } else {
        const file = f;
        setFileB(file);
        setParsedDataB(null);

        // Auto-parse if enabled and file is PDF
        if (file.name.toLowerCase().endsWith(".pdf")) {
          if (parsePdfEnabled) {
            await parsePdfFile(file, "B");
          } else {
            console.log(
              "ℹ️ PDF file dropped but parsing is disabled. Check the checkbox to enable parsing."
            );
          }
        } else {
          console.log("ℹ️ Non-PDF file dropped:", file.name);
        }
      }
    }
    if (which === "A") setDragA(false);
    else setDragB(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (which: "A" | "B") => {
    if (which === "A") setDragA(true);
    else setDragB(true);
  };

  const handleDragLeave = (which: "A" | "B") => {
    if (which === "A") setDragA(false);
    else setDragB(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileA || !fileB) {
      alert("Please select both files");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    try {
      await onSubmit(
        fileA,
        fileB,
        (p: number) => setProgress(p),
        parsedDataA || undefined,
        parsedDataB || undefined,
        employeeId || undefined,
        employeeName || undefined
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Attendance Files</CardTitle>
        <CardDescription>
          Upload IHCS and Timesheet to compare. Supported formats: CSV, XLSX,
          PDF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fileA" className="text-base">
              IHCS
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="fileA"
                accept=".csv,.xlsx,.pdf"
                onChange={handleFileAChange}
                className="hidden"
              />
              <div
                onDrop={(e) => handleDrop(e, "A")}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter("A")}
                onDragLeave={() => handleDragLeave("A")}
                onClick={() => document.getElementById("fileA")?.click()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${
                  dragA ? "bg-gray-50 border-primary" : ""
                }`}
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  {fileA ? fileA.name : "Drag & drop or click to choose file"}
                </span>
              </div>
            </div>
          </div>

          {employeeId || employeeName ? (
            <div className="text-sm text-gray-700">
              <div>
                <strong>Employee ID:</strong> {employeeId || "N/A"}
              </div>
              <div>
                <strong>Employee Name:</strong> {employeeName || "N/A"}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="fileB" className="text-base">
              Timesheet
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="fileB"
                accept=".csv,.xlsx,.pdf"
                onChange={handleFileBChange}
                className="hidden"
              />
              <div
                onDrop={(e) => handleDrop(e, "B")}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter("B")}
                onDragLeave={() => handleDragLeave("B")}
                onClick={() => document.getElementById("fileB")?.click()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${
                  dragB ? "bg-gray-50 border-primary" : ""
                }`}
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  {fileB ? fileB.name : "Drag & drop or click to choose file"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="vendor" className="text-sm">
                Vendor
              </Label>
              <select
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="text-sm p-1 border rounded"
              >
                <option value="auto">Auto-detect</option>
                <option value="mii">MII</option>
                <option value="indocyber">Indocyber</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="parsePdf"
                checked={parsePdfEnabled}
                onChange={async (e) => {
                  const isEnabled = e.target.checked;
                  console.log(
                    "📌 PDF parsing toggle:",
                    isEnabled ? "ENABLED" : "DISABLED"
                  );
                  setParsePdfEnabled(isEnabled);

                  // If enabled and PDF files are already selected, parse them immediately
                  if (isEnabled) {
                    console.log(
                      "🔄 Re-parsing existing PDF files if present..."
                    );
                    if (fileA && fileA.name.toLowerCase().endsWith(".pdf")) {
                      await parsePdfFile(fileA, "A");
                    }
                    if (fileB && fileB.name.toLowerCase().endsWith(".pdf")) {
                      await parsePdfFile(fileB, "B");
                    }
                  } else {
                    console.log("🗑️ Clearing parsed data");
                    setParsedDataA(null);
                    setParsedDataB(null);
                  }
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="parsePdf" className="text-sm cursor-pointer">
                Parse PDF timesheet on frontend (extract text data)
              </Label>
            </div>
          </div>

          {isParsing && (
            <div className="text-sm text-blue-600 font-semibold animate-pulse">
              🔄 Parsing PDF...
            </div>
          )}

          {parsedDataA && parsedDataA.length > 0 && (
            <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-semibold text-green-700">
                ✅ IHCS PDF Parsed Successfully: {parsedDataA.length} rows
                {fileA ? ` — ${fileA.name}` : ""}
              </div>
              <div className="text-xs text-green-600 font-medium">
                Preview (first 3 rows):
              </div>
              <div className="text-xs font-mono text-gray-700 space-y-1">
                {parsedDataA.slice(0, 3).map((row, i) => (
                  <div key={i} className="bg-white p-1 rounded">
                    📅 {row.date} | 🕐 In: {row.checkin || "N/A"} | 🕑 Out:{" "}
                    {row.checkout || "N/A"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedDataB && parsedDataB.length > 0 && (
            <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-semibold text-green-700">
                ✅ Timesheet PDF Parsed Successfully: {parsedDataB.length} rows
                {fileB ? ` — ${fileB.name}` : ""}
              </div>
              <div className="text-xs text-green-600 font-medium">
                Preview (first 3 rows):
              </div>
              <div className="text-xs font-mono text-gray-700 space-y-1">
                {parsedDataB.slice(0, 3).map((row, i) => (
                  <div key={i} className="bg-white p-1 rounded">
                    📅 {row.date} | 🕐 In: {row.checkin || "N/A"} | 🕑 Out:{" "}
                    {row.checkout || "N/A"}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!fileA || !fileB || isLoading || isParsing}
          >
            {isLoading ? "Uploading..." : "Compare Files"}
          </Button>

          {isLoading && (
            <div className="w-full mt-3">
              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-2 bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-600 mt-1">
                {progress}%
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
