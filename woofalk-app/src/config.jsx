// Centralizes the API origin so it can vary per environment (local Docker,
// staging, production) instead of being hardcoded across every component.
// Set VITE_API_URL in .env / .env.development / docker-compose.
export const API_URL = import.meta.env.VITE_API_URL || "https://api.woofalk.com";
