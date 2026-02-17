import type { TaskDTO, SessionDTO } from "@/types";
import { getTodayIso } from "@/lib/dates";

const LOCAL_TASKS_KEY = "cultivate-focus:tasks";
const LOCAL_SESSIONS_KEY = "cultivate-focus:sessions";
export const LOCAL_USER_ID = "local-user";

export function generateLocalId(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis as typeof globalThis & { crypto?: Crypto }).crypto
      : undefined;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  // Fallback: use crypto.getRandomValues if available (safer than Math.random)
  if (cryptoRef?.getRandomValues) {
    const arr = new Uint8Array(12);
    cryptoRef.getRandomValues(arr);
    return Array.from(arr, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // Last resort: timestamp + sequence (for environments without crypto)
  return `${Date.now()}-${Math.floor(Math.random() * 10000000)}`;
}

type StoredTask = Partial<TaskDTO> & Record<string, unknown>;
type StoredSession = Partial<SessionDTO> & Record<string, unknown>;

export function parseLocalArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.warn("Unable to parse local storage entry", error);
    return [];
  }
}

export function normalizeTask(raw: StoredTask): TaskDTO | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) {
    return null;
  }
  // Support both legacy focusMinutes and new focusMinutesGoal
  const legacyFocusMinutes = Number(raw.focusMinutes);
  const focusMinutesGoalRaw = raw.focusMinutesGoal;
  const focusMinutesGoal =
    focusMinutesGoalRaw !== undefined && focusMinutesGoalRaw !== null
      ? Number(focusMinutesGoalRaw)
      : Number.isFinite(legacyFocusMinutes) && legacyFocusMinutes > 0
        ? legacyFocusMinutes
        : null;
  const earnedPointsNumber = Number(raw.earnedPoints);
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString();
  // Auto-assign scheduledDate to today if missing (client-side migration)
  const scheduledDate =
    typeof raw.scheduledDate === "string" && raw.scheduledDate
      ? raw.scheduledDate
      : getTodayIso();

  return {
    _id:
      typeof raw._id === "string" && raw._id ? raw._id : generateLocalId(),
    userId:
      typeof raw.userId === "string" && raw.userId
        ? raw.userId
        : LOCAL_USER_ID,
    title,
    description: typeof raw.description === "string" ? raw.description : "",
    focusMinutesGoal:
      focusMinutesGoal !== null && Number.isFinite(focusMinutesGoal) && focusMinutesGoal > 0
        ? Math.round(focusMinutesGoal)
        : null,
    scheduledDate,
    order: typeof raw.order === "number" ? raw.order : undefined,
    completed: Boolean(raw.completed),
    earnedPoints:
      Number.isFinite(earnedPointsNumber) && earnedPointsNumber > 0
        ? Math.round(earnedPointsNumber)
        : 0,
    createdAt,
  };
}

export function normalizeSession(raw: StoredSession): SessionDTO | null {
  // taskId is now optional - allow null for "quick timer" sessions
  const taskId =
    typeof raw.taskId === "string" && raw.taskId ? raw.taskId : null;
  const durationNumber = Number(raw.duration);
  const pointsNumber = Number(raw.pointsEarned);
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString();
  const isoDate =
    typeof raw.date === "string" && raw.date
      ? raw.date
      : createdAt.slice(0, 10);

  return {
    _id:
      typeof raw._id === "string" && raw._id ? raw._id : generateLocalId(),
    userId:
      typeof raw.userId === "string" && raw.userId
        ? raw.userId
        : LOCAL_USER_ID,
    taskId,
    duration:
      Number.isFinite(durationNumber) && durationNumber > 0
        ? Math.round(durationNumber)
        : 0,
    pointsEarned:
      Number.isFinite(pointsNumber) && pointsNumber > 0
        ? Math.round(pointsNumber)
        : 0,
    date: isoDate,
    createdAt,
  };
}

export function readLocalState(): { tasks: TaskDTO[]; sessions: SessionDTO[] } {
  if (typeof window === "undefined") {
    return { tasks: [], sessions: [] };
  }

  const taskCandidates = parseLocalArray<StoredTask>(
    window.localStorage.getItem(LOCAL_TASKS_KEY)
  );
  const sessionCandidates = parseLocalArray<StoredSession>(
    window.localStorage.getItem(LOCAL_SESSIONS_KEY)
  );

  const normalizedTasks = taskCandidates
    .map(normalizeTask)
    .filter((task): task is TaskDTO => task !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const normalizedSessions = sessionCandidates
    .map(normalizeSession)
    .filter((session): session is SessionDTO => session !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    tasks: normalizedTasks,
    sessions: normalizedSessions,
  };
}

export function persistLocalTasks(nextTasks: TaskDTO[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(nextTasks));
}

export function persistLocalSessions(nextSessions: SessionDTO[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(nextSessions));
}
