/**
 * Timesheet Preview Service
 * 
 * Handles API calls for timesheet preview functionality.
 */

import apiFetch from "@/lib/api";
import { getApiUrl } from "@/lib/runtimeConfig";

export interface TimesheetPreviewParams {
    vendor: string;
    period: string;
    employeeId?: string;
    employeeName?: string;
    ihcsData: {
        date: string;
        checkin: string | null;
        checkout: string | null;
        totalWorkingHour: string | null;
    }[];
}

export interface TimesheetExcelResponse {
    vendor: string;
    period: string;
    excelFile: Blob;
}

/**
 * Call backend API to generate filled Excel timesheet
 * @param params - vendor, period, and IHCS data
 * @returns Excel file as Blob with metadata
 */
export async function timesheetExcel(
    params: TimesheetPreviewParams
): Promise<TimesheetExcelResponse> {
    const apiUrl = await getApiUrl();
    const baseUrl = apiUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/logbook/export`;

    console.log("🌐 API URL:", url);
    console.log("📤 Request payload:", JSON.stringify(params, null, 2));

    const response = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(params),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message || `Failed to generate Excel: ${response.statusText}`
        );
    }

    const blob = await response.blob();
    console.log("📥 Excel file size:", blob.size, "bytes");

    return {
        vendor: params.vendor,
        period: params.period,
        excelFile: blob,
    };
}
