// src/services/api.js
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

export default api;