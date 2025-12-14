import React from "react";
import Avatar from "../ui/Avatar";

const RightPanel = ({ chat, currentUserId, onlineUsers }) => {
  if (!chat) return null;

  const isGroup = chat.isGroup;
  
  // Logic to find 'other' user if single chat
  const otherUser = !isGroup 
    ? chat.participants.find(p => (p._id || p.id) !== currentUserId) 
    : null;

  const displayUser = isGroup ? { name: chat.name, avatar: chat.avatar } : otherUser;
  const isOnline = !isGroup && otherUser && onlineUsers.includes(otherUser._id || otherUser.id);

  return (
    <div className="hidden lg:flex flex-col w-[300px] border-l border-slate-200 bg-white h-full">
      {/* Profile / Chat Info Section */}
      <div className="p-8 flex flex-col items-center border-b border-slate-100">
        
        {/* Navigation / Actions (Top Right) */}
        <div className="w-full flex justify-between items-center mb-6 text-slate-400">
             <button className="hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg></button>
             <div className="flex gap-4">
                 <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                 </button>
             </div>
        </div>

        <div className="relative mb-4">
            <Avatar src={displayUser?.avatar} fallback={displayUser?.name?.charAt(0)} size={80} />
            {isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></span>
            )}
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-1">{displayUser?.name}</h2>
        <p className="text-sm text-slate-500 mb-6 font-medium">
            {isGroup ? "Group Chat" : (isOnline ? "Active Now" : "Offline")}
        </p>
        
        <div className="flex gap-4 w-full justify-center">
            <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
        </div>
      </div>

      {/* Shared Files Section (Example Content) */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-4 cursor-pointer hover:opacity-80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shared Files</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200 hover:border-blue-400 transition-all cursor-pointer group relative">
                      <div className={`w-full h-full bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-300 bg-[url('https://picsum.photos/seed/${i+20}/200')]`} />
                  </div>
              ))}
              
              <div className="aspect-square rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Docs.pdf</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default RightPanel;
