import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function IndexPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, go to dashboard
        router.replace("/dashboard");
      } else {
        // No user, go to login
        router.replace("/login");
      }
      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return null;
}
