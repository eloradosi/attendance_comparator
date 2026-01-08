import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import presets from "@/config/vendor-presets";

// Configure worker path for pdfjs
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

type TextItem = {
    str: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
};

type Cell = { text: string; x: number; y: number };

export interface ParsedTimesheetRow {
    date: string;
    checkin: string | null;
    checkout: string | null;
}

/**
 * Extract text items with position from PDF
 */
export async function extractTextItems(file: File): Promise<TextItem[][]> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pagesItems: TextItem[][] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items: TextItem[] = content.items.map((it: any) => {
            const transform = it.transform;
            const x = transform[4];
            const y = transform[5];
            return { str: it.str, x, y, width: it.width, height: it.height };
        });
        pagesItems.push(items);
    }
    return pagesItems;
}

/**
 * Group text items into rows based on Y coordinate
 */
export function itemsToRows(items: TextItem[], yTolerance = 4): Cell[][] {
    const lines: { y: number; cells: Cell[] }[] = [];

    for (const it of items) {
        if (!it.str.trim()) continue;
        const y = Math.round(it.y);
        let line = lines.find((l) => Math.abs(l.y - y) <= yTolerance);
        if (!line) {
            line = { y, cells: [] };
            lines.push(line);
        }
        line.cells.push({ text: it.str.trim(), x: it.x, y });
    }

    // Sort lines by Y (descending - top to bottom)
    lines.sort((a, b) => b.y - a.y);

    // Sort cells in each line by X (left to right)
    return lines.map((l) => l.cells.sort((a, b) => a.x - b.x));
}

/**
 * Parse timesheet PDF and extract date, checkin, checkout
 * 
 * METODE PARSING:
 * - Deteksi header row untuk mendapatkan posisi X kolom berdasarkan LABEL
 * - Gunakan posisi X tersebut untuk extract data dari row berikutnya
 * - Fallback ke regex pattern matching jika header tidak ditemukan
 */
type ParseInternalOpts = {
    dateLabels: string[];
    checkinLabels: string[];
    checkoutLabels: string[];
    yTolerance?: number;
    xTolerance?: number;
};

