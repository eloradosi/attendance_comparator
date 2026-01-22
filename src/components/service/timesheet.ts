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
        ket?: string | null;
    }[];
}

export interface TimesheetExcelResponse {
    vendor: string;
    period: string;
    excelFile: Blob;
}

export interface UploadAttendanceParams {
    employeeId: string;
    employeeName: string;
    vendor: string;
    period: string;
    ihcsData: {
        date: string;
        checkin: string | null;
        checkout: string | null;
        ket: string | null;
    }[];
}

export interface UploadAttendanceResponse {
    success: boolean;
    message: string;
    data: {
        employeeId: string;
        employeeName: string;
        period: string;
        totalRecords: number;
        tkRecords: number;
        uploadedAt: string;
    };
}

export interface TKAttendanceData {
    date: string;
    checkin: string | null;
    checkout: string | null;
    totalWorkingHour: string | null;
    ket: string;
}

export interface TKEmployeeRecord {
    id: string;
    employeeName: string;
    employeeId: string;
    period: string;
    ihcsData: TKAttendanceData[];
}

export interface GetTKRecordsResponse {
    data: TKEmployeeRecord[];
}

export interface AdjustTKStatusParams {
    id: string;
    ihcsData: {
        date: string;
        ket: string;
    }[];
}

export interface AdjustTKStatusResponse {
    success: boolean;
    message: string;
}

/**
 * Adjust TK status for an employee
 * @param params - employee id and adjusted attendance data
 * @returns Update result
 */
export async function adjustTKStatus(
    params: AdjustTKStatusParams
): Promise<AdjustTKStatusResponse> {
    const apiUrl = await getApiUrl();
    const baseUrl = apiUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/attendance/tk/update`;

    console.log("🌐 API URL:", url);
    console.log("📤 Adjust payload:", JSON.stringify(params, null, 2));

    const response = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(params),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to adjust TK status: ${response.statusText}`);
    }

    // Backend returns plain text
    const textResult = await response.text();
    console.log("✅ Adjust response:", textResult);

    return {
        success: true,
        message: textResult,
    };
}

/**
 * Fetch all TK (Tidak Kehadiran) records from backend
 * @returns List of TK records grouped by employee
 */
export async function getTKRecords(): Promise<GetTKRecordsResponse> {
    const apiUrl = await getApiUrl();
    const baseUrl = apiUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/attendance/tk`;

    console.log("🌐 API URL:", url);

    const response = await apiFetch(url, {
        method: "GET",
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message || `Failed to fetch TK records: ${response.statusText}`
        );
    }

    const result = await response.json();
    console.log("✅ TK records fetched:", result);

    return result;
}

/**
 * Upload attendance data to system for adjustment
 * @param params - employee info and attendance data
 * @returns Upload result with statistics
 */
export async function uploadAttendance(
    params: UploadAttendanceParams
): Promise<UploadAttendanceResponse> {
    const apiUrl = await getApiUrl();
    const baseUrl = apiUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/attendance/upload`;

    console.log("🌐 API URL:", url);
    console.log("📤 Upload payload:", JSON.stringify(params, null, 2));

    const response = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify(params),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to upload attendance data: ${response.statusText}`);
    }

    // Backend returns plain text "Attendance added successfully"
    const textResult = await response.text();
    console.log("✅ Upload response:", textResult);

    // Create response object from text
    const result: UploadAttendanceResponse = {
        success: true,
        message: textResult,
        data: {
            employeeId: params.employeeId,
            employeeName: params.employeeName,
            period: params.period,
            totalRecords: params.ihcsData.length,
            tkRecords: params.ihcsData.filter(d => d.ket === "TK").length,
            uploadedAt: new Date().toISOString(),
        },
    };

    return result;

    return result;
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
