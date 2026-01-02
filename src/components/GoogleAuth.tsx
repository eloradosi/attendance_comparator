"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import getIdToken from "@/lib/getIdToken";
import { showToast } from "@/components/Toast";
import apiFetch, { setAppToken, clearAppToken } from "@/lib/api";
import { getApiUrl } from "@/lib/runtimeConfig";

export default function GoogleAuth({
  mode = "full",
}: {
  mode?: "full" | "display" | "actions";
}) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        const authInstance = await getFirebaseAuth();
        unsub = onAuthStateChanged(authInstance, (u) => setUser(u));
      } catch (error) {
        console.error("Auth listener setup failed:", error);
      }
    };

    setupAuthListener();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const authInstance = await getFirebaseAuth();
      // Try popup first (preferred UX). In some environments (incognito,
      // strict cookie settings, or popup blockers) this will fail — catch
      // the error and fallback to redirect-based sign-in which works more
      // reliably across environments.
      const cred = await signInWithPopup(authInstance, provider);

      // Obtain a Firebase ID token (JWT) that we'll send to our backend
      // so the backend can verify the user identity and return an app
      // session token (or user profile). Backend expects JSON { idToken }.
      const idToken = await getIdToken(false);

      try {
        const backend = await getApiUrl();
        const resp = await apiFetch(
          `${backend.replace(/\/$/, "")}/api/auth/login`,
          {
            method: "POST",
            body: JSON.stringify({ idToken }),
          }
        );

        if (!resp.ok) {
          console.warn("Backend login failed:", resp.status, await resp.text());
          showToast("Backend login failed", "error");
        } else {
          const data = await resp.json();
          // Store token in sessionStorage (persists on reload, cleared when tab closes)
          if (data?.token) {
            setAppToken(data.token);
          }
          showToast("Signed in", "success");
        }
      } catch (backendErr) {
        console.error("Error calling backend login:", backendErr);
        showToast("Backend login error", "error");
      }

      // After successful sign-in, respect an optional `next` query param
      // otherwise default to the dashboard so users land there by default.
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      if (next) {
        router.replace(decodeURIComponent(next));
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.warn(
        "Google sign-in (popup) failed:",
        err?.code || err?.message || err
      );

      // Known error codes that suggest popup was blocked or unsupported:
      // - auth/popup-blocked
      // - auth/operation-not-supported-in-this-environment
      // - auth/unauthorized-domain
      const code = err?.code || "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment" ||
        code === "auth/cancelled-popup-request"
      ) {
        try {
          // Inform the user that we'll fall back to a redirect
          showToast("Popup blocked — falling back to redirect sign-in", "info");
          const authInstance = await getFirebaseAuth();
          await signInWithRedirect(authInstance, provider);
        } catch (rErr) {
          console.error("Redirect sign-in also failed:", rErr);
          alert(
            "Google sign-in failed. Please disable popup blockers or try another browser."
          );
        }
        return;
      }

      // Fallback for other errors: show console and a friendly message
      console.error("Google sign-in failed:", err);
      alert("Google sign-in failed, see console for details.");
    }
  };

  const handleSignOut = async () => {
    try {
      const authInstance = await getFirebaseAuth();
      await signOut(authInstance);
      clearAppToken();
      // Remove stored lastPath then redirect to dashboard after sign out
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("lastPath");
      }
      router.push("/dashboard");
      // TODO: Call backend logout endpoint if needed
      // await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  const handleLogIdToken = async () => {
    try {
      const token = await getIdToken(false);
      console.log("Firebase ID token:", token);
      await navigator.clipboard.writeText(token);
      showToast("ID token copied to clipboard", "success");
    } catch (err) {
      console.error("Failed to get ID token:", err);
      showToast("Failed to retrieve ID token", "error");
    }
  };

  // ----------------------------------------------------
  // USER NOT LOGGED IN → Show Sign in button (only in full mode)
  // For `display`/`actions` mode we avoid rendering a nested <button>
  // because `Navbar` wraps the component inside another button which
  // produces invalid nested-button markup and duplicated UI.
  // ----------------------------------------------------
  if (!user) {
    if (mode === "full") {
      return (
        <button
          onClick={handleSignIn}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white text-gray-700 shadow-sm hover:shadow-md border border-gray-200 transition"
        >
          <span className="text-sm font-medium">Sign in with Google</span>
        </button>
      );
    }

    // For display/actions mode when not signed in, render a non-interactive
    // inline label so the parent (e.g. Navbar) can control interaction/toggle
    // without causing nested <button> elements.
    return <span className="text-sm font-medium">Sign in with Google</span>;
  }

  // ----------------------------------------------------
  // DISPLAY MODE → avatar + name + email
  // ----------------------------------------------------
  if (mode === "display") {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL && (
          <img
            src={user.photoURL}
            className="w-8 h-8 rounded-full border shadow-sm"
          />
        )}
        <div className="text-left leading-tight text-sm">
          <div className="font-medium">{user.displayName}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIONS MODE → only sign out + log token buttons
  // ----------------------------------------------------
  if (mode === "actions") {
    return (
      <div className="flex flex-col">
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 text-sm"
        >
          Sign out
        </button>
        <button
          onClick={handleLogIdToken}
          className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 text-sm"
        >
          Log ID Token
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL MODE (default)
  // ----------------------------------------------------
  return (
    <div className="flex items-center gap-3">
      {user.photoURL && (
        <img
          src={user.photoURL}
          className="w-8 h-8 rounded-full border shadow-sm"
        />
      )}
      <div className="text-left leading-tight text-sm">
        <div className="font-medium">{user.displayName}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </div>

      <button
        onClick={handleSignOut}
        className="px-2 py-1 rounded border ml-2 text-sm"
      >
        Sign out
      </button>

      <button
        onClick={handleLogIdToken}
        className="px-2 py-1 rounded border ml-2 text-sm"
      >
        Log ID Token
      </button>
    </div>
  );
}
