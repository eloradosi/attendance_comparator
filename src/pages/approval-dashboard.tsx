import { useEffect } from "react";
import { useRouter } from "next/router";
import AuthGuard from "@/components/AuthGuard";

export default function ApprovalDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard for now
    router.replace("/dashboard");
  }, [router]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Redirecting...</div>
        </div>
      </div>
    </AuthGuard>
  );
}
