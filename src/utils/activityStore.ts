export type ActivityStatus = "busy" | "normal" | "idle";

export type ActivityLog = {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    detail?: string;
    status: ActivityStatus;
    createdAt: string;
    updatedAt?: string;
};

const keyFor = (uid: string) => `activityLogs:${uid}`;

export function loadActivityLogs(uid: string): ActivityLog[] {
    try {
        const raw = localStorage.getItem(keyFor(uid));
        if (!raw) return [];
        return JSON.parse(raw) as ActivityLog[];
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
