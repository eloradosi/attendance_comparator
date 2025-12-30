"use client";

const TOKEN_KEY = "app_token";
const EXPIRY_KEY = "app_token_expiry";

export function setAppToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAppToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}

export function getAppToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setTokenExpiry(expiryTime: string | null) {
  if (expiryTime) {
    sessionStorage.setItem(EXPIRY_KEY, expiryTime);
  } else {
    sessionStorage.removeItem(EXPIRY_KEY);
  }
}

export function getTokenExpiry(): string | null {
  return sessionStorage.getItem(EXPIRY_KEY);
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return false;

  try {
    const expiryDate = new Date(expiry);
    const now = new Date();
    return now >= expiryDate;
  } catch (e) {
    console.error("Error parsing token expiry:", e);
    return false;
  }
}

function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export default async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  // Attach bearer token from sessionStorage if available
  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Avoid setting Content-Type for FormData bodies
  const bodyIsForm = init.body instanceof FormData;
  if (!bodyIsForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(input, { ...init, headers, credentials: "include" });
  return resp;
}

