"use client";

import { getFirebaseAuth } from "@/lib/firebaseClient";

// ⚠️ TEMPORARY BYPASS FOR FRONTEND DEVELOPMENT ⚠️
const TEMP_BYPASS_AUTH = true; // Set to false when backend is ready
// ⚠️ END TEMPORARY BYPASS ⚠️

export default async function getIdToken(forceRefresh = false): Promise<string> {
    // If bypass is enabled, return dummy token
    if (TEMP_BYPASS_AUTH) {
        return "dummy-token-for-development";
    }

    const auth = await getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const token = await user.getIdToken(forceRefresh);
    return token;
}
