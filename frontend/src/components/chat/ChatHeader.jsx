import React from "react";
import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/dateFormat";

const ChatHeader = ({ chat, currentUserId, onlineUsers, onGroupInfoClick, onBack }) => {
  if (!chat) return null;

  const getChatTitleAndUser = (chat) => {
    if (chat.isGroup) {
      return { title: chat.name || "Group", primaryOther: null };
    }
    const others = (chat.participants || []).filter(
      (p) => (p._id || p.id) !== currentUserId
    );
    const title = others.map((p) => p.name).join(", ");
    const primaryOther = others[0] || null;
    return { title, primaryOther };
  };

  const { title, primaryOther } = getChatTitleAndUser(chat);
  const isOnline =
    !chat.isGroup &&
    primaryOther &&
    onlineUsers.includes(primaryOther._id || primaryOther.id);

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0 h-[72px]">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>

        <div className="relative">
          <Avatar
            src={chat.isGroup ? chat.avatar : primaryOther?.avatar}
            fallback={title.charAt(0).toUpperCase()}
            size={40}
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
          )}
        </div>
        
        <div className="flex flex-col">
           <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100 text-[15px]">{title}</span>
             {chat.isGroup && (
               <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">Group</span>
             )}
           </div>
           
           {!chat.isGroup && isOnline && (
               <span className="text-xs text-green-400">Online</span>
           )}
           {!chat.isGroup && !isOnline && primaryOther?.lastSeen && (
               <span className="text-xs text-slate-400">Last seen {formatLastSeen(primaryOther.lastSeen)}</span>
           )}
        </div>
      </div>

      {chat.isGroup && (
        <button
          onClick={onGroupInfoClick}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Group Info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </button>
      )}
    </header>
  );
};

export default ChatHeader;
