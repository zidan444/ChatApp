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
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#1a1d21]/40 backdrop-blur-md shrink-0 h-[80px]">
      <div className="flex items-center gap-4">
        {/* Back button for mobile */}
        <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>

        {/* Avatar Stack for Group or Single Avatar */}
        <div className="flex items-center -space-x-2 overflow-hidden">
            {chat.isGroup && chat.participants ? (
                <>
                {chat.participants.slice(0, 3).map((p, i) => (
                    <Avatar key={p._id || i} src={p.avatar} fallback={p.name[0]} size={40} className="border-2 border-[#1a1d21]" />
                ))}
                {chat.participants.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-[#1a1d21] flex items-center justify-center text-xs font-medium relative z-10">
                        +{chat.participants.length - 3}
                    </div>
                )}
                </>
            ) : (
                <div className="relative">
                    <Avatar src={primaryOther?.avatar} fallback={title.charAt(0)} size={44} />
                    {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1a1d21] rounded-full"></span>}
                </div>
            )}
            
            {/* Add Button (Visual) */}
            <button className="w-10 h-10 rounded-full bg-[#25282e] hover:bg-slate-700 text-blue-400 flex items-center justify-center ml-2 transition-colors border border-transparent hover:border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
      </div>
      
      {/* Centered Title Area */}
      <div className="flex flex-col items-center">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
           {/* If group, show member count or nothing */}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
         <button className="w-10 h-10 rounded-full bg-[#00d26a] text-[#020617] flex items-center justify-center hover:bg-[#00b359] transition-all shadow-[0_0_15px_rgba(0,210,106,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
         </button>
         
         <button className="w-10 h-10 rounded-full bg-[#25282e] text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all" onClick={onGroupInfoClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
         </button>

         <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
         </button>
      </div>

    </header>
  );
};

export default ChatHeader;
