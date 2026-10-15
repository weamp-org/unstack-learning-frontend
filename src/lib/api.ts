import axios from "axios";

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

export default api;
