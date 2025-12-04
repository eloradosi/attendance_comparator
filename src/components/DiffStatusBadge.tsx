"use client";

interface DiffStatusBadgeProps {
  status: string;
}

export default function DiffStatusBadge({ status }: DiffStatusBadgeProps) {
  const getTextColor = (status: string) => {
    if (status.includes("MISMATCH")) {
      return "text-red-600";
    }
    if (status.includes("MISSING")) {
      return "text-yellow-600";
    }
    if (status === "MATCH") {
      return "text-green-600";
    }
    return "text-gray-600";
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <span className={`text-sm ${getTextColor(status)}`}>
      {formatStatus(status)}
    </span>
  );
}
