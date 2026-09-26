import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.substring(name.length + 1));
}

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase();
  if (MUTATING_METHODS.has(method)) {
    const csrf = readCookie("svi_csrf");
    if (csrf) {
      config.headers.set("x-csrf-token", csrf);
    }
  }
  return config;
});

let redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isAuthCheck = requestUrl.includes("/auth/me");
    const isLoginAttempt = requestUrl.includes("/auth/login");

    if (status === 401 && !isAuthCheck && !isLoginAttempt) {
      if (!redirectingToLogin && window.location.pathname !== "/login") {
        redirectingToLogin = true;
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
