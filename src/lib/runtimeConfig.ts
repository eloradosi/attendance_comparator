import type { RuntimeConfig } from "@/pages/api/runtime-config";

let cachedConfig: RuntimeConfig | null = null;
let configPromise: Promise<RuntimeConfig> | null = null;

/**
 * Fetch runtime configuration from the server
 * Uses in-memory cache to avoid repeated requests
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // If a fetch is already in progress, wait for it
  if (configPromise) {
    return configPromise;
  }

  // Start new fetch
  configPromise = fetch("/api/runtime-config")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch runtime config: ${res.status}`);
      }
      return res.json();
    })
    .then((config: RuntimeConfig) => {
      cachedConfig = config;
      configPromise = null;
      return config;
    })
    .catch((err) => {
      configPromise = null;
      throw err;
    });

  return configPromise;
}

/**
 * Get API URL from runtime config
 */
export async function getApiUrl(): Promise<string> {
  const config = await getRuntimeConfig();
  return config.apiUrl;
}

/**
 * Get Firebase config from runtime config
 */
export async function getFirebaseConfig() {
  const config = await getRuntimeConfig();
  return config.firebase;
}

/**
 * Clear cached config (useful for testing or forcing refresh)
 */
export function clearConfigCache() {
  cachedConfig = null;
  configPromise = null;
}
