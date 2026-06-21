// src/services/api.js
import axios from "axios";
import { serverUrl } from "@config/server";
// Base URL: prefer configured serverUrl, fall back to localhost for dev
// const BASE_URL = serverUrl || "https://craftlink-production.up.railway.app";
const BASE_URL = serverUrl || "https://craftlink-production.up.railway.app";
// Create an axios instance with sane defaults
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // enable cookies for auth flows
  timeout: 25000, // 10s timeout for requests
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
export default api;