async function parsePdfInternal(
    file: File,
    opts: ParseInternalOpts
): Promise<ParsedTimesheetRow[]> {
    const pagesItems = await extractTextItems(file);
    const results: ParsedTimesheetRow[] = [];

    for (const pageItems of pagesItems) {
        // Use configurable Y grouping tolerance to handle PDFs with
        // varying text baseline positions (vendor-specific layouts).
        const yTolerance = typeof opts.yTolerance === "number" ? opts.yTolerance : 4;
        const rows = itemsToRows(pageItems, yTolerance);

        // Try to detect header row and column positions
        let dateColumnX: number | null = null;
        let checkinColumnX: number | null = null;
        let checkoutColumnX: number | null = null;

        // SETTING: Tolerance untuk matching posisi X (dalam pixel)
        const xTolerance = typeof opts.xTolerance === "number" ? opts.xTolerance : 20;

        // Detect header row berdasarkan LABEL
        // Strategy: Find a row with date/checkin/checkout labels, then verify
        // that subsequent rows contain actual date patterns (not just labels)
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowText = row.map((c) => c.text.toLowerCase()).join(" ");

            // Cek apakah baris ini header (mengandung salah satu label)
            const hasDateLabel = opts.dateLabels.some(label => rowText.includes(label));
            const hasCheckinLabel = opts.checkinLabels.some(label => rowText.includes(label));
            const hasCheckoutLabel = opts.checkoutLabels.some(label => rowText.includes(label));

            if (hasDateLabel) {
                // Found potential header — check if next few rows contain actual dates
                let foundActualDate = false;
                for (let j = i + 1; j < Math.min(i + 5, rows.length); j++) {
                    const nextRowText = rows[j].map(c => c.text).join(" ");
                    if (nextRowText.match(/\d{1,2}[-\/]\w{3}[-\/]\d{2,4}/) ||
                        nextRowText.match(/\d{1,2}\s+\w+\s+\d{4}/)) {
                        foundActualDate = true;
                        break;
                    }
                }

                if (foundActualDate) {
                    // This is a real header — extract column positions
                    for (const cell of row) {
                        const cellLower = cell.text.toLowerCase();

                        // Deteksi kolom DATE
                        if (opts.dateLabels.some(label => cellLower.includes(label))) {
                            dateColumnX = cell.x;
                        }

                        // Deteksi kolom CHECK IN (exclude 'Work Time' / duration columns)
                        if (opts.checkinLabels.some(label => cellLower.includes(label)) &&
                            !cellLower.includes("work time") &&
                            !cellLower.includes("durasi") &&
                            !cellLower.includes("total")) {
                            checkinColumnX = cell.x;
                        }

                        // Deteksi kolom CHECK OUT (exclude 'Work Time' / duration columns)
                        if (opts.checkoutLabels.some(label => cellLower.includes(label)) &&
                            !cellLower.includes("work time") &&
                            !cellLower.includes("durasi") &&
                            !cellLower.includes("total")) {
                            checkoutColumnX = cell.x;
                        }
                    }
                    break; // Stop after finding header
                }
            }
        }

        // Parse data rows
        for (const row of rows) {
            let dateStr: string | null = null;
            let checkinStr: string | null = null;
            let checkoutStr: string | null = null;

            // METHOD 1: Use column positions if detected
            if (dateColumnX !== null || checkinColumnX !== null || checkoutColumnX !== null) {
                for (const cell of row) {
                    const text = cell.text.trim();

                    // Date column - attempt to extract date possibly split across multiple nearby cells
                    if (dateColumnX !== null) {
                        // collect nearby cells (we'll assemble them to support split cells like: "27" + "November 2025")
                        const nearby = row
                            .filter(c => Math.abs(c.x - dateColumnX) <= (opts.xTolerance || 50))
                            .sort((a, b) => a.x - b.x)
                            .map(c => c.text.trim())
                            .filter(Boolean);

                        if (nearby.length > 0) {
                            let combined = nearby.join(" ");
                            const distance = Math.abs(cell.x - dateColumnX);

                            // Extract time tokens from combined date cell (e.g., "1-Nov-25 8:00")
                            const timeInCombined = combined.match(/(\d{1,2}[:.]\d{2}(?::\d{2})?)/);
                            if (timeInCombined && !checkinStr) {
                                checkinStr = timeInCombined[1];
                                // Remove time from combined to clean up date string
                                combined = combined.replace(timeInCombined[1], "").replace(/\s{2,}/g, " ").trim();
                            }

                            const isDatePatternShort = combined.match(/\d{1,2}-[A-Za-z]{3}-\d{2,4}/);
                            const isDatePatternLong = combined.match(/\d{1,2}\s+[A-Za-z]+\s+\d{4}/);
                            const isDateDayMonth = combined.match(/^[0-9]{1,2}(?:\s+[A-Za-z]+)?$/);

                            // Debug nearby content
                            if (distance <= (opts.xTolerance || 50) && combined.length > 0) {
                            }

                            if ((isDatePatternShort || isDatePatternLong) && Math.abs(cell.x - dateColumnX) <= xTolerance) {
                                dateStr = combined;
                            } else if (isDateDayMonth && Math.abs(cell.x - dateColumnX) <= xTolerance) {
                                // If we only got day or day+month without year, still accept and let normalizeDateString try to infer year
                                dateStr = combined;
                            }
                        }
                    }

                    // Check In column (skip if empty or clearly invalid)
                    if (checkinColumnX !== null && Math.abs(cell.x - checkinColumnX) <= xTolerance) {
                        if (text.match(/\d{1,2}[.:,]\d{2}/) && text.trim() !== "-" && text.trim().length > 0) {
                            checkinStr = text;
                        }
                    }

                    // Check Out column (skip if empty or clearly invalid)
                    if (checkoutColumnX !== null && Math.abs(cell.x - checkoutColumnX) <= xTolerance) {
                        if (text.match(/\d{1,2}[.:,]\d{2}/) && text.trim() !== "-" && text.trim().length > 0) {
                            checkoutStr = text;
                        }
                    }
                }

                // Fallback: if dateStr found but times missing AND no columns detected, scan for time patterns
                // Skip fallback if columns were detected (to avoid picking up Work Time/duration values)
                if (dateStr && (!checkinStr || !checkoutStr) &&
                    (checkinColumnX === null || checkoutColumnX === null)) {
                    const timeTokens: string[] = [];
                    for (const cell of row) {
                        const timeMatch = cell.text.match(/\d{1,2}[.:,]\d{2}/);
                        if (timeMatch) {
                            timeTokens.push(timeMatch[0]);
                        }
                    }
                    if (timeTokens.length >= 1 && !checkinStr && checkinColumnX === null) {
                        checkinStr = timeTokens[0];
                    }
                    if (timeTokens.length >= 2 && !checkoutStr && checkoutColumnX === null) {
                        checkoutStr = timeTokens[1];
                    }
                }
            } else {
                // METHOD 2: Fallback to pattern matching (old method)
                const rowText = row.map((c) => c.text).join(" ");
                // Broaden date matching to accept formats like:
                // - 1-Nov-25
                // - 1 Nov 2025
                // - 01/11/2025
                const dateMatch = rowText.match(/(\d{1,2}[-\s][A-Za-z]{3,}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/);
                const timeMatches = rowText.match(/(\d{1,2}[:.\,]\d{2}(?::\d{2})?)/g);

                if (dateMatch) {
                    dateStr = dateMatch[1];
                    checkinStr = timeMatches && timeMatches[0] ? timeMatches[0] : null;
                    checkoutStr = timeMatches && timeMatches[1] ? timeMatches[1] : null;
                }
            }

            // Add to results if date is found
            if (dateStr) {
                const normalized = normalizeDateString(dateStr);
                if (normalized) {
                    results.push({
                        date: normalized,
                        checkin: checkinStr ? normalizeTime(checkinStr) : null,
                        checkout: checkoutStr ? normalizeTime(checkoutStr) : null,
                    });
                }
            }
        }
    }

    return results;
}

