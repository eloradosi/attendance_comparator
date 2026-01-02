import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export default function IndexPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const authInstance = await getFirebaseAuth();
      unsub = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
        setChecking(false);
      });
    })();
    return () => {
      if (unsub) unsub();
    };
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
