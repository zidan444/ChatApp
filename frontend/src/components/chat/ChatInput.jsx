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
      className="p-4 border-t border-slate-200 bg-white flex gap-3 items-center shrink-0 w-full"
    >
        {/* Attachment Button */}
        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
        </button>

        {/* Emoji Button */}
        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 -ml-1">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm6 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
             </svg>
        </button>

      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="w-full bg-slate-100/50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
          value={messageText}
          onChange={handleTyping}
        />
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        disabled={!messageText.trim()}
        className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 -translate-y-0.5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </motion.button>
    </form>
  );
};

export default ChatInput;