export async function parsePdf(
    file: File,
    opts?: {
        vendor?: string;
        dateLabels?: string[];
        checkinLabels?: string[];
        checkoutLabels?: string[];
        yTolerance?: number;
        xTolerance?: number;
    }
): Promise<ParsedTimesheetRow[]> {
    const defaultDateLabels = ["date", "tanggal", "tgl"];
    const defaultCheckinLabels = ["jam check in", "check in", "checkin", "jam masuk"];
    const defaultCheckoutLabels = ["jam check out", "check out", "checkout", "jam keluar"];

    // If a vendor preset is provided, merge opts with preset values
    let dateLabels = opts?.dateLabels || defaultDateLabels;
    let checkinLabels = opts?.checkinLabels || defaultCheckinLabels;
    let checkoutLabels = opts?.checkoutLabels || defaultCheckoutLabels;
    let yTolerance = opts?.yTolerance;
    let xTolerance = opts?.xTolerance;

    if (opts?.vendor) {
        const p = presets[opts.vendor];
        if (p) {
            dateLabels = opts?.dateLabels || p.dateLabels || dateLabels;
            checkinLabels = opts?.checkinLabels || p.checkinLabels || checkinLabels;
            checkoutLabels = opts?.checkoutLabels || p.checkoutLabels || checkoutLabels;
            yTolerance = typeof opts?.yTolerance === 'number' ? opts.yTolerance : p.yTolerance;
            xTolerance = typeof opts?.xTolerance === 'number' ? opts.xTolerance : p.xTolerance;
        } else {
        }
    }

    return parsePdfInternal(file, { dateLabels, checkinLabels, checkoutLabels, yTolerance, xTolerance });
}

// Backwards compatible alias
export const parseTimesheetPdf = (file: File) => parsePdf(file);

/**
 * Parse IHCS PDF to extract employeeId and employeeName
 * Returns { employeeId, employeeName } or null values when not found
 */
export async function parseIHcsPdf(file: File): Promise<{ employeeId: string | null; employeeName: string | null }> {
    const pagesItems = await extractTextItems(file);

    // First pass: look for OM-prefixed IDs (highest priority for IHCS)
    for (const pageItems of pagesItems) {
        const rows = itemsToRows(pageItems, 4);
        for (const row of rows) {
            const rowText = row.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();

            // Look for OM followed by numbers (e.g., "OM2502511")
            const omMatch = rowText.match(/\b(OM\d{4,})\b/i);
            if (omMatch) {
                const id = omMatch[1];
                // Extract name: everything after the ID
                const afterId = rowText.substring(rowText.indexOf(omMatch[1]) + omMatch[1].length).trim();
                // Clean up name: remove common separators and labels
                const name = afterId.replace(/^[:\-\/\s]+/, '').replace(/\s+/g, ' ').trim() || null;
                return { employeeId: id, employeeName: name };
            }
        }
    }

    // Second pass: look for explicit NPP/Nama labels
    for (const pageItems of pagesItems) {
        const rows = itemsToRows(pageItems, 4);
        for (const row of rows) {
            const rowText = row.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
            const low = rowText.toLowerCase();

            if (low.includes('npp') || low.includes('nama') || low.includes('name')) {
                // Extract ID after NPP label, but skip if it's just "Nama" or "Name"
                let m = rowText.match(/npp\s*[:\-/]?\s*([A-Za-z0-9-_.]+)/i);
                if (m && m[1]) {
                    const candidate = m[1].trim();
                    // Skip if candidate is a label word
                    if (candidate.toLowerCase() === 'nama' || candidate.toLowerCase() === 'name') {
                        continue;
                    }
                    const id = candidate;
                    // try to find name in same row after id
                    const after = rowText.split(m[1])[1];
                    const name = after ? after.replace(/[:\-\/]/g, ' ').trim() : null;
                    return { employeeId: id, employeeName: name || null };
                }
            }
        }
    }

    // Third pass: fallback to any ID-like pattern
    for (const pageItems of pagesItems) {
        const rows = itemsToRows(pageItems, 6);
        for (const row of rows) {
            for (let i = 0; i < row.length; i++) {
                const t = row[i].text.trim();
                const idMatch = t.match(/^[A-Z]{1,3}\d{3,}$/i) || t.match(/\b\d{4,}\b/);
                if (idMatch) {
                    const id = idMatch[0];
                    const nameParts = row.slice(i + 1).map(c => c.text).filter(Boolean);
                    const name = nameParts.join(' ').trim() || null;
                    return { employeeId: id, employeeName: name };
                }
            }
        }
    }

    return { employeeId: null, employeeName: null };
}

