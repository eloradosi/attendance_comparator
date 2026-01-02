"use client";

import { getFirebaseAuth } from "@/lib/firebaseClient";

export default async function getIdToken(forceRefresh = false): Promise<string> {
    const auth = await getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const token = await user.getIdToken(forceRefresh);
    return token;
}
