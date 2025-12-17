import apiFetch from "@/lib/api";

export interface CompareFilesParams {
  fileA: File;
  fileB: File;
  onProgress?: (percent: number) => void;
  ihcs?: any;
  timesheet?: any;
  employeeId?: string;
  employeeName?: string;
}

/**
 * Sanitize time format to HH:mm
 */
function sanitizeTime(t: string | null): string | null {
  if (!t) return null;
  const m = t.toString().match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/);
  if (!m) return null;
  const token = m[1].replace(".", ":");
  const parts = token.split(":");
  const hh = parts[0].padStart(2, "0");
  const mm = parts[1].padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Compare attendance files (IHCS vs Timesheet)
 */
export async function compareFiles(params: CompareFilesParams): Promise<any> {
  const {
    fileA,
    fileB,
    onProgress,
    ihcs,
    timesheet,
    employeeId,
    employeeName,
  } = params;

  // Trigger global loading
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("app:loading:start", {
        detail: { message: "Comparing attendance files..." },
      })
    );
  }

  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    const url = `${baseUrl}/api/attendance/compare`;

    // Save timesheet PDF for watermarking later
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

    let dataResp: any;

    if ((ihcs && ihcs.length > 0) || (timesheet && timesheet.length > 0)) {
      // Use parsed data
      const payload: any = {};

      if (ihcs && ihcs.length > 0) {
        payload.ihcs = ihcs.map((r: any) => ({
          date: r.date,
          checkin: sanitizeTime(r.checkin),
          checkout: sanitizeTime(r.checkout),
        }));
      }

      if (timesheet && timesheet.length > 0) {
        const lastSeen: Map<string, { row: any; idx: number }> = new Map();
        for (let i = 0; i < timesheet.length; i++) {
          const r = timesheet[i];
          if (!r || !r.date) continue;
          lastSeen.set(r.date, { row: r, idx: i });
        }
        const sorted = Array.from(lastSeen.values()).sort((a, b) => a.idx - b.idx);
        const deduped = sorted.map(({ row }) => ({
          date: row.date,
          checkin: sanitizeTime(row.checkin),
          checkout: sanitizeTime(row.checkout),
        }));
        payload.timesheet = deduped;

        try {
          sessionStorage.setItem("originalTimesheet", JSON.stringify(deduped));
        } catch (err) {
          console.warn(
            "Failed to persist originalTimesheet to sessionStorage",
            err
          );
        }
      }

      if (employeeId) payload.employeeId = employeeId;
      if (employeeName) payload.employeeName = employeeName;

      const response = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Backend returned ${response.status}. ${response.status === 500
            ? "Server error - check backend logs or try uploading raw files (uncheck PDF parse option)."
            : errorText
          }`
        );
      }

      dataResp = await response.json();
      if (onProgress) onProgress(100);
    } else {
      // Upload raw files via FormData with progress tracking
      const formData = new FormData();
      formData.append("fileIHCS", fileA);
      formData.append("fileTimesheet", fileB);

      dataResp = await new Promise<any>((resolve, reject) => {
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

    // Stop global loading
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:loading:stop"));
    }

    return dataResp;
  } catch (error) {
    // Stop loading on error
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:loading:stop"));
    }
    throw error;
  }
}