/**
 * Normalize time string to HH:MM format
 * Handles: 08.13, 08:13, 08,13 -> 08:13
 */
function normalizeTime(timeStr: string): string {
    if (!timeStr) return timeStr;
    // Extract first time-like token (HH:MM or HH.MM or HH:MM:SS)
    // Accept colon, dot or comma as separators (e.g. 08:15, 08.15, 08,15)
    const m = timeStr.toString().match(/(\d{1,2})[:.,](\d{2})(?::\d{2})?/);
    if (m) {
        const hh = m[1].padStart(2, "0");
        const mm = m[2];
        return `${hh}:${mm}`;
    }
    // Fallback: if only hour present, assume :00
    const hOnly = timeStr.toString().match(/(\d{1,2})/);
    if (hOnly) {
        return `${hOnly[1].padStart(2, "0")}:00`;
    }
    // Last fallback: replace common separators
    return timeStr.replace(/[.,]/g, ":");
}

/**
 * Normalize date string from "3-Nov-25" to "2025-11-03"
 */
function normalizeDateString(dateStr: string): string | null {
    const s = dateStr.trim();

    // month map (keys lowercase) - include full names and short names
    const monthMap: Record<string, string> = {
        jan: "01", january: "01",
        feb: "02", february: "02",
        mar: "03", march: "03",
        apr: "04", april: "04",
        may: "05",
        jun: "06", june: "06",
        jul: "07", july: "07",
        aug: "08", august: "08",
        sep: "09", sept: "09",
        oct: "10", october: "10",
        nov: "11",
        dec: "12", december: "12",
        // Indonesian variants
        januari: "01", maret: "03", mei: "05", juni: "06", juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12",
        agst: "08", okt: "10", des: "12",

    };

    // 1) Try long form: '27 November 2025' (anywhere in the string)
    let m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (m) {
        const day = m[1].padStart(2, "0");
        const mon = m[2].toLowerCase();
        const year = m[3];
        const month = monthMap[mon] || null;
        if (month) return `${year}-${month}-${day}`;
    }

    // 2) Try hyphen short/long: '3-Nov-25' or '3-Nov-2025'
    m = s.match(/(\d{1,2})-([A-Za-z]{3,})-(\d{2,4})/);
    if (m) {
        const day = m[1].padStart(2, "0");
        const mon = m[2];
        const yearRaw = m[3];
        const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
        const month = monthMap[mon.toLowerCase()] || null;
        if (month) return `${year}-${month}-${day}`;
    }

    // 3) Try '27 Nov 2025' (space-separated short month)
    m = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4})/);
    if (m) {
        const day = m[1].padStart(2, "0");
        const mon = m[2].toLowerCase();
        const yearRaw = m[3];
        const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
        const month = monthMap[mon] || null;
        if (month) return `${year}-${month}-${day}`;
    }

    // 4) Try '27 November' or '27 Nov' (no year) -> assume current year
    m = s.match(/(\d{1,2})\s+([A-Za-z]+)/);
    if (m) {
        const day = m[1].padStart(2, "0");
        const mon = m[2].toLowerCase();
        const month = monthMap[mon] || null;
        if (month) {
            const year = new Date().getFullYear();
            return `${year}-${month}-${day}`;
        }
    }

    return null;
}
