"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { isTokenExpired, clearAppToken } from "@/lib/api";

export default function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If not logged in, redirect to login page; preserve intended path
        const redirectTo = encodeURIComponent(pathname || "/");
        router.replace(`/login?next=${redirectTo}`);
      } else {
        // Check if token has expired
        if (isTokenExpired()) {
          // Token expired, sign out and redirect to login
          await signOut(auth);
          clearAppToken();
          const redirectTo = encodeURIComponent(pathname || "/");
          router.replace(`/login?next=${redirectTo}`);
        } else {
          setReady(true);
        }
      }
    });
    return () => unsub();
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          Checking authentication...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
