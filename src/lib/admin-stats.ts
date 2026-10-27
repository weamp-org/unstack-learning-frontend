import api, { apiErrorMessage } from "./api";

export interface StatsOverview {
  total: number;
  open: number;
  accepted: number;
  closed: number;
  learnersHelped: number;
  sessionsArranged: number;
  oldestOpenWaitMinutes: number | null;
}

export interface StatsResponsiveness {
  medianSecondsToAccept: number | null;
  p90SecondsToAccept: number | null;
  pctAcceptedUnder1h: number | null;
  staleOver45m: number;
  unansweredOver24h: number;
}

export interface StatsBySubject {
  subjectId: string;
  subjectName: string;
  total: number;
  accepted: number;
}

export interface StatsByTeacher {
  teacherId: string;
  teacherName: string;
  accepts: number;
  declines: number;
  medianSecondsToAccept: number | null;
}

export interface StatsFeedbackDistribution {
  rating: number;
  count: number;
}

export interface StatsFeedbackComment {
  requestId: string;
  topic: string;
  subjectName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StatsFeedback {
  total: number;
  coverage: number | null;
  averageRating: number | null;
  distribution: StatsFeedbackDistribution[];
  recentComments: StatsFeedbackComment[];
}

export interface AdminStats {
  overview: StatsOverview;
  responsiveness: StatsResponsiveness;
  bySubject: StatsBySubject[];
  byTeacher: StatsByTeacher[];
  feedback: StatsFeedback;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export function adminStatsErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return apiErrorMessage(error, fallback, {
    403: "Only admins can view this.",
  });
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = seconds / 3600;
  return hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;
}

export function formatWaitMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;
}
