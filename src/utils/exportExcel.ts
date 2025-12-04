import * as XLSX from 'xlsx';
import { DiffItem, Summary } from './types';

export function exportToExcel(diffs: DiffItem[], summary?: Summary) {
    // Prepare data for Excel
    const data = diffs.map((diff) => ({
        Date: diff.date,
        'IHCS Check-in': diff.valueCheckinIhcs || '-',
        'Timesheet Check-in': diff.valueCheckinTimesheet || '-',
        'IHCS Check-out': diff.valueCheckoutIhcs || '-',
        'Timesheet Check-out': diff.valueCheckoutTimesheet || '-',
        Status: diff.field.replace(/_/g, ' '),
        Note: diff.note || ''
    }));

    const workbook = XLSX.utils.book_new();

    // Create an empty worksheet
    const worksheet: XLSX.WorkSheet = {} as XLSX.WorkSheet;

    // Add employee meta at the top if present
    const meta: Array<Array<string>> = [];
    if (summary?.employeeName) meta.push(["Employee Name", summary.employeeName]);
    if (summary?.employeeId) meta.push(["Employee ID", summary.employeeId]);
    if (summary?.note) meta.push(["Note", summary.note]);
    if (meta.length) meta.push([""]); // blank row

    if (meta.length) {
        XLSX.utils.sheet_add_aoa(worksheet, meta, { origin: 'A1' });
    }

    // Add the data starting at row after meta (row 4 if meta present otherwise row 1)
    const origin = meta.length ? 'A4' : 'A1';
    XLSX.utils.sheet_add_json(worksheet, data, { origin, skipHeader: false });

    // Set column widths
    const columnWidths = [
        { wch: 15 }, // Date
        { wch: 12 }, // IHCS Check-in
        { wch: 16 }, // Timesheet Check-in
        { wch: 12 }, // IHCS Check-out
        { wch: 16 }, // Timesheet Check-out
        { wch: 20 }, // Status
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparison');
    // Export file
    XLSX.writeFile(workbook, `comparison-result.xlsx`);
}
