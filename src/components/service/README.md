# Service Layer Documentation

Service layer ini dibuat untuk memisahkan logic API calls dari komponen React, sehingga memudahkan maintenance dan testing.

## Struktur Service

Semua service file berada di folder `src/components/service/` dengan naming convention `[feature].ts`.

### Files

1. **dashboard.ts** - Service untuk halaman dashboard
2. **all-activities.ts** - Service untuk halaman all activities
3. **compare.ts** - Service untuk halaman attendance comparator
4. **activity.ts** - Service untuk activity logs (Activity List)

## Penggunaan

### 1. Dashboard Service

```typescript
import {
  fetchActivities,
  type ActivityRow,
} from "@/components/service/dashboard";

// Fetch activities dengan optional date range
const activities = await fetchActivities({
  dateRange: { from: startDate, to: endDate },
  cancelToken: source.token,
});
```

**Functions:**

- `fetchActivities(params)` - Fetch semua activities dari API dengan filter date range

### 2. All Activities Service

```typescript
import {
  fetchAllActivities,
  type ActivityRow,
} from "@/components/service/all-activities";

// Fetch all activities
const activities = await fetchAllActivities({
  dateRange: { from: startDate, to: endDate },
  cancelToken: source.token,
});
```

**Functions:**

- `fetchAllActivities(params)` - Fetch semua activities dari API dengan filter date range

### 3. Compare Service

```typescript
import { compareFiles } from "@/components/service/compare";

// Compare attendance files
const result = await compareFiles({
  fileA: ihcsFile,
  fileB: timesheetFile,
  onProgress: (percent) => console.log(percent),
  ihcs: parsedIhcsData,
  timesheet: parsedTimesheetData,
  employeeId: "12345",
  employeeName: "John Doe",
});
```

**Functions:**

- `compareFiles(params)` - Compare IHCS dan Timesheet files, support upload raw files atau parsed data

### 4. Activity Service

```typescript
import {
  fetchMyActivities,
  saveActivity,
  deleteActivity,
  todayISO,
  type ActivityLog,
} from "@/components/service/activity";

// Fetch my activities
const activities = await fetchMyActivities({
  page: 0,
  size: 100,
  cancelToken: source.token,
});

// Save (create or update) activity
await saveActivity({
  id: "123", // optional, jika ada berarti update
  date: "2025-12-16",
  status: "on_duty",
  title: "Development",
  detail: "Working on feature X",
  percentStart: 0,
  percentEnd: 50,
});

// Delete activity
await deleteActivity("activity-id");

// Get today's date in ISO format
const today = todayISO(); // "2025-12-16"
```

**Functions:**

- `fetchMyActivities(params)` - Fetch activity logs user yang sedang login
- `saveActivity(log)` - Save/update activity log
- `deleteActivity(id)` - Delete activity log
- `todayISO()` - Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD

## Best Practices

1. **Gunakan service layer untuk semua API calls** - Jangan langsung panggil axios/fetch dari komponen
2. **Export types dari service** - Semua types yang digunakan di service harus di-export
3. **Handle errors di komponen** - Service melempar error, komponen yang handle dengan try-catch
4. **Reusable functions** - Jika ada logic yang sama dipakai di banyak tempat, pindahkan ke service
5. **Cancel tokens** - Selalu gunakan cancel tokens untuk menghindari memory leaks

## Migration dari Komponen ke Service

Untuk memindahkan API logic dari komponen ke service:

1. Identifikasi semua API calls di komponen
2. Extract logic tersebut ke function di service file
3. Export function dan types yang diperlukan
4. Update komponen untuk import dan menggunakan function dari service
5. Test untuk memastikan semuanya masih berfungsi dengan baik

## Contoh Migration

**Sebelum:**

```typescript
// Di komponen
const fetchData = async () => {
  const backend = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${backend}/api/logbook/my`;
  const token = getAppToken();
  const resp = await axios.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const items = resp.data.data || [];
  // ... mapping logic
};
```

**Sesudah:**

```typescript
// Di service file
export async function fetchMyActivities(params) {
  const backend = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${backend}/api/logbook/my`;
  const token = getAppToken();
  const resp = await axios.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cancelToken: params.cancelToken,
  });
  return resp.data.data.map(/* mapping logic */);
}

// Di komponen
import { fetchMyActivities } from "@/components/service/activity";
const activities = await fetchMyActivities({ cancelToken: source.token });
```

## Benefits

1. **Easier Maintenance** - Logic API terpusat di satu tempat
2. **Better Testing** - Service functions bisa di-test secara terpisah
3. **Code Reusability** - Bisa digunakan di berbagai komponen
4. **Type Safety** - Types di-export dari service, konsisten di semua tempat
5. **Cleaner Components** - Komponen lebih fokus ke UI, logic API di service
