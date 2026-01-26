import { useState, useEffect } from "react";
import { type User } from "firebase/auth";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { clearAppToken } from "@/lib/api";

interface UserProfileAvatarProps {
  user: User | null;
  isDarkMode?: boolean;
}

export default function UserProfileAvatar({
  user,
  isDarkMode = false,
}: UserProfileAvatarProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const displayName = user?.displayName || user?.email || "User";
  const firstName = displayName.split(" ")[0];

  useEffect(() => {
    if (!user) return;

    setAvatarUrl(
      user?.photoURL ||
        "https://ui-avatars.com/api/?name=" + encodeURIComponent(firstName),
    );
  }, [user, firstName]);

  const handleSignOut = async () => {
    try {
      const auth = await getFirebaseAuth();
      clearAppToken();
      await signOut(auth);

      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }

      router.replace("/login");
    } catch (error) {
      alert("Failed to sign out");
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <img
          src={avatarUrl || "https://ui-avatars.com/api/?name=User"}
          alt="Profile"
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${
            isDarkMode ? "border-white/20" : "border-gray-300"
          }`}
        />
        <ChevronDown
          className={`w-4 h-4 hidden sm:block ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        />
      </button>

      {showProfileMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowProfileMenu(false)}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute right-0 mt-2 w-56 border rounded-lg shadow-xl overflow-hidden z-20 ${
              isDarkMode
                ? "bg-slate-800 border-white/20"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-4 py-3 border-b ${
                isDarkMode ? "border-white/10" : "border-gray-200"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {displayName}
              </p>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {user?.email}
              </p>
            </div>
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignOut();
                  setShowProfileMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition ${
                  isDarkMode
                    ? "text-red-400 hover:bg-white/10"
                    : "text-red-600 hover:bg-gray-100"
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
