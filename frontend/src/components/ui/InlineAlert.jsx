import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const InlineAlert = ({ type = "error", message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-500/15" : "bg-red-500/15";
  const borderColor = isSuccess ? "border-green-500/40" : "border-red-500/40";
  const textColor = isSuccess ? "text-green-200" : "text-red-200";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border ${bgColor} ${borderColor} ${textColor} mt-3 text-sm`}
      >
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default InlineAlert;
