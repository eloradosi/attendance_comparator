import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, getFirebaseAuth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import getIdToken from "@/lib/getIdToken";
import { setAppToken } from "@/lib/api";
import { showToast } from "@/components/Toast";
import { getApiUrl } from "@/lib/runtimeConfig";
import Link from "next/link";
import ToastContainer from "@/components/Toast";

export default function LoginPage() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check auth immediately - don't render anything if already logged in
  const [shouldRender, setShouldRender] = useState(false);
  const [isManualLogin, setIsManualLogin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authInstance = await getFirebaseAuth();
        if (authInstance.currentUser) {
          // Already logged in, redirect immediately
          const lastPath = sessionStorage.getItem("lastPath") || "/dashboard";
          router.replace(lastPath !== "/login" ? lastPath : "/dashboard");
          return;
        }
        // Not logged in, allow rendering
        setShouldRender(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setShouldRender(true);
      }
    };

    checkAuth();

    // Listen for auth state changes (but skip if manual login in progress)
    const setupAuthListener = async () => {
      try {
        const authInstance = await getFirebaseAuth();
        const unsub = onAuthStateChanged(authInstance, (u) => {
          if (u && !isManualLogin) {
            const lastPath = sessionStorage.getItem("lastPath") || "/dashboard";
            router.replace(lastPath !== "/login" ? lastPath : "/dashboard");
          }
        });
        return unsub;
      } catch (error) {
        console.error("Auth listener setup failed:", error);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, isManualLogin]);

  // Don't render anything until we confirm user is not authenticated
  if (!shouldRender) {
    return null;
  }

  const handleSignIn = async () => {
    setIsLoading(true);
    setIsManualLogin(true); // Prevent onAuthStateChanged from interfering
    try {
      const authInstance = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(authInstance, provider);
      const idToken = await getIdToken(false);

      // Call backend login endpoint to establish session
      try {
        const backend = await getApiUrl();
        const response = await fetch(
          `${backend.replace(/\/$/, "")}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          }
        );

        if (!response.ok) {
          console.warn(
            "Backend login failed:",
            response.status,
            await response.text()
          );
          showToast("Backend login failed", "error");
        } else {
          const data = await response.json();
          // Store backend session token
          if (data?.token) {
            setAppToken(data.token);
          }
          showToast("Sign in successful!", "success");
          // Remove stored lastPath so we don't reuse it later
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("lastPath");
          }
          // Use router.push for smooth navigation
          router.push("/dashboard");
        }
      } catch (backendErr) {
        console.error("Error calling backend login:", backendErr);
        showToast("Backend login error", "error");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      showToast(err.message || "Sign in failed", "error");
    } finally {
      setIsLoading(false);
      setIsManualLogin(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#004d47] via-[#09867e] to-[#0c988d] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0c988d] rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#09867e] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#004d47] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl w-full text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              ATLAS
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#0c988d] to-[#09867e] mx-auto rounded-full"></div>
          </div>

          {/* Hero text */}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-tight">
            Attendance and Log Activities System
          </h2>

          {/* <p className="text-base md:text-lg text-white/90 font-medium mb-4">
            Attendance & daily activity — all in one place.
          </p> */}

          <p className="text-base md:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Log what you do, check your attendance,
            <br />
            and keep everything aligned — no spreadsheets, no guesswork.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => setShowModal(true)}
            className="group relative inline-flex items-center justify-center px-9 py-3 text-lg font-semibold text-white bg-white/15 backdrop-blur-md rounded-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:shadow-[0_8px_48px_rgba(255,255,255,0.13)] transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent before:content-[''] before:absolute before:inset-0 before:rounded-full before:pointer-events-none before:border-[1.5px] before:border-solid before:border-white/20 before:opacity-60 before:bg-gradient-to-br before:from-white/30 before:via-white/5 before:to-white/20 before:blur-[1px] before:z-10"
          >
            <span className="relative z-20">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          </button>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">
                Activity Tracking
              </h3>
              <p className="text-white/80 text-sm">
                Log your daily work activities with detailed status updates
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Smart Dashboard</h3>
              <p className="text-white/80 text-sm">
                View comprehensive reports and analytics at a glance
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Secure Access</h3>
              <p className="text-white/80 text-sm">
                Protected by Google authentication and Firebase security
              </p>
            </div>
          </div>

          {/* Footer link */}
          <div className="mt-12">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            ></Link>
          </div>
        </div>
      </div>

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => !isLoading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-bounceIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#0c988d] to-[#09867e] rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h3>
              <p className="text-gray-600">
                Sign in with your Google account to continue
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#0c988d] rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowModal(false)}
              disabled={isLoading}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <p className="text-xs text-gray-400 text-center mt-6">
              By signing in, you agree to our terms of service and privacy
              policy
            </p>
          </div>
        </div>
      )}
      <ToastContainer />
    </main>
  );
}
