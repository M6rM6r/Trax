"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function TimeSelector() {
  const [hour, setHour] = useState(1);
  const [period, setPeriod] = useState("صباحا"); // Default to morning (AM)

  const incrementHour = () => {
    setHour((prev) => (prev === 12 ? 1 : prev + 1));
  };

  const decrementHour = () => {
    setHour((prev) => (prev === 1 ? 12 : prev - 1));
  };

  const togglePeriod = () => {
    setPeriod((prev) => (prev === "صباحا" ? "مساءا" : "صباحا"));
  };

  return (
    <div className="font-sans" dir="rtl">
      <div className="flex flex-col items-end">
        <div className="text-red-500 mb-1">•</div>
        <div className="text-gray-600 mb-4">موعد البداية</div>

        <div className="flex gap-4">
          {/* Hour selector */}
          <div className="flex items-center">
            <div className="flex flex-col items-center bg-gray-100 rounded-md w-16 h-10 relative">
              <button
                onClick={incrementHour}
                className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronUp size={18} />
              </button>
              <span className="text-center py-2">{hour}</span>
              <button
                onClick={decrementHour}
                className="absolute bottom-0 right-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Period selector (AM/PM in Arabic) */}
          <div className="flex items-center">
            <div className="flex flex-col items-center bg-gray-100 rounded-md w-24 h-10 relative">
              <button
                onClick={togglePeriod}
                className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronUp size={18} />
              </button>
              <span className="text-center py-2">{period}</span>
              <button
                onClick={togglePeriod}
                className="absolute bottom-0 right-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
