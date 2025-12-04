import Papa from 'papaparse';
import { DiffItem, Summary } from './types';

export function exportToCsv(diffs: DiffItem[], summary?: Summary) {
    // Prepare data for CSV
    const data = diffs.map((diff) => ({
        Date: diff.date,
        'IHCS Check-in': diff.valueCheckinIhcs || '-',
        'Timesheet Check-in': diff.valueCheckinTimesheet || '-',
        'IHCS Check-out': diff.valueCheckoutIhcs || '-',
        'Timesheet Check-out': diff.valueCheckoutTimesheet || '-',
        Status: diff.field.replace(/_/g, ' '),
        Note: diff.note || ''
    }));

    // Convert to CSV
    const csvBody = Papa.unparse(data);

    // Prepend employee meta if available
    let csv = '';
    if (summary?.employeeName || summary?.employeeId) {
        csv += `Employee Name,${summary.employeeName || ''}\n`;
        csv += `Employee ID,${summary.employeeId || ''}\n\n`;
    }
    csv += csvBody;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `comparison-result.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
