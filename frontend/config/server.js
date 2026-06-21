// Frontend server URL configuration
// Priority:
// 1. Vite env `import.meta.env.VITE_SERVER_URL` (recommended for builds)
// 2. Dynamic fallback based on current window location (localhost dev vs production)
// 3. Fallback to production server

const getFallbackServerUrl = () => {
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return "https://craftlink-production.up.railway.app";
};

const DEFAULT_SERVER_URL = getFallbackServerUrl();
const resolvedServerUrl =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SERVER_URL) ||
  DEFAULT_SERVER_URL;
export const serverUrl = resolvedServerUrl;
export default serverUrl;