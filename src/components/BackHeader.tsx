"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  href?: string; // if provided, the arrow links to this href; otherwise go back
};

export default function BackHeader({ title, href }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center justify-center w-8 h-8"
          aria-label="back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-8 h-8"
          aria-label="back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      )}

      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
}
