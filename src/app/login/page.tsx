"use client";

import GoogleAuth from "@/components/GoogleAuth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left hero */}
          <div className="p-10 bg-gradient-to-b from-blue-600 to-indigo-600 text-white flex flex-col justify-center relative overflow-hidden">
            <h2 className="text-4xl font-extrabold mb-3">
              Attendance Comparator
            </h2>
            <p className="opacity-90 mb-6">
              Quickly compare IHCS and Timesheet files, spot differences, and
              export verified results.
            </p>
            <ul className="space-y-3 text-sm opacity-90">
              <li>• Fast PDF & Excel parsing</li>
              <li>• Download watermarked passed files</li>
              <li>• Secure access with Google Sign-in</li>
            </ul>
            <div className="mt-8 opacity-90 text-sm">
              Need help?{" "}
              <Link href="/" className="underline">
                Contact admin
              </Link>
            </div>

            {/* Decorative illustration */}
            <svg
              className="absolute right-4 bottom-4 w-40 h-40 opacity-20"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width="200"
                height="200"
                rx="20"
                fill="url(#g1)"
              />
              <g transform="translate(20,40)">
                <rect
                  x="0"
                  y="30"
                  width="14"
                  height="70"
                  rx="3"
                  fill="#fff"
                  opacity="0.9"
                />
                <rect
                  x="26"
                  y="10"
                  width="14"
                  height="90"
                  rx="3"
                  fill="#fff"
                  opacity="0.9"
                />
                <rect
                  x="52"
                  y="50"
                  width="14"
                  height="50"
                  rx="3"
                  fill="#fff"
                  opacity="0.9"
                />
                <circle cx="120" cy="40" r="28" fill="#fff" opacity="0.9" />
              </g>
            </svg>
          </div>

          {/* Right auth card */}
          <div className="p-8 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Sign in to continue
                </h3>
                <p className="text-sm text-gray-500">
                  Use your Google account to access the Attendance Comparator
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <GoogleAuth />

                <div className="w-full text-center mt-2">
                  <Link
                    href="/"
                    className="inline-block text-sm text-gray-500 hover:underline"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>

              <div className="mt-8 text-xs text-gray-400 text-center">
                By signing in you agree to the company policies. This sign-in
                uses Firebase Authentication.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
