import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // In dev, any request to /api/... is forwarded by Vite to the backend.
    // The browser only ever talks to Vite's own origin, so no CORS is needed.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
