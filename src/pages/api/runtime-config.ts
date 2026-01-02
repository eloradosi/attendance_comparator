import type { NextApiRequest, NextApiResponse } from "next";

export type RuntimeConfig = {
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
};

type ErrorResponse = {
  error: string;
  message: string;
  missingVariable?: string;
};

/**
 * Fail-fast helper: throws if environment variable is missing or empty
 * @param varName - Name of the environment variable
 * @returns The non-empty value
 * @throws Error if variable is missing or empty
 */
function requireEnv(varName: string): string {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${varName}. ` +
      `Please set it in your .env file or docker-compose.yml environment section.`
    );
  }
  return value;
}

/**
 * Runtime configuration endpoint
 * Reads configuration from process.env at runtime (server-side)
 * This allows changing .env without rebuilding the Docker image
 * 
 * Fail-Fast Behavior:
 * - Returns 500 if any required environment variable is missing
 * - Provides clear error message indicating which variable is missing
 * - Forces explicit configuration before the app can run
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<RuntimeConfig | ErrorResponse>
) {
  try {
    // Disable HTTP caching to ensure config changes are immediately reflected
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Fail-fast validation: throws if any required variable is missing
    const config: RuntimeConfig = {
      apiUrl: requireEnv("API_URL"),
      firebase: {
        apiKey: requireEnv("FIREBASE_WEB_API_KEY"),
        authDomain: requireEnv("FIREBASE_WEB_AUTH_DOMAIN"),
        projectId: requireEnv("FIREBASE_WEB_PROJECT_ID"),
        storageBucket: requireEnv("FIREBASE_WEB_STORAGE_BUCKET"),
        messagingSenderId: requireEnv("FIREBASE_WEB_MESSAGING_SENDER_ID"),
        appId: requireEnv("FIREBASE_WEB_APP_ID"),
        // measurementId is optional
        measurementId: process.env.FIREBASE_WEB_MEASUREMENT_ID || "",
      },
    };

    res.status(200).json(config);
  } catch (error) {
    // Handle validation errors with clear error response
    const errorMessage = error instanceof Error ? error.message : "Unknown configuration error";

    // Extract missing variable name from error message
    const missingVarMatch = errorMessage.match(/Missing required environment variable: (\w+)/);
    const missingVariable = missingVarMatch ? missingVarMatch[1] : undefined;

    console.error("[runtime-config] Configuration validation failed:", errorMessage);

    res.status(500).json({
      error: "Runtime Configuration Error",
      message: errorMessage,
      ...(missingVariable && { missingVariable }),
    });
  }
}
