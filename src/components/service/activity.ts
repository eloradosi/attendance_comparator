import axios from "axios";
import { getAppToken } from "@/lib/api";

export interface ActivityLog {
  id: string;
  date: string;
  status: "on_duty" | "off_duty" | "idle";
  title?: string;
  detail?: string;
  percentStart?: number;
  percentEnd?: number;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchMyActivitiesParams {
  page?: number;
  size?: number;
  cancelToken?: any;
}

/**
 * Fetch my activity logs from backend API
 */
export async function fetchMyActivities(
  params: FetchMyActivitiesParams = {}
): Promise<ActivityLog[]> {
  const { page = 0, size = 100, cancelToken } = params;

  const backend = process.env.NEXT_PUBLIC_API_URL || "";
  const url = backend
    ? `${backend.replace(/\/$/, "")}/api/logbook/my?page=${page}&size=${size}`
    : `/api/logbook/my?page=${page}&size=${size}`;

  const token = getAppToken();
  const resp = await axios.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cancelToken,
  });

  const items = (resp.data.data || []) as any[];
  const mapped: ActivityLog[] = items.map((it) => ({
    id: it.id,
    date: it.date,
    status: it.status,
    title: it.title,
    detail: it.detail,
    percentStart: it.percentStart,
    percentEnd: it.percentEnd,
    reason: it.reason,
    createdAt: it.createdAt,
    updatedAt: it.updatedAt,
  }));

  return mapped;
}

/**
 * Save (add or update) activity log to backend API
 */
export async function saveActivity(log: ActivityLog): Promise<void> {
  const payload: any = {
    date: log.date,
    status: log.status,
  };

  // Include id for update operation
  if (log.id) {
    payload.id = log.id;
  }

  // Add status-specific fields
  if (log.status === "on_duty") {
    payload.title = log.title;
    payload.detail = log.detail;
    payload.percentStart = log.percentStart;
    payload.percentEnd = log.percentEnd;
  } else if (log.status === "off_duty") {
    payload.reason = log.reason;
  }
  // idle status only needs date and status

  const backend = process.env.NEXT_PUBLIC_API_URL || "";
  const url = backend
    ? `${backend.replace(/\/$/, "")}/api/logbook/save`
    : `/api/logbook/save`;

  const token = getAppToken();
  await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/**
 * Delete activity log from backend API
 */
export async function deleteActivity(id: string): Promise<void> {
  const backend = process.env.NEXT_PUBLIC_API_URL || "";
  const url = backend
    ? `${backend.replace(/\/$/, "")}/api/logbook/${id}`
    : `/api/logbook/${id}`;

  const token = getAppToken();
  await axios.delete(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Helper to get today's date in ISO format (YYYY-MM-DD)
 */
export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
