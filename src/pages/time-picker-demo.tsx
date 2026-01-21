"use client";

import { useState } from "react";
import TimePicker from "@/components/ui/time-picker";
import TimePickerCompact from "@/components/ui/time-picker-compact";
import TimePickerHybrid from "@/components/ui/time-picker-hybrid";

export default function TimePickerDemo() {
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");
  const [time3, setTime3] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    sessionStorage.setItem("isDarkMode", String(newMode));
  };

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Time Picker Variants Demo
            </h1>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Pilih style time picker yang paling cocok untuk aplikasi Anda
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`px-4 py-2 rounded font-medium transition ${
              isDarkMode
                ? "bg-teal-700 text-white hover:bg-teal-600"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            {isDarkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variant 1: Dual Column List */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Variant 1: Dual Column</h2>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Pilih jam dan menit dari dua kolom yang dapat di-scroll
              </p>
            </div>

            <div className="space-y-4">
              <TimePicker
                value={time1}
                onChange={setTime1}
                label="Select Time"
                required={true}
              />

              <div
                className={`mt-4 p-3 rounded ${
                  isDarkMode ? "bg-gray-900/50" : "bg-gray-50"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  Selected Value:
                </div>
                <div className="font-mono">{time1 || "No time selected"}</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-sm">Fitur:</h3>
              <ul
                className={`text-xs space-y-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>✅ Scroll semua jam (00-23) dan menit (00-59)</li>
                <li>✅ Auto-close setelah pilih jam & menit</li>
                <li>✅ Tombol "Now" untuk waktu sekarang</li>
                <li>✅ Tombol "Clear" untuk hapus</li>
                <li>✅ Icon jam 🕐</li>
              </ul>
            </div>
          </div>

          {/* Variant 2: Compact Wheel */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Variant 2: Wheel Style</h2>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Wheel picker seperti di mobile dengan interval 5 menit
              </p>
            </div>

            <div className="space-y-4">
              <TimePickerCompact
                value={time2}
                onChange={setTime2}
                label="Select Time"
                required={true}
              />

              <div
                className={`mt-4 p-3 rounded ${
                  isDarkMode ? "bg-gray-900/50" : "bg-gray-50"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  Selected Value:
                </div>
                <div className="font-mono">{time2 || "No time selected"}</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-sm">Fitur:</h3>
              <ul
                className={`text-xs space-y-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>✅ Wheel design mobile-friendly</li>
                <li>✅ Menit dalam interval 5 (00, 05, 10...)</li>
                <li>✅ Tombol "Confirm" untuk apply</li>
                <li>✅ Tombol "Now" dan "Cancel"</li>
                <li>✅ Auto-scroll ke nilai terpilih</li>
                <li>✅ Icon alarm ⏰</li>
              </ul>
            </div>
          </div>

          {/* Variant 3: Hybrid with Presets */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Variant 3: Hybrid</h2>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Input manual + preset waktu populer
              </p>
            </div>

            <div className="space-y-4">
              <TimePickerHybrid
                value={time3}
                onChange={setTime3}
                label="Select Time"
                required={true}
              />

              <div
                className={`mt-4 p-3 rounded ${
                  isDarkMode ? "bg-gray-900/50" : "bg-gray-50"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  Selected Value:
                </div>
                <div className="font-mono">{time3 || "No time selected"}</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-sm">Fitur:</h3>
              <ul
                className={`text-xs space-y-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>✅ Input manual (native time input)</li>
                <li>✅ Quick presets (08:00, 12:00, 17:00, dll)</li>
                <li>✅ Icon emoji untuk setiap preset</li>
                <li>✅ Tombol "Now" untuk waktu sekarang</li>
                <li>✅ Flexible - ketik atau klik preset</li>
                <li>✅ Icon stopwatch ⏱️</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div
          className={`mt-8 p-6 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Perbandingan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={
                    isDarkMode
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <th className="text-left py-2 pr-4">Fitur</th>
                  <th className="text-center py-2 px-4">Variant 1</th>
                  <th className="text-center py-2 px-4">Variant 2</th>
                  <th className="text-center py-2 px-4">Variant 3</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className={
                    isDarkMode
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="py-2 pr-4">Mudah digunakan</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                </tr>
                <tr
                  className={
                    isDarkMode
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="py-2 pr-4">Mobile friendly</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐</td>
                </tr>
                <tr
                  className={
                    isDarkMode
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="py-2 pr-4">Presisi tinggi</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                </tr>
                <tr
                  className={
                    isDarkMode
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="py-2 pr-4">Cepat input</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Style konsisten</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                  <td className="text-center py-2 px-4">⭐⭐⭐⭐⭐</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            className={`mt-4 p-4 rounded ${
              isDarkMode ? "bg-teal-900/30" : "bg-teal-50"
            }`}
          >
            <h3 className="font-semibold mb-2">💡 Rekomendasi:</h3>
            <ul className="text-sm space-y-1">
              <li>
                <strong>Variant 1 (Dual Column):</strong> Cocok untuk input yang
                butuh presisi penuh dan tampilan clean
              </li>
              <li>
                <strong>Variant 2 (Wheel):</strong> Cocok untuk mobile atau
                tablet, quick selection dengan interval 5 menit
              </li>
              <li>
                <strong>Variant 3 (Hybrid):</strong> Paling flexible, cocok
                untuk power users yang suka ketik manual atau casual users yang
                suka preset
              </li>
            </ul>
          </div>
        </div>

        {/* Code Example */}
        <div
          className={`mt-8 p-6 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Cara Implementasi</h2>
          <div
            className={`p-4 rounded ${
              isDarkMode ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <pre className="text-xs overflow-x-auto">
              <code>
                {`// Variant 1: Dual Column
import TimePicker from "@/components/ui/time-picker";

<TimePicker
  value={checkinTime}
  onChange={setCheckinTime}
  label="Check-in Time"
  required={true}
/>

// Variant 2: Wheel Style
import TimePickerCompact from "@/components/ui/time-picker-compact";

<TimePickerCompact
  value={checkinTime}
  onChange={setCheckinTime}
  label="Check-in Time"
  required={true}
/>

// Variant 3: Hybrid
import TimePickerHybrid from "@/components/ui/time-picker-hybrid";

<TimePickerHybrid
  value={checkinTime}
  onChange={setCheckinTime}
  label="Check-in Time"
  required={true}
/>`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
