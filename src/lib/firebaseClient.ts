// Client-side Firebase initialization using runtime config
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseConfig } from "./runtimeConfig";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Firebase with runtime configuration
 * This function fetches config from /api/runtime-config at runtime
 */
async function initializeFirebase(): Promise<void> {
  if (app && auth) {
    return; // Already initialized
  }

  if (initPromise) {
    return initPromise; // Initialization in progress
  }

  initPromise = (async () => {
    try {
      // Fetch Firebase config from runtime API
      const config = await getFirebaseConfig();

      // Initialize Firebase app
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }

      // Initialize Auth
      auth = getAuth(app);

      initPromise = null;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get Firebase Auth instance
 * Initializes Firebase if not already done
 */
export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    await initializeFirebase();
  }
  if (!auth) {
    throw new Error("Firebase Auth not initialized");
  }
  return auth;
}

/**
 * Get Firebase App instance
 * Initializes Firebase if not already done
 */
export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!app) {
    await initializeFirebase();
  }
  if (!app) {
    throw new Error("Firebase App not initialized");
  }
  return app;
}

// For backward compatibility, export a synchronous auth getter
// This will be null until Firebase is initialized
let syncAuth: Auth | null = null;

// Initialize on module load in browser
if (typeof window !== "undefined") {
  initializeFirebase().then(() => {
    syncAuth = auth;
  }).catch(console.error);
}

// Export synchronous auth for components that can't use async
// Components should handle null case or use getFirebaseAuth() for guaranteed init
export { syncAuth as auth };

export default app;
