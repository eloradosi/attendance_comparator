"use client";

import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import GoogleAuth from "@/components/GoogleAuth";
import { ParsedTimesheetRow } from "@/utils/parsePdf";

export default function Home() {
  const router = useRouter();

  const handleSubmit = async (
    fileA: File,
    fileB: File,
    onProgress?: (percent: number) => void,
    ihcs?: ParsedTimesheetRow[],
    timesheet?: ParsedTimesheetRow[],
    employeeId?: string,
    employeeName?: string
  ) => {
    // Ensure we don't accidentally produce a double-slash when NEXT_PUBLIC_API_URL has a trailing slash
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    const url = `${baseUrl}/api/attendance/compare`;

    console.log("📤 Uploading to:", url);

    try {
      let data: any;

      // Save timesheet PDF file to sessionStorage for watermarking later
      if (fileB && fileB.type === "application/pdf") {
        try {
          const arrayBuffer = await fileB.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          sessionStorage.setItem("originalTimesheetPdf", base64);
          sessionStorage.setItem("originalTimesheetFilename", fileB.name);
        } catch (err) {
          console.warn("Failed to save original timesheet PDF", err);
        }
      }

      if ((ihcs && ihcs.length > 0) || (timesheet && timesheet.length > 0)) {
        // Send parsed JSON data (either IHCS / Timesheet or both)
        console.log("📤 Sending parsed JSON data for parsed files");
        console.log("📊 Data preview:", {
          ihcs: ihcs ? ihcs.slice(0, 3) : undefined,
          timesheet: timesheet ? timesheet.slice(0, 3) : undefined,
        });
        const payload: any = {};

        // Shared sanitizer: extract HH:MM (drop seconds), remove surrounding chars like parentheses
        const sanitizeTime = (t: string | null) => {
          if (!t) return null;
          // Find first time-like token (HH:MM or HH.MM or HH:MM:SS)
          const m = t.toString().match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/);
          if (!m) return null;
          const token = m[1].replace(".", ":");
          const parts = token.split(":");
          const hh = parts[0].padStart(2, "0");
          const mm = parts[1].padStart(2, "0");
          return `${hh}:${mm}`;
        };

        if (ihcs && ihcs.length > 0) {
          payload.ihcs = ihcs.map((r: any) => ({
            date: r.date,
            checkin: sanitizeTime(r.checkin),
            checkout: sanitizeTime(r.checkout),
          }));
        }

        if (timesheet && timesheet.length > 0) {
          // Deduplicate timesheet rows by date, keeping the LAST occurrence
          // Build a map of last-seen index for each date so we can preserve
          // the order of the last occurrences.
          const lastSeen: Map<string, { row: any; idx: number }> = new Map();
          for (let i = 0; i < timesheet.length; i++) {
            const r = timesheet[i];
            if (!r || !r.date) continue;
            lastSeen.set(r.date, { row: r, idx: i });
          }

          // Extract values sorted by their last-seen index to produce
          // a deterministic order where the last occurrence is kept.
          const sorted = Array.from(lastSeen.values()).sort(
            (a, b) => a.idx - b.idx
          );
          const deduped = sorted.map(({ row }) => ({
            date: row.date,
            checkin: sanitizeTime(row.checkin),
            checkout: sanitizeTime(row.checkout),
          }));
          payload.timesheet = deduped;
          // Save the deduped timesheet into sessionStorage so compare page
          // can access the original timesheet for PDF export (client-side)
          try {
            sessionStorage.setItem(
              "originalTimesheet",
              JSON.stringify(deduped)
            );
          } catch (err) {
            console.warn(
              "Failed to persist originalTimesheet to sessionStorage",
              err
            );
          }
        }
        if (employeeId) payload.employeeId = employeeId;
        if (employeeName) payload.employeeName = employeeName;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error response:", errorText);
          throw new Error(
            `Backend returned ${response.status}. ${
              response.status === 500
                ? "Server error - check backend logs or try uploading raw files (uncheck PDF parse option)."
                : errorText
            }`
          );
        }
        data = await response.json();
        console.log("✅ Backend response:", data);
        if (onProgress) onProgress(100);
      } else {
        // Send raw files via FormData
        console.log("📤 Sending raw files (no parsed data)");
        const formData = new FormData();
        formData.append("fileIHCS", fileA);
        formData.append("fileTimesheet", fileB);

        data = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText || "null");
                resolve(json);
              } catch (err) {
                reject(new Error("Invalid JSON response"));
              }
            } else {
              const errorMsg =
                xhr.status === 500
                  ? "Backend server error (500). Check backend logs or try uploading raw files."
                  : `Upload failed with status ${xhr.status}`;
              reject(new Error(errorMsg));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));

          xhr.send(formData);
        });
      }

      // Store data in sessionStorage to pass to compare page
      sessionStorage.setItem("comparisonResult", JSON.stringify(data));

      // Redirect to compare page
      router.push("/compare");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to compare files. Please try again.");
      if (onProgress) onProgress(0);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Attendance Comparator
            </h1>
            <p className="text-gray-600">
              Compare two attendance files and view the differences
            </p>
          </div>
          <div className="ml-4">
            <GoogleAuth />
          </div>
        </div>

        <FileUpload onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
