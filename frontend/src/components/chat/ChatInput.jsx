import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const ChatInput = ({ messageText, setMessageText, handleSendMessage, handleTyping, isTyping }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isTyping && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isTyping]);

  return (
    <form
      onSubmit={handleSendMessage}
      className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md shrink-0 flex gap-3 items-end"
    >
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="w-full bg-slate-800/80 border border-slate-700 text-slate-200 text-sm rounded-full py-3 px-5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
          value={messageText}
          onChange={handleTyping}
        />
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        disabled={!messageText.trim()}
        className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 -translate-y-0.5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </motion.button>
    </form>
  );
};

export default ChatInput;
