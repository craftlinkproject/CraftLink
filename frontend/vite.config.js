import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@icons": path.resolve(__dirname, "src/icons"),
      "@components": path.resolve(__dirname, "src/components"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@redux": path.resolve(__dirname, "src/redux"),
      "@config": path.resolve(__dirname, "config"),
      "@services": path.resolve(__dirname, "src/services"),
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },


  preview: {
    host: true,
    port: 4173,

    allowedHosts: [
      "craftlink-production.up.railway.app",
    ],
  },

  base: "/",
});