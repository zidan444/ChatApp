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

  const isSameSenderMargin = (messages, m, i, userId) => {
    if (
      i < messages.length - 1 &&
      messages[i + 1].sender._id === m.sender._id &&
      messages[i].sender._id !== userId
    )
      return 33;
    else if (
      (i < messages.length - 1 &&
        messages[i + 1].sender._id !== m.sender._id &&
        messages[i].sender._id !== userId) ||
      (i === messages.length - 1 && messages[i].sender._id !== userId)
    )
      return 0;
    else return "auto";
  };

  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
      )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-1 custom-scrollbar">
      {messages &&
        messages.map((m, i) => {
          const isOwn = m.sender?._id === currentUserId;
          const senderName = m.sender?.name || "Unknown";
          
          // Simplified logic for margin/layout compared to complex original
          // Using flex-start/end
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              key={m._id || i}
              className={`flex w-full mb-1 message-row ${isOwn ? "justify-end own" : "justify-start other"}`}
            >
                {!isOwn && (isSameSender(messages, m, i, currentUserId) || isLastMessage(messages, i, currentUserId)) ? (
                     <div className="w-8 mr-2 flex flex-col justify-end">
                         <Avatar src={m.sender?.avatar} fallback={senderName[0]} size={30} />
                     </div>
                ) : !isOwn && (
                    <div className="w-8 mr-2"></div>
                )}

                <div className={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div
                        className={`message-bubble relative group break-words ${
                            isOwn 
                            ? "own text-white" 
                            : "other text-slate-200"
                        }`}
                    >
                        {m.content}
                        
                         <span className={`text-[9px] ml-2 opacity-60 inline-block align-bottom mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
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
