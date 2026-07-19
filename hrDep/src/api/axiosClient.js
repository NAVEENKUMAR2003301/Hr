import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

// On a 401, try one silent refresh, then retry the original request.
let refreshPromise = null;

// A 401 from these two endpoints is never worth retrying: /auth/login failing means
// the credentials were wrong (no session to refresh), and /auth/refresh failing means
// the refresh token itself is invalid (refreshing a failed refresh is a no-op that
// would otherwise re-enter this same interceptor and double up the network call).
const NEVER_REFRESH_RETRY = ["/auth/login", "/auth/refresh"];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const eligibleForRetry = response?.status === 401 && !config._retried && !NEVER_REFRESH_RETRY.some((path) => config.url?.includes(path));

    if (eligibleForRetry) {
      config._retried = true;
      refreshPromise ??= api.post("/auth/refresh").finally(() => {
        refreshPromise = null;
      });
      try {
        await refreshPromise;
        return api(config);
      } catch {
        // fall through to reject below
      }
    }
    return Promise.reject(error);
  }
);
