
export function setAppToken(token: string | null) {
  if (token) {
    sessionStorage.setItem("app_token", token);
  } else {
    sessionStorage.removeItem("app_token");
  }
}

export function clearAppToken() {
  sessionStorage.removeItem("app_token");
}

export function getAppToken(): string | null {
  return sessionStorage.getItem("app_token");
}

export default async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  // Attach bearer token from sessionStorage if available
  const token = getAppToken();
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

