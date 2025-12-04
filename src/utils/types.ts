export interface Attendance {
    checkin: string | null;
    checkout: string | null;
}

export interface DiffItem {
    date: string;
    type: string;
    field: string;
    valueCheckinIhcs: string | null;
    valueCheckinTimesheet: string | null;
    valueCheckoutIhcs: string | null;
    valueCheckoutTimesheet: string | null;
    note?: string;
}

export interface Summary {
    employeeId?: string;
    employeeName?: string;
    note?: string;
    totalRowsIhcs: number;
    totalRowsTimesheet: number;
    totalMatched: number;
    totalDifferences: number;
    totalMissingInIhcs: number;
    totalMissingInTimesheet: number;
}

export interface CompareResponse {
    summary: Summary;
    differences: DiffItem[];
}
