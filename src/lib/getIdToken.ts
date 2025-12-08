"use client";

import { auth } from "@/lib/firebaseClient";

export default async function getIdToken(forceRefresh = false): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const token = await user.getIdToken(forceRefresh);
    return token;
}
