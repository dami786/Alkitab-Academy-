const configured = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const API_BASE = configured;

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function request(url, options = {}) {
  const response = await fetch(apiUrl(url), options);
  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await response.json() : null;
  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }
  return data;
}

export function getContent() {
  return request("/api/content");
}

export function authHeader() {
  const token = localStorage.getItem("alkitab_admin");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
