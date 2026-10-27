import axios, { isAxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

if (!baseURL) {
  // Warn loudly instead of silently pointing at localhost: the fallback
  // below only makes sense for local development.
  console.warn(
    "NEXT_PUBLIC_BACKEND_BASE_URL is not set; falling back to http://localhost:3000/api/v1 for local development.",
  );
}

const api = axios.create({
  baseURL: baseURL ?? "http://localhost:3000/api/v1",
  timeout: 10_000,
});

let interceptorId: number | null = null;

export function setupAuthInterceptor(getToken: () => Promise<string | null>) {
  if (interceptorId !== null) {
    api.interceptors.request.eject(interceptorId);
  }

  interceptorId = api.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // getToken failed — proceed without auth header
    }
    return config;
  });
}

export function teardownAuthInterceptor() {
  if (interceptorId !== null) {
    api.interceptors.request.eject(interceptorId);
    interceptorId = null;
  }
}

/**
 * Turns an API failure into copy worth showing a person.
 *
 * Callers pass status→copy overrides for outcomes only they can phrase well
 * (409 conflicts, admin-only 403s). Otherwise the server's own message wins,
 * but only when it is meant for people: Nest writes route misses and crashes
 * for developers ("Cannot DELETE /api/v1/notifications/…", "Internal server
 * error"), and a 404 on an item route usually means the row is already gone.
 */
export function apiErrorMessage(
  error: unknown,
  fallback: string,
  statusMessages: Partial<Record<number, string>> = {},
): string {
  if (!isAxiosError(error)) return fallback;

  const status = error.response?.status ?? 0;
  const override = statusMessages[status];
  if (override) return override;

  const body = error.response?.data as { message?: unknown } | undefined;
  const actionable = status >= 400 && status < 500 && status !== 404;
  if (
    actionable &&
    typeof body?.message === "string" &&
    !body.message.startsWith("Cannot ")
  ) {
    return body.message;
  }
  return fallback;
}

export default api;
