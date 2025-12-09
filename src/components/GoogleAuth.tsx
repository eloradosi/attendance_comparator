"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import getIdToken from "@/lib/getIdToken";
import { showToast } from "@/components/Toast";

export default function GoogleAuth({
  mode = "full",
}: {
  mode?: "full" | "display" | "actions";
}) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);

      // After successful sign-in, respect an optional `next` query param
      // otherwise default to the dashboard so users land there by default.
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      if (next) {
        router.replace(decodeURIComponent(next));
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert("Google sign-in failed, see console for details.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
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
