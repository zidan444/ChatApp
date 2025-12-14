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
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0 h-[80px] z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Back button for mobile */}
        <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
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
                    <Avatar key={p._id || i} src={p.avatar} fallback={p.name[0]} size={40} className="border-2 border-white ring-1 ring-slate-100" />
                ))}
                {chat.participants.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-500 relative z-10">
                        +{chat.participants.length - 3}
                    </div>
                )}
                </>
            ) : (
                <div className="relative">
                    <Avatar src={primaryOther?.avatar} fallback={title.charAt(0)} size={44} />
                    {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                </div>
            )}
        </div>
        
        {/* Title Area - Left aligned now for standard feel */}
        <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{title}</h2>
            {isOnline ? (
                <span className="text-xs text-green-600 font-medium">Online</span>
            ) : (
                 <span className="text-xs text-slate-400">Offline</span>
            )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
         <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-200">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
             </svg>
         </button>
         
         <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263-12.63a1.125 1.125 0 011.382-.965l12.63 1.263a1.125 1.125 0 01.965 1.382l-1.263 12.63a1.125 1.125 0 01-1.382.965l-12.63-1.263a1.125 1.125 0 01-.965-1.382z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l-11.25 7.5" /> 
                <path d="M4.5 5.25A.75.75 0 015.25 4.5h1.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" />
                {/* Just using video icon stub */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
             </svg>
         </button>
         
         <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                onGroupInfoClick /* Using this prop as toggle */ 
                ? "bg-slate-100 text-slate-800 border-slate-300"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`} 
            onClick={onGroupInfoClick}
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
         </button>
      </div>

    </header>
  );
};

export default ChatHeader;
