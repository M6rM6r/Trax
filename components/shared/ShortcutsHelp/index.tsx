"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], description: "فتح لوحة الأوامر" },
  { keys: ["⌘", "B"], description: "إظهار/إخفاء القائمة الجانبية" },
  { keys: ["?"], description: "إظهار اختصارات لوحة المفاتيح" },
  { keys: ["Esc"], description: "إغلاق النوافذ المنبثقة" },
  { keys: ["G", "D"], description: "الذهاب إلى لوحة التحكم" },
  { keys: ["G", "E"], description: "الذهاب إلى الموظفين" },
  { keys: ["G", "A"], description: "الذهاب إلى الحضور" },
  { keys: ["G", "M"], description: "الذهاب إلى الخريطة المباشرة" },
  { keys: ["G", "S"], description: "الذهاب إلى الإعدادات" },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  اختصارات لوحة المفاتيح
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50"
                >
                  <span className="text-sm text-gray-700 dark:text-slate-300">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1 text-xs font-mono font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md text-gray-700 dark:text-slate-200 shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
