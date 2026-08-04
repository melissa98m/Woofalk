import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// The production headers (incl. CSP) live in vercel.json, since that's what
// actually serves the deployed front-end. These dev-server headers are just
// parity for the non-CSP ones — CSP is deliberately left out here since it'd
// need to allow Vite's own HMR websocket/eval'd module code, which would
// make it meaningless as a security boundary in dev anyway.
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), interest-cohort=()",
};

export default defineConfig({
  plugins: [
    react(),
    // Off by default — a stats page on every build is noise. Run
    // `ANALYZE=true npm run build` to inspect what's actually in each chunk.
    process.env.ANALYZE
      ? visualizer({ filename: "dist/stats.html", gzipSize: true, brotliSize: true, open: false })
      : null,
  ],
  server: {
    host: true,
    port: 3000,
    headers: securityHeaders,
  },
  preview: {
    host: true,
    port: 3000,
    headers: securityHeaders,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.jsx"],
  },
});
