import axios from "axios";
import { getAppToken } from "@/lib/api";
import { getApiUrl } from "@/lib/runtimeConfig";
import { DateRange } from "react-day-picker";

export type ActivityRow = {
  uid?: string;
  id: string;
  date: string;
  status: string;
  title?: string;
  detail?: string;
  percentStart?: number;
  percentEnd?: number;
  reason?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt?: string;
};

export interface FetchActivitiesParams {
  dateRange?: DateRange;
  cancelToken?: any;
  page?: number;
  size?: number;
  status?: string;
  userName?: string;
}

export interface FetchActivitiesResponse {
  data: ActivityRow[];
  totalData: number;
  page: number;
  size: number;
}

/**
 * Fetch activities from backend API with optional date range filter and pagination
 */
export async function fetchActivities(
  params: FetchActivitiesParams = {}
): Promise<FetchActivitiesResponse> {
  const { dateRange, cancelToken, page = 0, size = 10, status, userName } = params;

  const backend = await getApiUrl();
  const queryParams = new URLSearchParams();
  queryParams.append("sortBy", "date");
  queryParams.append("sortDir", "desc");
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());

  if (status && status !== "all") {
    queryParams.append("status", status);
  }

  if (userName && userName !== "all") {
    queryParams.append("userName", userName);
  }

  if (dateRange?.from) {
    const start = dateRange.from;
    const formattedStart = `${start.getFullYear()}-${String(
      start.getMonth() + 1
    ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    queryParams.append("startDate", formattedStart);
  }

  if (dateRange?.to) {
    const end = dateRange.to;
    const formattedEnd = `${end.getFullYear()}-${String(
      end.getMonth() + 1
    ).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    queryParams.append("endDate", formattedEnd);
  }

  const url = backend
    ? `${backend.replace(/\/$/, "")}/api/dashboard/logbooklist?${queryParams.toString()}`
    : `/api/dashboard/logbooklist?${queryParams.toString()}`;

  const token = getAppToken();
  const resp = await axios.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cancelToken,
  });

  const items = (resp.data.data || []) as any[];
  const mapped: ActivityRow[] = items.map((it) => ({
    id: it.id,
    date: it.date,
    status: it.status,
    title: it.title,
    detail: it.detail,
    userName: it.userName,
    userEmail: it.userEmail,
    createdAt: it.createdAt,
    percentStart: it.percentStart,
    percentEnd: it.percentEnd,
    reason: it.reason,
    updatedAt: it.updatedAt,
  }));

  return {
    data: mapped,
    totalData: resp.data.totalData || 0,
    page: resp.data.page || 0,
    size: resp.data.size || size,
  };
}
