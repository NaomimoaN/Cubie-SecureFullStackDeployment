import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const BACKEND_SERVER_PORT = 5001;
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${BACKEND_SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
