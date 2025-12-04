"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DiffTable from "@/components/DiffTable";
import ExportButtons from "@/components/ExportButtons";
import { CompareResponse } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ComparePage() {
  const router = useRouter();
  const [data, setData] = useState<CompareResponse | null>(null);

  useEffect(() => {
    // Retrieve comparison result from sessionStorage
    const storedData = sessionStorage.getItem("comparisonResult");
    if (storedData) {
      try {
        // Backend already returns the desired shape; parse and set directly
        setData(JSON.parse(storedData));
      } catch (err) {
        console.error(
          "Failed to parse comparisonResult from sessionStorage",
          err
        );
        router.push("/");
      }
    } else {
      // Redirect to home if no data
      router.push("/");
    }
  }, [router]);

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comparison Results
          </h1>
          {data.summary.employeeName && (
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">{data.summary.employeeName}</span>
              {data.summary.employeeId && (
                <span className="ml-2 text-xs text-gray-500">
                  ({data.summary.employeeId})
                </span>
              )}
            </p>
          )}
          {data.summary.note && (
            <p className="text-sm text-gray-600 mt-1">{data.summary.note}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Rows (IHCS)</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.summary.totalRowsIhcs}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                Total Rows (Timesheet)
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {data.summary.totalRowsTimesheet}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Matched</p>
              <p className="text-2xl font-bold text-green-600">
                {data.summary.totalMatched}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Differences</p>
              <p className="text-2xl font-bold text-red-600">
                {data.summary.totalDifferences}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Missing in Timesheet</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.summary.totalMissingInTimesheet}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Missing in IHCS</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.summary.totalMissingInIhcs}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <ExportButtons diffs={data.differences} summary={data.summary} />
        </div>

        <DiffTable diffs={data.differences} />
      </div>
    </main>
  );
}
