import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.jsx"],
      refresh: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "127.0.0.1",
      port: 5173,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "resources/js"),
      "@images": path.resolve(__dirname, "resources/images"),
    },
  },
});
