export type ActivityStatus = "on_duty" | "off_duty" | "idle"; // on_duty=On duty, off_duty=Off duty, idle=Idle

export type ActivityLog = {
    id: string;
    date: string; // YYYY-MM-DD
    status: ActivityStatus;
    // On-duty fields
    title?: string;
    detail?: string;
    percentStart?: number; // 0-100
    percentEnd?: number; // 0-100
    // Off-duty reason
    reason?: string; // sakit|cuti|izin
    createdAt: string;
    updatedAt?: string;
};

const keyFor = (uid: string) => `activityLogs:${uid}`;

export function loadActivityLogs(uid: string): ActivityLog[] {
    try {
        const raw = localStorage.getItem(keyFor(uid));
        if (!raw) return [];
        const parsed = JSON.parse(raw) as any[];
        // Normalize legacy status values ('on'/'off') to new tokens
        return parsed.map((p) => {
            const copy: any = { ...p };
            if (copy.status === "on") copy.status = "on_duty";
            if (copy.status === "off") copy.status = "off_duty";
            return copy as ActivityLog;
        });
    } catch (err) {
        console.error("Failed to load activity logs", err);
        return [];
    }
}

export function saveActivityLogs(uid: string, logs: ActivityLog[]) {
    try {
        localStorage.setItem(keyFor(uid), JSON.stringify(logs));
    } catch (err) {
        console.error("Failed to save activity logs", err);
    }
}

export function addActivityLog(uid: string, log: ActivityLog) {
    const logs = loadActivityLogs(uid);
    logs.unshift(log); // newest first
    saveActivityLogs(uid, logs);
}

export function updateActivityLog(uid: string, updated: ActivityLog) {
    const logs = loadActivityLogs(uid).map((l) => (l.id === updated.id ? updated : l));
    saveActivityLogs(uid, logs);
}

export function deleteActivityLog(uid: string, id: string) {
    const logs = loadActivityLogs(uid).filter((l) => l.id !== id);
    saveActivityLogs(uid, logs);
}
