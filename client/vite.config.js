import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/allerton/",
  server: {
    port: 5173,
    // Proxy API calls to the Express server during development so the
    // front end can call "/api/..." without worrying about CORS/ports.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
