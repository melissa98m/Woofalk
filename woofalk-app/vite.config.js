import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
  plugins: [react()],
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
