import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../utils/dateFormat";

const MessageList = ({ messages, currentUserId, loading }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSameSender = (messages, m, i, userId) => {
    return (
      i < messages.length - 1 &&
      (messages[i + 1].sender._id === m.sender._id ||
        messages[i + 1].sender._id === undefined) &&
      messages[i].sender._id !== userId
    );
  };

  const isLastMessage = (messages, i, userId) => {
    return (
      i === messages.length - 1 &&
      messages[messages.length - 1].sender._id !== userId &&
      messages[messages.length - 1].sender._id
    );
  };

  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
      )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2 custom-scrollbar">
      {messages &&
        messages.map((m, i) => {
          const isOwn = m.sender?._id === currentUserId;
          const senderName = m.sender?.name || "Unknown";
          const showAvatar = !isOwn && (isSameSender(messages, m, i, currentUserId) || isLastMessage(messages, i, currentUserId));
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              key={m._id || i}
              className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
            >
                {!isOwn && (
                     <div className="w-8 mr-2 flex flex-col justify-end shrink-0">
                         {showAvatar ? <Avatar src={m.sender?.avatar} fallback={senderName[0]} size={32} /> : <div className="w-8" />}
                     </div>
                )}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[65%]`}>
                    {!isOwn && showAvatar && (
                        <span className="text-[10px] text-slate-500 ml-1 mb-1">{senderName}</span>
                    )}

                    <div
                        className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                            isOwn 
                            ? "bg-[#3b82f6] text-white rounded-tr-sm" 
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                        }`}
                    >
                        {m.content}
                        
                         <span className={`text-[9px] ml-2 opacity-70 inline-block align-bottom mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
                             {formatMessageTime(m.createdAt)}
                         </span>
                    </div>
                </div>
            </motion.div>
          );
        })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
