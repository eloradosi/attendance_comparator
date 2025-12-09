"use client";

import React, { useEffect, useRef, useState } from "react";

type Option = { value: string; label: React.ReactNode };

type Props = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  width?: string;
  placeholder?: string;
};

export default function Dropdown({
  options,
  value,
  onChange,
  width = "w-44",
  placeholder = "Select",
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      // set highlight to currently selected index
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    } else {
      setHighlight(null);
    }
  }, [open, options, value]);

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="mt-1 w-full border rounded px-3 py-2 flex items-center justify-between text-sm"
      >
        <span className="truncate">
          {options.find((o) => o.value === value)?.label ?? placeholder}
        </span>
        <svg
          className="w-4 h-4 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute mt-1 left-0 right-0 bg-white border rounded shadow z-50 max-h-60 overflow-auto"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => {
                const next =
                  h === null ? 0 : Math.min(options.length - 1, h + 1);
                return next;
              });
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => {
                const prev =
                  h === null ? options.length - 1 : Math.max(0, h - 1);
                return prev;
              });
            } else if (e.key === "Enter" && highlight !== null) {
              e.preventDefault();
              onChange(options[highlight].value);
              setOpen(false);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`px-3 py-2 cursor-pointer ${
                i === highlight ? "bg-gray-100" : "hover:bg-gray-50"
              } ${
                opt.value === value ? "font-medium" : "text-sm text-gray-700"
              }`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
