/**
 * Service Layer Index
 * 
 * Centralized exports for all service modules.
 * Import services from this file for convenience.
 * 
 * Example:
 * import { fetchActivities, compareFiles } from '@/components/service';
 */

// Dashboard Service
export {
    fetchActivities,
    type ActivityRow as DashboardActivityRow,
    type FetchActivitiesParams,
} from './dashboard';

// All Activities Service
export {
    fetchAllActivities,
    type ActivityRow as AllActivitiesRow,
    type FetchAllActivitiesParams,
} from './all-activities';

// Compare Service
export {
    compareFiles,
    type CompareFilesParams,
} from './compare';

// Activity Service
export {
    fetchMyActivities,
    saveActivity,
    deleteActivity,
    todayISO,
    type ActivityLog,
    type FetchMyActivitiesParams,
} from './activity';

// Timesheet Service
export {
    timesheetExcel,
    uploadAttendance,
    getTKRecords,
    adjustTKStatus,
    type TimesheetPreviewParams,
    type TimesheetExcelResponse,
    type UploadAttendanceParams,
    type UploadAttendanceResponse,
    type TKEmployeeRecord,
    type TKAttendanceData,
    type GetTKRecordsResponse,
    type AdjustTKStatusParams,
    type AdjustTKStatusResponse,
} from './timesheet';
