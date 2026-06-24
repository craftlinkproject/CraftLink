import axios from "axios";
import { serverUrl } from "@config/server";
const BASE_URL = serverUrl || "https://craftlink-production.up.railway.app";
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 25000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("userData");
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
        window.location.href = `/signin?returnUrl=${returnUrl}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
